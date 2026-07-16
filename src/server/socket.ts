import { Server as SocketIOServer, Socket } from "socket.io";
import { createRoom, joinRoom, removePlayer, setPlayerDisconnected, isPlayerTurn } from "@/game-engine/room";
import { startGame, playCard, drawCard, playDrawnCard, passTurn, callUno, chooseColor, processTurnTimeout } from "@/game-engine/game";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { isPlayable, requiresColorChoice } from "@/game-engine/rules";
import { getRoom, setRoom, deleteRoom, mapSocketToPlayer, removeSocketMapping, getRoomBySocketId, getPlayerIdBySocketId, getSocketId } from "./rooms";
import { Room, PlayerGameState, PlayerPublic, Card, Color } from "@/game-engine/types";

const TURN_TIMEOUT = 15000;

const roomTimers = new Map<string, ReturnType<typeof setTimeout>>();
const timerStartedAt = new Map<string, number>();

function clearRoomTimer(roomId: string): void {
  const t = roomTimers.get(roomId);
  if (t) clearTimeout(t);
  roomTimers.delete(roomId);
  timerStartedAt.delete(roomId);
}

function startTurnTimer(io: SocketIOServer, room: Room, roomId: string): void {
  clearRoomTimer(roomId);
  timerStartedAt.set(roomId, Date.now());
  const timer = setTimeout(() => {
    const r = getRoom(roomId);
    if (!r || r.status !== "playing") return;
    const cp = r.players[r.currentPlayerIndex];
    if (!cp) return;
    const updated = processTurnTimeout(r, cp.id);
    setRoom(roomId, updated);
    sendYourState(io, updated);
  }, TURN_TIMEOUT);
  roomTimers.set(roomId, timer);
}

function sendYourState(io: SocketIOServer, room: Room): void {
  const topCard = room.discardPile[room.discardPile.length - 1];
  const currentPlayer = room.players[room.currentPlayerIndex];
  for (const player of room.players) {
    const sockId = getSocketId(player.id);
    if (!sockId) continue;
    const isMyTurn = player.id === currentPlayer?.id;
    const chainBlocksNormalPlay = room.stackChain && (room.stackChain.type === "draw2" || room.stackChain.type === "wild4");
    const canPlay = isMyTurn && !chainBlocksNormalPlay && player.hand.some((c) => {
      return isPlayable(c, topCard, room.currentColor);
    });
    const drawnCard = room.lastDrawnCard[player.id];
    const canStack = isMyTurn && room.stackChain
      ? player.hand.some((c) => c.type === room.stackChain!.type)
      : false;
    const state: PlayerGameState = {
      hand: player.hand,
      currentCard: topCard,
      currentColor: room.currentColor,
      drawPileCount: room.drawPile.length,
      direction: room.direction,
      players: room.players.map((p) => ({ id: p.id, name: p.name, cardCount: p.hand.length })),
      currentPlayerId: currentPlayer?.id || "",
      turnTimer: isMyTurn ? Math.max(0, Math.ceil((TURN_TIMEOUT - (Date.now() - (timerStartedAt.get(room.id) ?? Date.now()))) / 1000)) : 0,
      calledUno: room.calledUno[player.id] || false,
      canPlay,
      canStack,
      isDrawing: isMyTurn && drawnCard != null,
      drawnCardPlayable: isMyTurn && drawnCard != null
        ? isPlayable(drawnCard, topCard, room.currentColor)
        : false,
    };
    io.to(sockId).emit("game:your-state", state);
  }
}

function toPublic(p: { id: string; name: string; hand: Card[] }): PlayerPublic {
  return { id: p.id, name: p.name, cardCount: p.hand.length };
}

function handlePlay(
  io: SocketIOServer,
  socket: Socket,
  room: Room,
  playerId: string,
  afterPlay: (r: Room, pid: string) => Room
): void {
  clearRoomTimer(room.id);
  let updated = afterPlay(room, playerId);

  if (updated.status === "finished") {
    setRoom(room.id, updated);
    io.to(room.id).emit("game:end", {
      winner: toPublic(updated.winner!),
      ranking: updated.ranking,
    });
    roomTimers.delete(room.id);
    return;
  }

  const lastCard = updated.discardPile[updated.discardPile.length - 1];
  if (requiresColorChoice(lastCard)) {
    setRoom(room.id, updated);
    const sid = getSocketId(updated.players[updated.currentPlayerIndex].id);
    if (sid) io.to(sid).emit("game:color-prompt", {});
    return;
  }

  const isSpecial = ["skip", "reverse", "draw2", "wild", "wild4"].includes(lastCard.type);
  if (lastCard.type === "reverse" && updated.stackChain) {
    updated = resolveStack(updated);
  } else if (isSpecial && updated.stackChain) {
    updated = advanceAfterStack(updated);
  } else if (!isSpecial) {
    updated = resolveStack(updated);
  }

  setRoom(room.id, updated);
  if (updated.status === "finished") {
    io.to(room.id).emit("game:end", {
      winner: toPublic(updated.winner!),
      ranking: updated.ranking,
    });
    roomTimers.delete(room.id);
    return;
  }

  startTurnTimer(io, updated, room.id);
  sendYourState(io, updated);
}

const VALID_NAME_RE = /^[\p{L}\p{N} _-]{1,20}$/u;
const VALID_ROOM_RE = /^[A-Z0-9]{1,6}$/;

function validateName(name: unknown): string | null {
  if (typeof name !== "string" || !name.trim()) return "Nome nao pode ser vazio";
  if (!VALID_NAME_RE.test(name.trim())) return "Nome deve ter 1-20 caracteres (letras, numeros, espacos, _, -)";
  return null;
}

function validateRoomCode(code: unknown): string | null {
  if (typeof code !== "string" || !code.trim()) return "Codigo da sala nao pode ser vazio";
  if (!VALID_ROOM_RE.test(code.trim().toUpperCase())) return "Codigo invalido (use A-Z e 0-9, ate 6 digitos)";
  return null;
}

export function setupSocket(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {

    socket.on("room:create", ({ playerName }: { playerName: string }) => {
      const err = validateName(playerName);
      if (err) { socket.emit("error", { message: err }); return; }
      const room = createRoom(playerName.trim());
      setRoom(room.id, room);
      const player = room.players[0];
      mapSocketToPlayer(socket.id, room.id, player.id);
      socket.join(room.id);
      socket.emit("player:id", player.id);
      socket.emit("room:state", room);
    });

    socket.on("room:join", ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
      const codeErr = validateRoomCode(roomCode);
      if (codeErr) { socket.emit("error", { message: codeErr }); return; }
      const nameErr = validateName(playerName);
      if (nameErr) { socket.emit("error", { message: nameErr }); return; }
      const room = getRoom(roomCode.trim().toUpperCase());
      if (!room) { socket.emit("error", { message: "Sala nao encontrada" }); return; }
      if (room.status !== "lobby") { socket.emit("error", { message: "Jogo ja iniciado nesta sala" }); return; }
      if (room.players.length >= 15) { socket.emit("error", { message: "Sala cheia (maximo 15 jogadores)" }); return; }
      try {
        const updated = joinRoom(room, playerName.trim());
        setRoom(room.id, updated);
          const player = updated.players[updated.players.length - 1];
        mapSocketToPlayer(socket.id, room.id, player.id);
        socket.join(room.id);
        socket.emit("player:id", player.id);
        io.to(room.id).emit("room:state", updated);
      } catch (e: any) {
        socket.emit("error", { message: e.message });
      }
    });

    socket.on("room:start", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room) { socket.emit("error", { message: "Voce nao esta em nenhuma sala" }); return; }
      const playerId = getPlayerIdBySocketId(socket.id);
      if (room.host !== playerId) { socket.emit("error", { message: "Apenas o host pode iniciar a partida" }); return; }
      if (room.players.length < 2) { socket.emit("error", { message: "Minimo de 2 jogadores para iniciar" }); return; }
      try {
        const started = startGame(room);
        setRoom(room.id, started);
          io.to(room.id).emit("room:state", { ...started, status: "playing" } as Room);
        startTurnTimer(io, started, room.id);
        sendYourState(io, started);
      } catch (e: any) {
        socket.emit("error", { message: e.message });
      }
    });

    socket.on("game:play-card", ({ cardIndex }: { cardIndex: number }) => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) {
        socket.emit("error", { message: "Nao e seu turno" });
        return;
      }
      if (room.stackChain && requiresColorChoice(room.discardPile[room.discardPile.length - 1])) {
        socket.emit("error", { message: "Escolha uma cor primeiro" });
        return;
      }
      try {
        handlePlay(io, socket, room, playerId, (r, pid) => playCard(r, pid, cardIndex));
      } catch (e: any) {
        socket.emit("error", { message: e.message });
      }
    });

    socket.on("game:draw-card", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) {
        socket.emit("error", { message: "Nao e seu turno" });
        return;
      }
      if (room.stackChain && requiresColorChoice(room.discardPile[room.discardPile.length - 1])) {
        socket.emit("error", { message: "Escolha uma cor primeiro" });
        return;
      }
      try {
        if (room.stackChain) {
          const resolved = resolveStack(room);
          setRoom(room.id, resolved);
              startTurnTimer(io, resolved, room.id);
          sendYourState(io, resolved);
          return;
        }
        const updated = drawCard(room, playerId);
        setRoom(room.id, updated);
          sendYourState(io, updated);
      } catch (e: any) {
        socket.emit("error", { message: e.message });
      }
    });

    socket.on("game:play-drawn-card", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) {
        socket.emit("error", { message: "Nao e seu turno" });
        return;
      }
      if (room.stackChain && requiresColorChoice(room.discardPile[room.discardPile.length - 1])) {
        socket.emit("error", { message: "Escolha uma cor primeiro" });
        return;
      }
      try {
        handlePlay(io, socket, room, playerId, playDrawnCard);
      } catch (e: any) {
        socket.emit("error", { message: e.message });
      }
    });

    socket.on("game:pass", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) {
        socket.emit("error", { message: "Nao e seu turno" });
        return;
      }
      if (room.stackChain && requiresColorChoice(room.discardPile[room.discardPile.length - 1])) {
        socket.emit("error", { message: "Escolha uma cor primeiro" });
        return;
      }
      clearRoomTimer(room.id);
      if (room.stackChain) {
        const resolved = resolveStack(room);
        setRoom(room.id, resolved);
          startTurnTimer(io, resolved, room.id);
        sendYourState(io, resolved);
        return;
      }
      const updated = passTurn(room, playerId);
      setRoom(room.id, updated);
      startTurnTimer(io, updated, room.id);
      sendYourState(io, updated);
    });

    socket.on("game:call-uno", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId) return;
      const updated = callUno(room, playerId);
      setRoom(room.id, updated);
      sendYourState(io, updated);
    });

    socket.on("game:choose-color", ({ color }: { color: string }) => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) {
        socket.emit("error", { message: "Nao e seu turno" });
        return;
      }
      const valid = ["red", "blue", "green", "yellow"];
      if (!valid.includes(color)) {
        socket.emit("error", { message: "Cor invalida. Use: red, blue, green ou yellow" });
        return;
      }
      let updated = chooseColor(room, color as Color);
      if (updated.stackChain?.type === "wild4") {
        updated = advanceAfterStack(updated);
      } else {
        updated = resolveStack(updated);
      }
      setRoom(room.id, updated);
      if (updated.status === "finished") {
        io.to(room.id).emit("game:end", {
          winner: toPublic(updated.winner!),
          ranking: updated.ranking,
        });
        roomTimers.delete(room.id);
        return;
      }
      startTurnTimer(io, updated, room.id);
      sendYourState(io, updated);
    });

    socket.on("game:playAgain", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room) return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId) return;
      const votes = [...new Set([...room.playAgainVotes, playerId])];
      const connectedCount = room.players.filter((p) => p.connected).length;
      const updated = { ...room, playAgainVotes: votes };
      setRoom(room.id, updated);
      io.to(room.id).emit("room:state", updated);

      if (votes.length >= connectedCount && connectedCount >= 2) {
        clearRoomTimer(room.id);
        const fresh = startGame({
          ...room,
          status: "lobby",
          players: room.players.filter((p) => p.connected).map((p) => ({ ...p, hand: [] })),
        });
        setRoom(room.id, fresh);
        io.to(room.id).emit("room:state", { ...fresh, status: "playing" } as any);
        startTurnTimer(io, fresh, room.id);
        sendYourState(io, fresh);
      }
    });

    socket.on("disconnect", () => {
      const mapping = removeSocketMapping(socket.id);
      if (!mapping) return;
      const room = getRoom(mapping.roomId);
      if (!room) return;
      clearRoomTimer(mapping.roomId);
      const updated = setPlayerDisconnected(room, mapping.playerId);
      setRoom(mapping.roomId, updated);
      io.to(mapping.roomId).emit("room:state", updated);
      setTimeout(() => {
        const r = getRoom(mapping.roomId);
        if (r) {
          const p = r.players.find((x) => x.id === mapping.playerId);
          if (p && !p.connected) {
            const cleaned = removePlayer(r, mapping.playerId);
            clearRoomTimer(mapping.roomId);
            if (cleaned.players.length === 0) {
              deleteRoom(mapping.roomId);
            } else {
              setRoom(mapping.roomId, cleaned);
              io.to(mapping.roomId).emit("room:state", cleaned);
              if (cleaned.status === "playing") sendYourState(io, cleaned);
            }
          }
        }
      }, 60000);
    });
  });
}

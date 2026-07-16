import { Server as SocketIOServer, Socket } from "socket.io";
import { createRoom, joinRoom, removePlayer, setPlayerDisconnected, isPlayerTurn } from "@/game-engine/room";
import { startGame, playCard, drawCard, playDrawnCard, passTurn, callUno, chooseColor, checkWin, processTurnTimeout } from "@/game-engine/game";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { isPlayable, requiresColorChoice } from "@/game-engine/rules";
import { getRoom, setRoom, deleteRoom, mapSocketToPlayer, removeSocketMapping, getRoomBySocketId, getPlayerIdBySocketId, getSocketId } from "./rooms";
import { PlayerGameState } from "@/game-engine/types";

const TURN_TIMEOUT = 15000;
const roomTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function setupSocket(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {

    socket.on("room:create", ({ playerName }: { playerName: string }) => {
      if (!playerName?.trim()) { socket.emit("error", { message: "Nome nao pode ser vazio" }); return; }
      const room = createRoom(playerName.trim());
      setRoom(room.id, room);
      const player = room.players[0];
      mapSocketToPlayer(socket.id, room.id, player.id);
      socket.join(room.id);
      socket.emit("player:id", player.id);
      socket.emit("room:state", room);
    });

    socket.on("room:join", ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
      const room = getRoom(roomCode?.toUpperCase());
      if (!room) { socket.emit("error", { message: "Sala nao encontrada" }); return; }
      if (!playerName?.trim()) { socket.emit("error", { message: "Nome nao pode ser vazio" }); return; }
      try {
        const updated = joinRoom(room, playerName.trim());
        setRoom(room.id, updated);
        const player = updated.players[updated.players.length - 1];
        mapSocketToPlayer(socket.id, room.id, player.id);
        socket.join(room.id);
        socket.emit("player:id", player.id);
        io.to(room.id).emit("room:state", updated);
      } catch (e: any) { socket.emit("error", { message: e.message }); }
    });

    socket.on("room:start", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room) return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (room.host !== playerId) { socket.emit("error", { message: "Apenas o host pode iniciar" }); return; }
      try {
        const started = startGame(room);
        setRoom(room.id, started);
        io.to(room.id).emit("room:state", { ...started, status: "playing" });
        startTurnTimer(io, started, room.id);
        sendYourState(io, started);
      } catch (e: any) { socket.emit("error", { message: e.message }); }
    });

    socket.on("game:play-card", ({ cardIndex }: { cardIndex: number }) => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) { socket.emit("error", { message: "Nao e seu turno" }); return; }
      try {
        clearRoomTimer(room.id);
        let updated = playCard(room, playerId, cardIndex);
        if (updated.status === "finished") { setRoom(room.id, updated); io.to(room.id).emit("game:end", { winner: toPublic(updated.winner!), ranking: updated.ranking }); return; }
        if (requiresColorChoice(updated.discardPile[updated.discardPile.length - 1])) {
          setRoom(room.id, updated);
          const sid = getSocketId(updated.players[updated.currentPlayerIndex].id);
          if (sid) io.to(sid).emit("game:color-prompt", {});
          return;
        }
        const isSpecial = ["skip", "reverse", "draw2", "wild", "wild4"].includes(updated.discardPile[updated.discardPile.length - 1].type);
        if (!isSpecial || !updated.stackChain) {
          if (!isSpecial) updated = resolveStack(updated);
        } else {
          updated = advanceAfterStack(updated);
        }
        setRoom(room.id, updated);
        if (updated.status === "finished") { io.to(room.id).emit("game:end", { winner: toPublic(updated.winner!), ranking: updated.ranking }); return; }
        startTurnTimer(io, updated, room.id);
        sendYourState(io, updated);
      } catch (e: any) { socket.emit("error", { message: e.message }); }
    });

    socket.on("game:draw-card", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) { socket.emit("error", { message: "Nao e seu turno" }); return; }
      try {
        let currentRoom = room;
        if (room.stackChain) {
          currentRoom = resolveStack(room);
          setRoom(room.id, currentRoom);
          startTurnTimer(io, currentRoom, room.id);
          sendYourState(io, currentRoom);
          return;
        }
        const updated = drawCard(currentRoom, playerId);
        setRoom(room.id, updated);
        sendYourState(io, updated);
      } catch (e: any) { socket.emit("error", { message: e.message }); }
    });

    socket.on("game:play-drawn-card", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) { socket.emit("error", { message: "Nao e seu turno" }); return; }
      try {
        clearRoomTimer(room.id);
        let updated = playDrawnCard(room, playerId);
        if (updated.status === "finished") { setRoom(room.id, updated); io.to(room.id).emit("game:end", { winner: toPublic(updated.winner!), ranking: updated.ranking }); return; }
        if (requiresColorChoice(updated.discardPile[updated.discardPile.length - 1])) {
          setRoom(room.id, updated);
          const sid = getSocketId(updated.players[updated.currentPlayerIndex].id);
          if (sid) io.to(sid).emit("game:color-prompt", {});
          return;
        }
        const isSpecial = ["skip", "reverse", "draw2", "wild", "wild4"].includes(updated.discardPile[updated.discardPile.length - 1].type);
        if (!isSpecial || !updated.stackChain) {
          if (!isSpecial) updated = resolveStack(updated);
        } else {
          updated = advanceAfterStack(updated);
        }
        setRoom(room.id, updated);
        if (updated.status === "finished") { io.to(room.id).emit("game:end", { winner: toPublic(updated.winner!), ranking: updated.ranking }); return; }
        startTurnTimer(io, updated, room.id);
        sendYourState(io, updated);
      } catch (e: any) { socket.emit("error", { message: e.message }); }
    });

    socket.on("game:pass", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) { socket.emit("error", { message: "Nao e seu turno" }); return; }
      clearRoomTimer(room.id);
      let currentRoom = room;
      if (room.stackChain) {
        currentRoom = resolveStack(room);
      }
      const updated = passTurn(currentRoom, playerId);
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
      const valid = ["red", "blue", "green", "yellow"];
      if (!valid.includes(color)) { socket.emit("error", { message: "Cor invalida" }); return; }
      let updated = chooseColor(room, color as any);
      updated = resolveStack(updated);
      setRoom(room.id, updated);
      if (updated.status === "finished") { io.to(room.id).emit("game:end", { winner: toPublic(updated.winner!), ranking: updated.ranking }); return; }
      startTurnTimer(io, updated, room.id);
      sendYourState(io, updated);
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
            if (cleaned.players.length === 0) deleteRoom(mapping.roomId);
            else { setRoom(mapping.roomId, cleaned); io.to(mapping.roomId).emit("room:state", cleaned); if (cleaned.status === "playing") sendYourState(io, cleaned); }
          }
        }
      }, 60000);
    });
  });
}

function clearRoomTimer(roomId: string) { const t = roomTimers.get(roomId); if (t) clearTimeout(t); roomTimers.delete(roomId); }

function startTurnTimer(io: SocketIOServer, room: any, roomId: string) {
  clearRoomTimer(roomId);
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

function sendYourState(io: SocketIOServer, room: any) {
  const topCard = room.discardPile[room.discardPile.length - 1];
  const currentPlayer = room.players[room.currentPlayerIndex];
  for (const player of room.players) {
    const sockId = getSocketId(player.id);
    if (!sockId) continue;
    const isMyTurn = player.id === currentPlayer?.id;
    const canPlay = isMyTurn && player.hand.some((c: any) => isPlayable(c, topCard, room.currentColor));
    const drawnCard = room.lastDrawnCard[player.id];
    const canStack = isMyTurn && room.stackChain ? player.hand.some((c: any) => c.type === room.stackChain.type) : false;
    const state: PlayerGameState = {
      hand: player.hand, currentCard: topCard, currentColor: room.currentColor,
      drawPileCount: room.drawPile.length, direction: room.direction,
      players: room.players.map((p: any) => ({ id: p.id, name: p.name, cardCount: p.hand.length })),
      currentPlayerId: currentPlayer?.id || "", turnTimer: isMyTurn ? TURN_TIMEOUT / 1000 : 0,
      calledUno: room.calledUno[player.id] || false,
      canPlay, canStack,
      isDrawing: isMyTurn && drawnCard != null,
      drawnCardPlayable: isMyTurn && drawnCard != null ? isPlayable(drawnCard, topCard, room.currentColor) : false,
    };
    io.to(sockId).emit("game:your-state", state);
  }
}

function toPublic(p: any) { return { id: p.id, name: p.name, cardCount: p.hand.length }; }

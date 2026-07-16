import { Room, Player } from "./types";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function createRoom(playerName: string): Room {
  const player: Player = { id: Math.random().toString(36).slice(2, 10), name: playerName, hand: [], connected: true };
  return {
    id: generateCode(), host: player.id, players: [player], status: "lobby",
    drawPile: [], discardPile: [], currentColor: "red", direction: 1,
    currentPlayerIndex: 0, turnTimer: 15, calledUno: {}, stackChain: null,
    winner: null, ranking: [], lastDrawnCard: {},
  };
}

export function joinRoom(room: Room, playerName: string): Room {
  if (room.status !== "lobby") throw new Error("Jogo ja iniciado");
  if (room.players.length >= 15) throw new Error("Sala cheia (maximo 15 jogadores)");
  const player: Player = { id: Math.random().toString(36).slice(2, 10), name: playerName, hand: [], connected: true };
  return { ...room, players: [...room.players, player] };
}

export function removePlayer(room: Room, playerId: string): Room {
  const remaining = room.players.filter((p) => p.id !== playerId);
  const newHost = room.host === playerId && remaining.length > 0 ? remaining[0].id : room.host;
  return { ...room, players: remaining, host: newHost };
}

export function setPlayerDisconnected(room: Room, playerId: string): Room {
  return { ...room, players: room.players.map((p) => p.id === playerId ? { ...p, connected: false } : p) };
}

export function isPlayerTurn(room: Room, playerId: string): boolean {
  return room.players[room.currentPlayerIndex]?.id === playerId;
}

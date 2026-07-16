import { Room } from "@/game-engine/types";

const rooms = new Map<string, Room>();

export function getRoom(roomId: string): Room | undefined { return rooms.get(roomId); }
export function setRoom(roomId: string, room: Room): void { rooms.set(roomId, room); }
export function deleteRoom(roomId: string): void { rooms.delete(roomId); }

const socketToPlayer = new Map<string, { roomId: string; playerId: string }>();
const playerToSocket = new Map<string, string>();

export function mapSocketToPlayer(socketId: string, roomId: string, playerId: string): void {
  socketToPlayer.set(socketId, { roomId, playerId });
  playerToSocket.set(playerId, socketId);
}

export function removeSocketMapping(socketId: string): { roomId: string; playerId: string } | undefined {
  const mapping = socketToPlayer.get(socketId);
  if (mapping) { socketToPlayer.delete(socketId); playerToSocket.delete(mapping.playerId); }
  return mapping;
}

export function getSocketId(playerId: string): string | undefined { return playerToSocket.get(playerId); }

export function getRoomBySocketId(socketId: string): Room | undefined {
  const m = socketToPlayer.get(socketId);
  return m ? rooms.get(m.roomId) : undefined;
}

export function getPlayerIdBySocketId(socketId: string): string | undefined {
  return socketToPlayer.get(socketId)?.playerId;
}

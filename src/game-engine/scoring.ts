import { Room, PlayerPublic } from "./types";

export function buildRanking(room: Room): PlayerPublic[] {
  return [...room.players]
    .sort((a, b) => a.hand.length - b.hand.length)
    .map((p) => ({ id: p.id, name: p.name, cardCount: p.hand.length }));
}

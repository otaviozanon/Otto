import { Card, Room } from "./types";
import { draw, shuffle } from "./deck";

const DRAW_MAP: Record<string, number> = { draw2: 2, wild4: 4 };

export function resolveStack(room: Room): Room {
  const chain = room.stackChain;
  if (!chain) return room;

  let updated = { ...room };

  if (chain.type === "draw2" || chain.type === "wild4") {
    const drawCount = DRAW_MAP[chain.type] * chain.count;
    const victimIdx = updated.currentPlayerIndex;
    let currentDraw = updated.drawPile;

    for (let i = 0; i < drawCount; i++) {
      if (currentDraw.length === 0) {
        currentDraw = shuffle([...updated.discardPile.slice(0, -1)]);
        updated = { ...updated, discardPile: [updated.discardPile[updated.discardPile.length - 1]] };
      }
      const { card, remaining } = draw(currentDraw);
      currentDraw = remaining;
      updated = {
        ...updated,
        players: updated.players.map((p, idx) =>
          idx === victimIdx ? { ...p, hand: [...p.hand, card] } : p
        ),
      };
    }
    updated = { ...updated, drawPile: currentDraw, stackChain: null };
    updated = advanceAfterStack(updated);
    updated = advanceAfterStack(updated);
    return updated;
  }

  if (chain.type === "skip") {
    for (let i = 0; i < chain.count; i++) updated = advanceAfterStack(updated);
    return { ...updated, stackChain: null };
  }

  if (chain.type === "reverse") {
    const newDir = (chain.count % 2 === 1 ? updated.direction * -1 : updated.direction) as 1 | -1;
    updated = { ...updated, direction: newDir };
    if (updated.players.length === 2) {
      return { ...updated, stackChain: null };
    }
    for (let i = 0; i < chain.count; i++) {
      updated = advanceAfterStack(updated);
    }
    return { ...updated, stackChain: null, direction: newDir };
  }

  if (chain.type === "wild") {
    for (let i = 0; i < chain.count; i++) updated = advanceAfterStack(updated);
    return { ...updated, stackChain: null };
  }

  return updated;
}

export function advanceAfterStack(room: Room): Room {
  const n = room.players.length;
  return { ...room, currentPlayerIndex: ((room.currentPlayerIndex + room.direction) % n + n) % n };
}

export function getNextPlayerIndex(room: Room): number {
  const n = room.players.length;
  return ((room.currentPlayerIndex + room.direction) % n + n) % n;
}

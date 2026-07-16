import { describe, it, expect } from "vitest";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { Card, Room } from "@/game-engine/types";

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "test", host: "p1",
    players: [
      { id: "p1", name: "A", hand: [], connected: true },
      { id: "p2", name: "B", hand: [], connected: true },
      { id: "p3", name: "C", hand: [], connected: true },
    ],
    status: "playing", drawPile: Array(20).fill({ type: "number", color: "red", value: 1 } as Card),
    discardPile: [{ type: "number", color: "blue", value: 5 } as Card],
    currentColor: "blue", direction: 1, currentPlayerIndex: 0,
    turnTimer: 15, calledUno: {}, stackChain: null, winner: null, ranking: [], playAgainVotes: [], lastDrawnCard: {},
    ...overrides,
  };
}

describe("resolveStack", () => {
  it("draw2: current player draws 2", () => { const r = resolveStack(makeRoom({ stackChain: { type: "draw2", count: 1 } })); expect(r.players[0].hand).toHaveLength(2); });
  it("draw2 x2: draws 4", () => { const r = resolveStack(makeRoom({ stackChain: { type: "draw2", count: 2 } })); expect(r.players[0].hand).toHaveLength(4); });
  it("wild4 x3: draws 12", () => { const r = resolveStack(makeRoom({ stackChain: { type: "wild4", count: 3 } })); expect(r.players[0].hand).toHaveLength(12); });
  it("skip x2: skips 2", () => { const r = resolveStack(makeRoom({ stackChain: { type: "skip", count: 2 } })); expect(r.currentPlayerIndex).toBe(2); });
  it("reverse: inverts", () => { const r = resolveStack(makeRoom({ stackChain: { type: "reverse", count: 1 } })); expect(r.direction).toBe(-1); });
  it("reverse 2p = skip", () => {
    const room = makeRoom({ players: makeRoom().players.slice(0, 2), stackChain: { type: "reverse", count: 1 } });
    expect(resolveStack(room).currentPlayerIndex).toBe(0);
  });
  it("wild clears", () => { expect(resolveStack(makeRoom({ stackChain: { type: "wild", count: 1 } })).stackChain).toBeNull(); });
});

describe("advanceAfterStack", () => {
  it("forward", () => expect(advanceAfterStack(makeRoom({ currentPlayerIndex: 0, direction: 1 })).currentPlayerIndex).toBe(1));
  it("backward", () => expect(advanceAfterStack(makeRoom({ currentPlayerIndex: 1, direction: -1 })).currentPlayerIndex).toBe(0));
  it("wraps forward", () => expect(advanceAfterStack(makeRoom({ currentPlayerIndex: 2, direction: 1 })).currentPlayerIndex).toBe(0));
  it("wraps backward", () => expect(advanceAfterStack(makeRoom({ currentPlayerIndex: 0, direction: -1 })).currentPlayerIndex).toBe(2));
});

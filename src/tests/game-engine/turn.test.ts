import { describe, it, expect } from "vitest";
import { startGame, drawCard, passTurn, processTurnTimeout } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";

describe("turn cycle", () => {
  it("draw then pass", () => {
    let s = startGame(joinRoom(createRoom("A"), "B"));
    const pid = s.players[0].id;
    let u = drawCard(s, pid);
    expect(u.lastDrawnCard[pid]).toBeDefined();
    u = passTurn(u, pid);
    expect(u.currentPlayerIndex).not.toBe(0);
  });
  it("timeout without draw", () => {
    let s = { ...startGame(joinRoom(createRoom("A"), "B")), lastDrawnCard: {} };
    const pid = s.players[0].id;
    const len = s.players[0].hand.length;
    const r = processTurnTimeout(s, pid);
    expect(r.players[0].hand).toHaveLength(len + 1);
    expect(r.currentPlayerIndex).not.toBe(0);
  });
  it("timeout after draw", () => {
    let s = startGame(joinRoom(createRoom("A"), "B"));
    const pid = s.players[0].id;
    s = drawCard(s, pid);
    const len = s.players[0].hand.length;
    const r = processTurnTimeout(s, pid);
    expect(r.players[0].hand).toHaveLength(len);
  });
});

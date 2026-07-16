import { describe, it, expect } from "vitest";
import { startGame, drawCard, callUno, checkWin, processTurnTimeout } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";

describe("startGame", () => {
  it("deals 7 cards each", () => {
    const s = startGame(joinRoom(joinRoom(createRoom("A"), "B"), "C"));
    for (const p of s.players) expect(p.hand).toHaveLength(7);
  });
  it("status playing", () => expect(startGame(joinRoom(createRoom("A"), "B")).status).toBe("playing"));
  it("first card not wild", () => {
    const top = startGame(joinRoom(createRoom("A"), "B")).discardPile.pop()!;
    expect(top.type).not.toBe("wild");
    expect(top.type).not.toBe("wild4");
  });
  it("throws <2", () => expect(() => startGame(createRoom("A"))).toThrow("Minimo de 2 jogadores"));
});

describe("drawCard", () => {
  it("adds card + sets lastDrawn", () => {
    const s = startGame(joinRoom(createRoom("A"), "B"));
    const pid = s.players[0].id;
    const r = drawCard(s, pid);
    expect(r.players[0].hand).toHaveLength(8);
    expect(r.lastDrawnCard[pid]).toBeDefined();
  });
});

describe("callUno", () => {
  it("marks uno", () => {
    const s = startGame(joinRoom(createRoom("A"), "B"));
    expect(callUno(s, s.players[0].id).calledUno[s.players[0].id]).toBe(true);
  });
});

describe("checkWin", () => {
  it("returns winner", () => {
    const s = startGame(joinRoom(createRoom("A"), "B"));
    const pid = s.players[0].id;
    const r = checkWin({ ...s, players: s.players.map((p) => p.id === pid ? { ...p, hand: [] } : p) });
    expect(r.winner!.id).toBe(pid);
  });
});

describe("processTurnTimeout", () => {
  it("auto-draws when no prior draw", () => {
    const s = { ...startGame(joinRoom(createRoom("A"), "B")), lastDrawnCard: {} };
    const pid = s.players[0].id;
    const len = s.players[0].hand.length;
    const r = processTurnTimeout(s, pid);
    expect(r.players[0].hand).toHaveLength(len + 1);
    expect(r.currentPlayerIndex).not.toBe(0);
  });
  it("no draw if already drew", () => {
    let s = startGame(joinRoom(createRoom("A"), "B"));
    const pid = s.players[0].id;
    s = drawCard(s, pid);
    const len = s.players[0].hand.length;
    const r = processTurnTimeout(s, pid);
    expect(r.players[0].hand).toHaveLength(len);
  });
});

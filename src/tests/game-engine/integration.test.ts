import { describe, it, expect } from "vitest";
import { startGame, playCard, drawCard, passTurn, chooseColor, processTurnTimeout } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { Card, Room } from "@/game-engine/types";

function isPlayableCheck(c: Card, top: Card, color: string): boolean {
  if (c.type === "wild" || c.type === "wild4") return true;
  if ("color" in c && c.color === color) return true;
  if (c.type !== "number" && top.type !== "number" && c.type === top.type) return true;
  if (c.type === "number" && top.type === "number" && c.value === top.value) return true;
  return false;
}

function advanceTurn(state: Room): Room {
  if (!state.stackChain) return advanceAfterStack(state);
  const lastCard = state.discardPile[state.discardPile.length - 1];
  const isSpecial = ["skip", "reverse", "draw2", "wild", "wild4"].includes(lastCard.type);
  if (isSpecial) return advanceAfterStack(state);
  return resolveStack(state);
}

describe("Full AI game simulation (2 players)", () => {
  it("completes without errors", () => {
    let room = joinRoom(createRoom("P1"), "P2");
    let s = startGame(room);
    let turns = 0;
    while (s.status === "playing" && turns < 800) {
      const cp = s.players[s.currentPlayerIndex];
      const top = s.discardPile[s.discardPile.length - 1];

      if (s.stackChain) {
        const si = cp.hand.findIndex((c) => c.type === s.stackChain!.type);
        if (si >= 0) {
          try { s = playCard(s, cp.id, si); s = advanceTurn(s); } catch { s = resolveStack(s); }
        } else {
          s = resolveStack(s);
        }
        turns++;
        continue;
      }

      const pi = cp.hand.findIndex((c) => isPlayableCheck(c, top, s.currentColor));
      if (pi >= 0) {
        try {
          s = playCard(s, cp.id, pi);
          s = advanceTurn(s);
        } catch {
          s = drawCard(s, cp.id);
          s = passTurn(s, cp.id);
        }
      } else {
        s = drawCard(s, cp.id);
        const drawn = s.lastDrawnCard[cp.id];
        if (drawn && isPlayableCheck(drawn, top, s.currentColor)) {
          try { s = playCard(s, cp.id, cp.hand.length - 1); s = advanceTurn(s); } catch { s = passTurn(s, cp.id); }
        } else {
          s = passTurn(s, cp.id);
        }
      }
      turns++;
    }
    expect(s.status).toBe("finished");
    expect(s.winner).toBeDefined();
  });
});

describe("+2 stacking: penalty accumulates", () => {
  it("victim draws accumulated penalty", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 30 }, () => ({ type: "number" as const, color: "red" as const, value: 1 })),
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "draw2", color: "red" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        { ...s.players[1], hand: [{ type: "draw2", color: "blue" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        { ...s.players[2], hand: [] as Card[] },
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceTurn(s);
    s = playCard(s, s.players[1].id, 0);
    s = advanceTurn(s);
    s = resolveStack(s);

    expect(s.players[2].hand.length).toBe(4);
    expect(s.stackChain).toBeNull();
  });

  it("single +2 draws 2 for victim", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 20 }, () => ({ type: "number" as const, color: "red" as const, value: 1 })),
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "draw2", color: "red" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        { ...s.players[1], hand: [] as Card[] },
        s.players[2],
      ],
    };
    s = playCard(s, s.players[0].id, 0);
    s = advanceTurn(s);
    s = resolveStack(s);
    expect(s.players[1].hand.length).toBe(2);
  });
});

describe("UNO penalty rules", () => {
  it("playing penultimate without UNO adds 2 cards", () => {
    let room = joinRoom(createRoom("P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red",
      drawPile: Array.from({ length: 10 }, () => ({ type: "number" as const, color: "red" as const, value: 1 })),
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [
          { type: "number", color: "red", value: 3 } as Card,
          { type: "number", color: "red", value: 7 } as Card,
        ]},
        s.players[1],
      ],
      calledUno: {},
    };
    s = playCard(s, s.players[0].id, 0);
    expect(s.players[0].hand.length).toBeGreaterThanOrEqual(2);
  });

  it("no penalty when UNO declared", () => {
    let room = joinRoom(createRoom("P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red",
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [
          { type: "number", color: "red", value: 3 } as Card,
          { type: "number", color: "red", value: 7 } as Card,
        ]},
        s.players[1],
      ],
      calledUno: { [s.players[0].id]: true },
    };
    s = playCard(s, s.players[0].id, 0);
    expect(s.players[0].hand.length).toBe(1);
  });
});

describe("Win condition", () => {
  it("game finishes when last card played with UNO", () => {
    let room = joinRoom(createRoom("P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red",
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "number", color: "red", value: 3 } as Card] },
        s.players[1],
      ],
      calledUno: { [s.players[0].id]: true },
    };
    s = playCard(s, s.players[0].id, 0);
    expect(s.status).toBe("finished");
    expect(s.winner!.id).toBe(s.players[0].id);
  });
});

describe("Stacking blocks non-stacking plays", () => {
  it("throws when playing non-stacking card with +2 pending", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red",
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "draw2", color: "red" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        { ...s.players[1], hand: [{ type: "number", color: "red", value: 3 } as Card] },
        s.players[2],
      ],
    };
    s = playCard(s, s.players[0].id, 0);
    s = advanceTurn(s);
    expect(() => playCard(s, s.players[1].id, 0)).toThrow("Voce deve empilhar ou comprar");
  });
});

describe("Turn timeout", () => {
  it("auto-draws and passes when no action", () => {
    let room = joinRoom(createRoom("P1"), "P2");
    let s = startGame(room);
    s = { ...s, lastDrawnCard: {} };
    const before = s.players[0].hand.length;
    s = processTurnTimeout(s, s.players[0].id);
    expect(s.players[0].hand).toHaveLength(before + 1);
    expect(s.currentPlayerIndex).toBe(1);
  });

  it("resolves stack chain on timeout", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red",
      drawPile: Array.from({ length: 20 }, () => ({ type: "number" as const, color: "red" as const, value: 1 })),
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "draw2", color: "red" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        { ...s.players[1], hand: [] as Card[] },
        s.players[2],
      ],
    };
    s = playCard(s, s.players[0].id, 0);
    s = advanceTurn(s);
    s = processTurnTimeout(s, s.players[1].id);
    expect(s.players[1].hand.length).toBe(2);
    expect(s.stackChain).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { startGame, playCard, drawCard, passTurn, chooseColor } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { isPlayable } from "@/game-engine/rules";
import { Card } from "@/game-engine/types";

function n(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }
function d2(color: string): Card { return { type: "draw2", color: color as any }; }
function w4(): Card { return { type: "wild4" }; }
function s(color: string): Card { return { type: "skip", color: color as any }; }

describe("P1 plays +2, P2 stacks +2 (REAL scenario)", () => {
  it("P2 can stack +2 even if different color from top card", () => {
    const room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 20 }, () => n("red", 1)),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [d2("red"), n("red", 3)] },
        { ...g.players[1], hand: [d2("blue"), n("blue", 7)] },
        g.players[2],
        g.players[3],
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    expect(g.stackChain).toEqual({ type: "draw2", count: 1 });

    g = advanceAfterStack(g);

    g = playCard(g, g.players[1].id, 0);
    expect(g.stackChain).toEqual({ type: "draw2", count: 2 });
  });

  it("chain resolves and victim draws accumulated 4 cards", () => {
    const room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 20 }, () => n("red", 1)),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [d2("red"), n("red", 3)] },
        { ...g.players[1], hand: [d2("blue"), n("red", 7)] },
        { ...g.players[2], hand: [n("red", 9)] },
        g.players[3],
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    g = advanceAfterStack(g);
    g = playCard(g, g.players[1].id, 0);
    g = advanceAfterStack(g);

    const before = g.players[2].hand.length;
    g = resolveStack(g);
    expect(g.players[2].hand.length).toBe(before + 4);
    expect(g.stackChain).toBeNull();
  });

  it("P2 draws when no +2 in hand, chain resolves", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 10 }, () => n("red", 1)),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [d2("red"), n("red", 3)] },
        { ...g.players[1], hand: [n("red", 7)] },
        g.players[2],
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    g = advanceAfterStack(g);

    const before = g.players[1].hand.length;
    g = resolveStack(g);
    expect(g.players[1].hand.length).toBe(before + 2);
  });
});

describe("P1 plays wild4, P2 stacks wild4 (REAL scenario)", () => {
  it("P2 can stack wild4 after P1's wild4 with color chosen", () => {
    const room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 30 }, () => n("red", 1)),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [w4(), n("red", 3)] },
        { ...g.players[1], hand: [w4(), n("red", 7)] },
        g.players[2],
        g.players[3],
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    expect(g.stackChain).toEqual({ type: "wild4", count: 1 });

    g = chooseColor(g, "blue");
    g = advanceAfterStack(g);

    g = playCard(g, g.players[1].id, 0);
    expect(g.stackChain).toEqual({ type: "wild4", count: 2 });
  });

  it("chain resolves with accumulated 8 cards for victim", () => {
    const room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 30 }, () => n("red", 1)),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [w4(), n("red", 3)] },
        { ...g.players[1], hand: [w4(), n("red", 7)] },
        { ...g.players[2], hand: [n("red", 9)] },
        g.players[3],
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    g = chooseColor(g, "blue");
    g = advanceAfterStack(g);

    g = playCard(g, g.players[1].id, 0);
    g = chooseColor(g, "green");
    g = advanceAfterStack(g);

    const before = g.players[2].hand.length;
    g = resolveStack(g);
    expect(g.players[2].hand.length).toBe(before + 8);
    expect(g.stackChain).toBeNull();
  });
});

describe("Drawn card playable + displays correctly", () => {
  it("drawn card matching color: isPlayable returns true", () => {
    expect(isPlayable(n("red", 7), n("red", 5), "red")).toBe(true);
  });

  it("drawn card NOT matching: isPlayable returns false", () => {
    expect(isPlayable(n("blue", 7), n("red", 5), "red")).toBe(false);
  });

  it("drawn wild is always playable", () => {
    expect(isPlayable(w4(), n("red", 5), "red")).toBe(true);
  });

  it("drawn +2 matching color: isPlayable returns true", () => {
    expect(isPlayable(d2("red"), n("red", 5), "red")).toBe(true);
  });
});

describe("canPlay vs canStack for penalty chains", () => {
  it("canPlay = false when draw2 chain exists and no +2 in hand", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [d2("red"), n("red", 3)] },
        { ...g.players[1], hand: [n("red", 7)] },
        g.players[2],
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    g = advanceAfterStack(g);

    const top = g.discardPile[g.discardPile.length - 1];
    const hand = g.players[1].hand;
    const hasStacking = hand.some((c: Card) => c.type === g.stackChain!.type);
    expect(hasStacking).toBe(false);

    const hasPlayable = hand.some((c: Card) => isPlayable(c, top, g.currentColor));
    expect(hasPlayable).toBe(true);
  });

  it("canStack = true when +2 in hand and draw2 chain exists", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [d2("red"), n("red", 3)] },
        { ...g.players[1], hand: [d2("blue"), n("red", 7)] },
        g.players[2],
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    g = advanceAfterStack(g);

    const hasStacking = g.players[1].hand.some((c: Card) => c.type === g.stackChain!.type);
    expect(hasStacking).toBe(true);
  });
});

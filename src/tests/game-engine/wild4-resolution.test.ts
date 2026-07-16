import { describe, it, expect } from "vitest";
import { startGame, playCard, chooseColor } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { requiresColorChoice } from "@/game-engine/rules";
import { Card } from "@/game-engine/types";

function n(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }
function w(): Card { return { type: "wild" }; }
function w4(): Card { return { type: "wild4" }; }

describe("Wild +4: color choice then next player", () => {
  it("P1 can play normally after P0's wild4 is resolved", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 20 }, () => n("red", 1)),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [w4(), n("red", 3)] },
        { ...g.players[1], hand: [n("red", 7)] },
        g.players[2],
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    expect(g.stackChain).toEqual({ type: "wild4", count: 1 });

    g = chooseColor(g, "blue");
    g = advanceAfterStack(g);
    g = resolveStack(g);
    expect(g.stackChain).toBeNull();

    const topCard = g.discardPile[g.discardPile.length - 1];
    expect(requiresColorChoice(topCard)).toBe(true);
    expect(g.stackChain).toBeNull();
  });
});

describe("Wild: color choice then next player", () => {
  it("P1 can play normally after P0's wild is resolved", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [w(), n("red", 3)] },
        { ...g.players[1], hand: [n("red", 7)] },
        g.players[2],
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    expect(g.stackChain).toEqual({ type: "wild", count: 1 });

    g = chooseColor(g, "blue");
    g = resolveStack(g);
    expect(g.stackChain).toBeNull();

    const topCard = g.discardPile[g.discardPile.length - 1];
    expect(requiresColorChoice(topCard)).toBe(true);
    expect(g.stackChain).toBeNull();
  });
});

describe("Wild+4 victim draws correct amount", () => {
  it("P2 draws 4 after P0's wild4", () => {
    const room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 20 }, () => n("red", 1)),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [w4(), n("red", 3)] },
        { ...g.players[1], hand: [n("red", 7)] },
        g.players[2],
        g.players[3],
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    g = chooseColor(g, "green");
    g = advanceAfterStack(g);

    const beforeP2 = g.players[1].hand.length;
    g = resolveStack(g);
    expect(g.players[1].hand.length).toBe(beforeP2 + 4);
    expect(g.stackChain).toBeNull();
  });
});

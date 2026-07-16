import { describe, it, expect } from "vitest";
import { startGame, playCard } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { resolveStack } from "@/game-engine/stacking";
import { Card } from "@/game-engine/types";

function n(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }
function s(color: string): Card { return { type: "skip", color: color as any }; }
function r(color: string): Card { return { type: "reverse", color: color as any }; }

describe("2 players: reverse then skip then normal", () => {
  it("P0 plays reverse, skip, number → all P0 turns", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0, direction: 1,
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [r("red"), s("red"), n("red", 3)] },
        { ...g.players[1], hand: [n("red", 7)] },
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    g = resolveStack(g);
    expect(g.currentPlayerIndex).toBe(0);

    g = playCard(g, g.players[0].id, 0);
    g = resolveStack(g);
    expect(g.currentPlayerIndex).toBe(0);

    g = playCard(g, g.players[0].id, 0);
    expect(g.discardPile[g.discardPile.length - 1].type).toBe("number");
  });

  it("P0 plays block, block, block, reverse, block, reverse, number → all P0 turns", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0, direction: 1,
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [s("red"), s("blue"), s("green"), r("red"), s("yellow"), r("blue"), n("red", 3)] },
        { ...g.players[1], hand: [n("red", 7)] },
      ],
    };

    g = playCard(g, g.players[0].id, 0); g = resolveStack(g);
    expect(g.currentPlayerIndex).toBe(0);

    g = playCard(g, g.players[0].id, 0); g = resolveStack(g);
    expect(g.currentPlayerIndex).toBe(0);

    g = playCard(g, g.players[0].id, 0); g = resolveStack(g);
    expect(g.currentPlayerIndex).toBe(0);

    g = playCard(g, g.players[0].id, 0); g = resolveStack(g);
    expect(g.currentPlayerIndex).toBe(0);

    g = playCard(g, g.players[0].id, 0); g = resolveStack(g);
    expect(g.currentPlayerIndex).toBe(0);

    g = playCard(g, g.players[0].id, 0); g = resolveStack(g);
    expect(g.currentPlayerIndex).toBe(0);

    g = playCard(g, g.players[0].id, 0);
    expect(g.discardPile[g.discardPile.length - 1].type).toBe("number");
  });
});

import { describe, it, expect } from "vitest";
import { startGame, playCard } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { Card } from "@/game-engine/types";

function n(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }
function r(color: string): Card { return { type: "reverse", color: color as any }; }

describe("Reverse: Otavio-Augusto-Zanon", () => {
  it("Augusto plays reverse → turn goes back to Otavio", () => {
    const room = joinRoom(joinRoom(createRoom("Otavio"), "Augusto"), "Zanon");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 1, direction: 1,
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [n("red", 3)] },
        { ...g.players[1], hand: [r("red"), n("red", 7)] },
        { ...g.players[2], hand: [n("red", 9)] },
      ],
    };

    g = playCard(g, g.players[1].id, 0);
    g = resolveStack(g);

    expect(g.direction).toBe(-1);
    expect(g.players[g.currentPlayerIndex].name).toBe("Otavio");

    g = playCard(g, g.players[g.currentPlayerIndex].id, 0);
    g = advanceAfterStack(g);

    expect(g.players[g.currentPlayerIndex].name).toBe("Zanon");

    g = playCard(g, g.players[g.currentPlayerIndex].id, 0);
    g = advanceAfterStack(g);

    expect(g.players[g.currentPlayerIndex].name).toBe("Augusto");
  });

  it("reverse with 2 players = skip (same player)", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0, direction: 1,
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [r("red"), n("red", 3)] },
        { ...g.players[1], hand: [n("red", 7)] },
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    g = resolveStack(g);

    expect(g.currentPlayerIndex).toBe(0);
    expect(g.direction).toBe(-1);
  });
});

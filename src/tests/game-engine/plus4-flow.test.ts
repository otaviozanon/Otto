import { describe, it, expect } from "vitest";
import { startGame, playCard, chooseColor } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { Card } from "@/game-engine/types";

function n(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }
function w4(): Card { return { type: "wild4" }; }

describe("+4: victim draws but still plays (no turn skip)", () => {
  it("3 players: P1 draws 4, P1 still plays", () => {
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
    g = chooseColor(g, "blue");
    g = advanceAfterStack(g);
    const before = g.players[1].hand.length;
    g = resolveStack(g);
    expect(g.players[1].hand.length).toBe(before + 4);
    expect(g.currentPlayerIndex).toBe(1);
  });

  it("2 players: P1 draws 4, P1 still plays", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 20 }, () => n("red", 1)),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [w4(), n("red", 3)] },
        { ...g.players[1], hand: [n("red", 7)] },
      ],
    };
    g = playCard(g, g.players[0].id, 0);
    g = chooseColor(g, "blue");
    g = advanceAfterStack(g);
    const before = g.players[1].hand.length;
    g = resolveStack(g);
    expect(g.players[1].hand.length).toBe(before + 4);
    expect(g.currentPlayerIndex).toBe(1);
  });
});

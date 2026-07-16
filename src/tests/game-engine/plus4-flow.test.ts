import { describe, it, expect } from "vitest";
import { startGame, playCard, chooseColor } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { Card } from "@/game-engine/types";

function n(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }
function w4(): Card { return { type: "wild4" }; }

describe("+4 turn flow", () => {
  it("3 players: P0 plays +4, P1 draws 4, turn goes to P2", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 20 }, () => n("red", 1)),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [w4(), n("red", 3), n("red", 7)] },
        { ...g.players[1], hand: [n("red", 7)] },
        g.players[2],
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    g = chooseColor(g, "blue");
    g = advanceAfterStack(g);

    const beforeP2 = g.players[1].hand.length;
    g = resolveStack(g);
    expect(g.players[1].hand.length).toBe(beforeP2 + 4);
    expect(g.currentPlayerIndex).toBe(2);
  });

  it("2 players: P0 plays +4, P1 draws 4, turn goes back to P0", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 20 }, () => n("red", 1)),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [w4(), n("red", 3), n("red", 7)] },
        { ...g.players[1], hand: [n("red", 7)] },
      ],
    };

    g = playCard(g, g.players[0].id, 0);
    g = chooseColor(g, "blue");
    g = advanceAfterStack(g);

    const beforeP1 = g.players[1].hand.length;
    g = resolveStack(g);
    expect(g.players[1].hand.length).toBe(beforeP1 + 4);
    expect(g.currentPlayerIndex).toBe(0);
  });
});

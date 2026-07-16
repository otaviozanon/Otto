import { describe, it, expect } from "vitest";
import { startGame, drawCard } from "@/game-engine/game";
import { createRoom, joinRoom, removePlayer } from "@/game-engine/room";
import { Card } from "@/game-engine/types";

describe("edge cases", () => {
  it("reshuffles discard into draw", () => {
    let r = joinRoom(createRoom("A"), "B");
    let s = startGame(r);
    s = { ...s, drawPile: [], discardPile: [{ type: "number", color: "red", value: 3 } as Card, { type: "number", color: "blue", value: 5 } as Card] };
    expect(drawCard(s, s.players[0].id).players[0].hand).toHaveLength(8);
  });
  it("disconnected player cleanup", () => {
    let r = joinRoom(joinRoom(createRoom("A"), "B"), "C");
    let s = startGame(r);
    expect(removePlayer(s, s.players[1].id).players).toHaveLength(2);
  });
});

import { describe, it, expect } from "vitest";
import { isPlayable } from "@/game-engine/rules";
import { playCard } from "@/game-engine/game";
import { startGame } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { Card } from "@/game-engine/types";

function skip(color: string): Card { return { type: "skip", color: color as any }; }
function reverse(color: string): Card { return { type: "reverse", color: color as any }; }
function draw2(color: string): Card { return { type: "draw2", color: color as any }; }
function num(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }

describe("Skip card playability", () => {
  it("skip matches same color number", () => {
    expect(isPlayable(skip("red"), num("red", 5), "red")).toBe(true);
  });

  it("skip does not match different color number", () => {
    expect(isPlayable(skip("blue"), num("red", 5), "red")).toBe(false);
  });

  it("skip matches another skip by type", () => {
    expect(isPlayable(skip("blue"), skip("red"), "red")).toBe(true);
  });

  it("reverse matches same color number", () => {
    expect(isPlayable(reverse("red"), num("red", 5), "red")).toBe(true);
  });

  it("draw2 matches same color number", () => {
    expect(isPlayable(draw2("red"), num("red", 5), "red")).toBe(true);
  });
});

describe("playCard with all special types", () => {
  it("plays skip card successfully", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [skip("red"), num("red", 3)] },
        s.players[1],
      ],
    };
    s = playCard(s, s.players[0].id, 0);
    expect(s.discardPile[s.discardPile.length - 1].type).toBe("skip");
    expect(s.stackChain).toEqual({ type: "skip", count: 1 });
  });

  it("plays reverse card successfully", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [reverse("red"), num("red", 3)] },
        s.players[1],
      ],
    };
    s = playCard(s, s.players[0].id, 0);
    expect(s.discardPile[s.discardPile.length - 1].type).toBe("reverse");
    expect(s.stackChain).toEqual({ type: "reverse", count: 1 });
  });

  it("plays draw2 card successfully", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [draw2("red"), num("red", 3)] },
        s.players[1],
      ],
    };
    s = playCard(s, s.players[0].id, 0);
    expect(s.discardPile[s.discardPile.length - 1].type).toBe("draw2");
    expect(s.stackChain).toEqual({ type: "draw2", count: 1 });
  });
});

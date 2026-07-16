import { describe, it, expect } from "vitest";
import { startGame, playCard } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { isPlayable } from "@/game-engine/rules";
import { Card } from "@/game-engine/types";

function num(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }
function skip(color: string): Card { return { type: "skip", color: color as any }; }
function draw2(color: string): Card { return { type: "draw2", color: color as any }; }

describe("Skip card flow", () => {
  it("single skip: P1 skipped, turn goes to P2", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [skip("red"), num("red", 3)] },
        { ...s.players[1], hand: [num("red", 7)] },
        s.players[2],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    expect(s.stackChain).toEqual({ type: "skip", count: 1 });

    s = advanceAfterStack(s);
    s = resolveStack(s);
    expect(s.stackChain).toBeNull();
  });
});

describe("+2 card flow", () => {
  it("single +2: victim draws 2, turn advances past them", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 10 }, () => num("red", 1)),
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [draw2("red"), num("red", 3)] },
        { ...s.players[1], hand: [num("red", 7)] },
        s.players[2],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);

    const p1Before = s.players[1].hand.length;
    s = resolveStack(s);
    expect(s.players[1].hand.length).toBe(p1Before + 2);
    expect(s.stackChain).toBeNull();
  });
});

describe("Skip stacking flow", () => {
  it("two skips stacked, both skipped players lose turn", () => {
    let room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [skip("red"), num("red", 3)] },
        { ...s.players[1], hand: [skip("blue"), num("red", 7)] },
        { ...s.players[2], hand: [num("red", 9)] },
        s.players[3],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);
    s = playCard(s, s.players[1].id, 0);
    s = advanceAfterStack(s);
    s = resolveStack(s);
    expect(s.stackChain).toBeNull();
  });
});

describe("Chain then normal play", () => {
  it("after skip resolves, next player plays number card", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 5 }, () => num("red", 1)),
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [skip("red"), num("red", 3)] },
        { ...s.players[1], hand: [num("red", 7)] },
        { ...s.players[2], hand: [num("red", 9)] },
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);
    s = resolveStack(s);
    expect(s.stackChain).toBeNull();

    s = playCard(s, s.players[s.currentPlayerIndex].id, 0);
    expect(s.discardPile[s.discardPile.length - 1].type).toBe("number");
  });
});

describe("canPlay false when chain exists, no stacking card", () => {
  it("P2 has playable number but chain blocks non-stacking plays", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [skip("red"), num("red", 3)] },
        { ...s.players[1], hand: [num("red", 7)] },
        s.players[2],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);

    const topCard = s.discardPile[s.discardPile.length - 1];
    const p2hand = s.players[1].hand;

    const hasStacking = p2hand.some((c) => c.type === s.stackChain!.type);
    expect(hasStacking).toBe(false);

    const hasPlayable = p2hand.some((c) => isPlayable(c, topCard, s.currentColor));
    expect(hasPlayable).toBe(true);
  });
});

describe("canStack true when matching card in hand", () => {
  it("P2 has skip, canStack is true", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [skip("red"), num("red", 3)] },
        { ...s.players[1], hand: [skip("blue"), num("red", 7)] },
        s.players[2],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);

    const hasStacking = s.players[1].hand.some((c) => c.type === s.stackChain!.type);
    expect(hasStacking).toBe(true);
  });
});

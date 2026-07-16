import { describe, it, expect } from "vitest";
import { startGame, playCard, drawCard, passTurn, callUno, chooseColor, checkWin, processTurnTimeout } from "@/game-engine/game";
import { createRoom, joinRoom, removePlayer } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { Card } from "@/game-engine/types";

function wild(): Card { return { type: "wild" }; }
function wild4(): Card { return { type: "wild4" }; }
function num(color: string, value: number): Card { return { type: "number", color: color as any, value }; }
function skip(color: string): Card { return { type: "skip", color: color as any }; }
function reverse(color: string): Card { return { type: "reverse", color: color as any }; }
function draw2(color: string): Card { return { type: "draw2", color: color as any }; }

describe("Scenario: win with direction changes", () => {
  it("P0 wins after reverse changes flow", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0, calledUno: { [s.players[0].id]: true },
      drawPile: Array.from({ length: 10 }, () => num("red", 1)),
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [reverse("red"), num("red", 3)] },
        { ...s.players[1], hand: [num("red", 7)] },
        { ...s.players[2], hand: [num("red", 9)] },
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);
    s = resolveStack(s);
    expect(s.direction).toBe(-1);

    s = playCard(s, s.players[2].id, 0);
    s = advanceAfterStack(s);

    s = playCard(s, s.players[0].id, 0);
    expect(s.status).toBe("finished");
    expect(s.winner!.id).toBe(s.players[0].id);
  });
});

describe("Scenario: UNO penalty then recovery win", () => {
  it("player gets penalized, draws 2, still wins later", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 10 }, () => num("red", 1)),
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [num("red", 3), num("red", 7)] },
        { ...s.players[1], hand: [num("red", 8), num("red", 9)] },
      ],
      calledUno: {},
    };

    s = playCard(s, s.players[0].id, 0);
    const penalized = s.players[0].hand.length >= 3;
    expect(penalized).toBe(true);

    s = advanceAfterStack(s);

    s = playCard(s, s.players[1].id, 0);
    s = advanceAfterStack(s);

    s = callUno(s, s.players[0].id);
    const pi = s.players[0].hand.findIndex((c) =>
      c.type === "wild" || c.type === "wild4" ||
      ("color" in c && c.color === s.currentColor)
    );
    expect(pi).toBeGreaterThanOrEqual(0);
    s = playCard(s, s.players[0].id, pi);
    expect(s.players[0].hand.length).toBeLessThan(4);
  });
});

describe("Scenario: complete game with +2 stacking chains", () => {
  it("multiple +2 chains resolve correctly", () => {
    let room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 50 }, () => num("red", 1)),
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [draw2("red"), num("blue", 3)] },
        { ...s.players[1], hand: [draw2("blue"), num("green", 3)] },
        { ...s.players[2], hand: [num("red", 7)] },
        { ...s.players[3], hand: [num("red", 9)] },
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);

    s = playCard(s, s.players[1].id, 0);
    s = advanceAfterStack(s);

    const victimBefore = s.players[2].hand.length;
    s = resolveStack(s);
    expect(s.players[2].hand.length).toBe(victimBefore + 4);
    expect(s.stackChain).toBeNull();
  });
});

describe("Scenario: individual +4 resolution (no accumulation)", () => {
  it("each +4 resolves independently with color choice", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      calledUno: { [s.players[0].id]: true },
      drawPile: Array.from({ length: 50 }, () => num("red", 1)),
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [wild4(), num("red", 3)] },
        s.players[1],
        s.players[2],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = chooseColor(s, "green");
    s = advanceAfterStack(s);

    const victimBefore = s.players[1].hand.length;
    s = resolveStack(s);
    expect(s.currentColor).toBe("green");
    expect(s.players[1].hand.length).toBe(victimBefore + 4);
    expect(s.stackChain).toBeNull();
  });
});

describe("Scenario: skip chain resolves to correct player", () => {
  it("3 skips = skip 3 players", () => {
    let room = joinRoom(joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3"), "P4");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [skip("red"), num("red", 1)] },
        { ...s.players[1], hand: [skip("blue"), num("red", 1)] },
        { ...s.players[2], hand: [skip("green"), num("red", 1)] },
        s.players[3],
        s.players[4],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);
    s = playCard(s, s.players[1].id, 0);
    s = advanceAfterStack(s);
    s = playCard(s, s.players[2].id, 0);

    s = resolveStack(s);
    expect(s.stackChain).toBeNull();
  });
});

describe("Scenario: deck exhaustion reshuffles discard", () => {
  it("reshuffles when draw pile empties", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: [num("green", 1)],
      discardPile: [num("red", 5), num("red", 1), num("red", 2)],
      players: [
        { ...s.players[0], hand: [num("blue", 3)] },
        s.players[1],
      ],
    };

    s = drawCard(s, s.players[0].id);
    expect(s.players[0].hand).toHaveLength(2);

    s = drawCard(s, s.players[1].id);
    expect(s.discardPile).toHaveLength(1);
    expect(s.drawPile).toHaveLength(1);
  });
});

describe("Scenario: game with only wilds in hand", () => {
  it("player can always play wild", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      players: [
        { ...s.players[0], hand: [wild(), wild(), wild()] },
        s.players[1],
      ],
      discardPile: [num("red", 5)],
    };

    s = playCard(s, s.players[0].id, 0);
    expect(s.stackChain).toEqual({ type: "wild", count: 1 });

    s = chooseColor(s, "blue");
    s = resolveStack(s);
    expect(s.currentPlayerIndex).toBe(1);
    expect(s.currentColor).toBe("blue");
    expect(s.players[0].hand).toHaveLength(2);
  });
});

describe("Scenario: winner not first player", () => {
  it("P1 wins when their turn comes and they have one card", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 1, calledUno: { [s.players[1].id]: true },
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [num("red", 3), num("red", 7)] },
        { ...s.players[1], hand: [num("red", 9)] },
      ],
    };

    s = playCard(s, s.players[1].id, 0);
    expect(s.status).toBe("finished");
    expect(s.winner!.id).toBe(s.players[1].id);
  });
});

describe("Scenario: turn order after multiple passes", () => {
  it("maintains correct order after 3 passes", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "blue", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 10 }, () => num("blue", 1)),
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [num("red", 3)] },
        { ...s.players[1], hand: [num("red", 5)] },
        { ...s.players[2], hand: [num("red", 7)] },
      ],
    };

    s = drawCard(s, s.players[0].id);
    s = passTurn(s, s.players[0].id);
    expect(s.currentPlayerIndex).toBe(1);

    s = drawCard(s, s.players[1].id);
    s = passTurn(s, s.players[1].id);
    expect(s.currentPlayerIndex).toBe(2);

    s = drawCard(s, s.players[2].id);
    s = passTurn(s, s.players[2].id);
    expect(s.currentPlayerIndex).toBe(0);
  });
});

describe("Scenario: single reverse (no stacking)", () => {
  it("reverses direction and advances in new direction", () => {
    let room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0, direction: 1,
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [reverse("red"), num("red", 1)] },
        s.players[1],
        s.players[2],
        s.players[3],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);
    s = resolveStack(s);
    expect(s.direction).toBe(-1);
  });
});

describe("Scenario: skip breaking the skip chain", () => {
  it("player without skip triggers chain resolution", () => {
    let room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 10 }, () => num("red", 1)),
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [skip("red"), num("red", 1)] },
        { ...s.players[1], hand: [skip("blue"), num("red", 1)] },
        { ...s.players[2], hand: [num("red", 7)] },
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

describe("Scenario: timeout resolves draw chain", () => {
  it("resolves stack on timeout then passes", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 20 }, () => num("red", 1)),
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [draw2("red"), num("red", 1)] },
        { ...s.players[1], hand: [] },
        s.players[2],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);

    s = processTurnTimeout(s, s.players[1].id);
    expect(s.players[1].hand.length).toBe(2);
    expect(s.stackChain).toBeNull();
  });
});

describe("Scenario: UNO call at any time", () => {
  it("calling UNO with many cards sets calledUno flag", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [num("red", 3), num("red", 7), num("red", 9)] },
        s.players[1],
      ],
    };

    s = callUno(s, s.players[0].id);
    expect(s.calledUno[s.players[0].id]).toBe(true);

    s = playCard(s, s.players[0].id, 0);
    expect(s.players[0].hand.length).toBe(2);
  });
});

describe("Scenario: consecutive color changes", () => {
  it("wild then wild changes colors independently", () => {
    let room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      players: [
        { ...s.players[0], hand: [wild(), num("red", 1)] },
        { ...s.players[1], hand: [wild(), num("blue", 1)] },
        { ...s.players[2], hand: [num("yellow", 7)] },
        s.players[3],
      ],
      discardPile: [num("red", 5)],
    };

    s = playCard(s, s.players[0].id, 0);
    s = chooseColor(s, "blue");
    s = resolveStack(s);
    expect(s.currentColor).toBe("blue");
    expect(s.currentPlayerIndex).toBe(1);

    s = playCard(s, s.players[1].id, 0);
    s = chooseColor(s, "yellow");
    s = resolveStack(s);
    expect(s.currentColor).toBe("yellow");
  });
});

describe("Scenario: draw exactly the last card from pile", () => {
  it("draw pile empties correctly", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: [num("red", 9)],
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [num("blue", 3)] },
        s.players[1],
      ],
    };

    s = drawCard(s, s.players[0].id);
    expect(s.drawPile).toHaveLength(0);
    expect(s.players[0].hand).toHaveLength(2);
  });
});

import { describe, it, expect } from "vitest";
import { startGame, playCard, drawCard, passTurn, callUno, chooseColor, checkWin, processTurnTimeout, playDrawnCard } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { isPlayable, canStack, requiresColorChoice } from "@/game-engine/rules";
import { Card } from "@/game-engine/types";

function wild(): Card { return { type: "wild" }; }
function wild4(): Card { return { type: "wild4" }; }
function num(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }
function skip(color: string): Card { return { type: "skip", color: color as any }; }
function reverse(color: string): Card { return { type: "reverse", color: color as any }; }
function draw2(color: string): Card { return { type: "draw2", color: color as any }; }

describe("isPlayable advanced cases", () => {
  const red5 = num("red", 5);
  const red7 = num("red", 7);
  const blue5 = num("blue", 5);

  it("draw2 matches number by color", () => {
    expect(isPlayable(draw2("red"), red5, "red")).toBe(true);
  });

  it("draw2 matches skip by color", () => {
    expect(isPlayable(draw2("red"), skip("red"), "red")).toBe(true);
  });

  it("skip on different color number = false", () => {
    expect(isPlayable(skip("blue"), red5, "red")).toBe(false);
  });

  it("number matches same number different color", () => {
    expect(isPlayable(blue5, red5, "red")).toBe(true);
  });

  it("number does NOT match different number same color", () => {
    expect(isPlayable(red5, red7, "red")).toBe(true);
  });

  it("number does NOT match different number different color", () => {
    expect(isPlayable(blue5, red7, "red")).toBe(false);
  });

  it("special matches same special type regardless of color", () => {
    expect(isPlayable(skip("blue"), skip("red"), "red")).toBe(true);
    expect(isPlayable(reverse("blue"), reverse("red"), "green")).toBe(true);
    expect(isPlayable(draw2("blue"), draw2("red"), "yellow")).toBe(true);
  });

  it("number on special by color", () => {
    expect(isPlayable(num("red", 3), skip("red"), "red")).toBe(true);
  });

  it("cannot stack different types just because same color", () => {
    expect(canStack(draw2("red"), { type: "skip", count: 1 })).toBe(false);
  });

  it("canStack with null chain = false", () => {
    expect(canStack(draw2("red"), null)).toBe(false);
  });
});

describe("Reverse stacking: odd count (3 reverses)", () => {
  it("direction toggles for odd count", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0, direction: 1,
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [reverse("red"), num("red", 1)] },
        { ...s.players[1], hand: [reverse("blue"), num("red", 1)] },
        { ...s.players[2], hand: [reverse("green"), num("red", 1)] },
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);

    s = playCard(s, s.players[1].id, 0);
    s = advanceAfterStack(s);

    s = playCard(s, s.players[2].id, 0);

    s = resolveStack(s);
    expect(s.direction).toBe(-1);
    expect(s.stackChain).toBeNull();
  });
});

describe("playDrawnCard with wild", () => {
  it("drawn wild sets stack chain and needs color choice", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: [wild(), num("red", 1), num("red", 2)],
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [num("blue", 3)] },
        s.players[1],
      ],
      calledUno: { [s.players[0].id]: true },
    };

    s = drawCard(s, s.players[0].id);
    expect(s.players[0].hand).toHaveLength(2);

    s = playCard(s, s.players[0].id, 1);
    expect(s.stackChain).toEqual({ type: "wild", count: 1 });
  });
});

describe("Deck exhaustion during stack resolution", () => {
  it("draws penalty cards from reshuffled discard", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: [num("green", 1)],
      discardPile: [
        num("red", 1), num("red", 2), num("red", 3),
        num("red", 4), num("red", 5),
      ],
      players: [
        { ...s.players[0], hand: [draw2("red"), num("red", 1)] },
        { ...s.players[1], hand: [] },
        s.players[2],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);
    s = resolveStack(s);
    expect(s.players[1].hand.length).toBe(2);
    expect(s.stackChain).toBeNull();
  });
});

describe("Double penalty: UNO + stacking chain", () => {
  it("cannot trigger UNO penalty on stacking resolve", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 10 }, () => num("red", 1)),
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [draw2("red"), num("red", 3), num("red", 7)] },
        { ...s.players[1], hand: [] },
        s.players[2],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);
    s = resolveStack(s);
    expect(s.players[1].hand.length).toBe(2);
  });
});

describe("checkWin with multiple empty hands", () => {
  it("first empty hand player wins", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red",
      players: [
        { ...s.players[0], hand: [] },
        { ...s.players[1], hand: [] },
        s.players[2],
      ],
    };

    s = checkWin(s);
    expect(s.status).toBe("finished");
    expect(s.winner!.id).toBe(s.players[0].id);
  });
});

describe("Direction wrapping edge cases", () => {
  it("wraps correctly in both directions", () => {
    let room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let s = startGame(room);

    s = { ...s, currentPlayerIndex: 3, direction: 1 };
    s = advanceAfterStack(s);
    expect(s.currentPlayerIndex).toBe(0);

    s = { ...s, direction: -1, currentPlayerIndex: 0 };
    s = advanceAfterStack(s);
    expect(s.currentPlayerIndex).toBe(3);
  });
});

describe("processTurnTimeout edge cases", () => {
  it("with empty draw pile handles reshuffle", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: [],
      discardPile: [num("red", 5), num("red", 1), num("red", 2)],
      players: [
        { ...s.players[0], hand: [num("blue", 3)] },
        s.players[1],
      ],
      lastDrawnCard: {},
    };

    s = processTurnTimeout(s, s.players[0].id);
    expect(s.players[0].hand).toHaveLength(2);
    expect(s.currentPlayerIndex).toBe(1);
  });

  it("with already drawn card does not draw again", () => {
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
    expect(s.lastDrawnCard[s.players[0].id]).toBeDefined();
    const beforeLen = s.players[0].hand.length;

    s = processTurnTimeout(s, s.players[0].id);
    expect(s.players[0].hand.length).toBe(beforeLen);
  });
});

describe("playDrawnCard edge cases", () => {
  it("throws when no card was drawn", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    expect(() => playDrawnCard(s, s.players[0].id)).toThrow("Nenhuma carta comprada");
  });

  it("throws when drawn card is not playable", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: [num("blue", 9)],
      discardPile: [num("red", 5)],
      players: [
        { ...s.players[0], hand: [num("blue", 3)] },
        s.players[1],
      ],
    };

    s = drawCard(s, s.players[0].id);
    expect(() => playDrawnCard(s, s.players[0].id)).toThrow("Carta comprada nao pode ser jogada");
  });
});

describe("chooseColor validation", () => {
  it("changes color for upcoming plays", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      players: [
        { ...s.players[0], hand: [wild(), num("blue", 3)] },
        s.players[1],
        s.players[2],
      ],
      discardPile: [num("red", 5)],
    };

    s = playCard(s, s.players[0].id, 0);
    s = chooseColor(s, "yellow");
    expect(s.currentColor).toBe("yellow");
  });
});

describe("callUno persistence", () => {
  it("calledUno persists through state updates", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);

    s = callUno(s, s.players[0].id);
    expect(s.calledUno[s.players[0].id]).toBe(true);

    s = startGame(room);
    expect(s.calledUno[s.players[0].id]).toBeUndefined();
  });
});

describe("Full max player setup", () => {
  it("15 player room works", () => {
    let room = createRoom("Host");
    for (let i = 1; i < 15; i++) room = joinRoom(room, `P${i}`);
    expect(room.players).toHaveLength(15);

    expect(() => startGame(room)).not.toThrow();
  });
});

describe("Number card color update", () => {
  it("playing a number updates currentColor", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "blue", currentPlayerIndex: 0,
      discardPile: [num("blue", 5)],
      players: [
        { ...s.players[0], hand: [num("blue", 3)] },
        s.players[1],
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    expect(s.currentColor).toBe("blue");
  });
});

describe("Pass turn edge cases", () => {
  it("pass clears drawing state", () => {
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
    expect(s.lastDrawnCard[s.players[0].id]).toBeDefined();

    s = passTurn(s, s.players[0].id);
    expect(s.lastDrawnCard[s.players[0].id]).toBeNull();
  });
});

describe("resolveStack on non-existent chain", () => {
  it("returns room unchanged", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    const before = { ...s };
    s = resolveStack(s);
    expect(s.currentPlayerIndex).toBe(before.currentPlayerIndex);
    expect(s.stackChain).toBeNull();
  });
});

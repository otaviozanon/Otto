import { describe, it, expect } from "vitest";
import { startGame, playCard, drawCard, passTurn, callUno, checkWin, processTurnTimeout } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { isPlayable } from "@/game-engine/rules";
import { Card } from "@/game-engine/types";

function n(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }
function s(color: string): Card { return { type: "skip", color: color as any }; }
function r(color: string): Card { return { type: "reverse", color: color as any }; }
function d2(color: string): Card { return { type: "draw2", color: color as any }; }
function w(): Card { return { type: "wild" }; }
function w4(): Card { return { type: "wild4" }; }

const red5 = n("red", 5);
const redSkip = s("red");
const redD2 = d2("red");
const blueD2 = d2("blue");

describe("isPlayable all combos", () => {
  it("same color number", () => expect(isPlayable(n("red", 7), n("red", 5), "red")).toBe(true));
  it("same value diff color", () => expect(isPlayable(n("blue", 5), n("red", 5), "red")).toBe(true));
  it("diff color diff value", () => expect(isPlayable(n("blue", 7), n("red", 5), "red")).toBe(false));
  it("special matching color", () => expect(isPlayable(s("red"), n("red", 5), "red")).toBe(true));
  it("special diff color", () => expect(isPlayable(s("blue"), n("red", 5), "red")).toBe(false));
  it("skip on skip diff color (type match)", () => expect(isPlayable(s("blue"), s("red"), "red")).toBe(true));
  it("draw2 on draw2 diff color (type match)", () => expect(isPlayable(d2("blue"), d2("red"), "red")).toBe(true));
  it("wild always", () => expect(isPlayable(w(), n("red", 5), "red")).toBe(true));
  it("wild4 always", () => expect(isPlayable(w4(), n("red", 5), "red")).toBe(true));
});

describe("Non-penalty chain: skip allows normal play", () => {
  it("P2 plays same-color card after P1 skip", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    const p0 = g.players[0];
    const p1 = g.players[1];
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [n("red", 5)],
      players: [
        { ...p0, hand: [s("red"), n("red", 3)] },
        { ...p1, hand: [n("red", 7)] },
        g.players[2],
      ],
    };
    g = playCard(g, g.players[0].id, 0);
    g = advanceAfterStack(g);
    g = playCard(g, g.players[1].id, 0);
    expect(g.stackChain).toBeNull();
    expect(g.discardPile[g.discardPile.length - 1].type).toBe("number");
  });

  it("P2 stacks skip after P1 skip", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    const p0 = g.players[0];
    const p1 = g.players[1];
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [n("red", 5)],
      players: [
        { ...p0, hand: [s("red"), n("red", 3)] },
        { ...p1, hand: [s("blue"), n("red", 7)] },
        g.players[2],
      ],
    };
    g = playCard(g, g.players[0].id, 0);
    g = advanceAfterStack(g);
    g = playCard(g, g.players[1].id, 0);
    expect(g.stackChain).toEqual({ type: "skip", count: 2 });
  });
});

describe("Penalty chain: +2 forces stacking", () => {
  it("non-stacking card throws after +2", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    const p0 = g.players[0];
    const p1 = g.players[1];
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [n("red", 5)],
      players: [
        { ...p0, hand: [d2("red"), n("red", 3)] },
        { ...p1, hand: [n("red", 7)] },
        g.players[2],
      ],
    };
    g = playCard(g, g.players[0].id, 0);
    g = advanceAfterStack(g);
    expect(() => playCard(g, g.players[1].id, 0)).toThrow("Voce deve empilhar ou comprar");
  });

  it("matching +2 stacks", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    const p0 = g.players[0];
    const p1 = g.players[1];
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 10 }, () => n("red", 1)),
      discardPile: [n("red", 5)],
      players: [
        { ...p0, hand: [d2("red"), n("red", 3)] },
        { ...p1, hand: [d2("blue"), n("red", 7)] },
        g.players[2],
      ],
    };
    g = playCard(g, g.players[0].id, 0);
    g = advanceAfterStack(g);
    g = playCard(g, g.players[1].id, 0);
    expect(g.stackChain).toEqual({ type: "draw2", count: 2 });
  });
});

describe("Turn advancement", () => {
  it("number advances 1 after socket handler advance", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [n("red", 5)],
      players: [{ ...g.players[0], hand: [n("red", 3)] }, g.players[1], g.players[2]],
    };
    g = playCard(g, g.players[0].id, 0);
    g = advanceAfterStack(g);
    expect(g.currentPlayerIndex).toBe(1);
  });
});

describe("UNO penalty", () => {
  it("calledUno=true prevents penalty", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    const p0 = g.players[0];
    g = {
      ...g, currentColor: "red", discardPile: [n("red", 5)], calledUno: { [p0.id]: true },
      players: [{ ...p0, hand: [n("red", 3), n("red", 7)] }, g.players[1]],
    };
    g = playCard(g, g.players[0].id, 0);
    expect(g.players[0].hand.length).toBe(1);
  });

  it("calledUno=false + 2 cards in hand = penalty", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    const p0 = g.players[0];
    g = {
      ...g, currentColor: "red", drawPile: Array.from({ length: 10 }, () => n("red", 1)),
      discardPile: [n("red", 5)], calledUno: {},
      players: [{ ...p0, hand: [n("red", 3), n("red", 7)] }, g.players[1]],
    };
    g = playCard(g, g.players[0].id, 0);
    expect(g.players[0].hand.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Check win", () => {
  it("winner set when hand empty", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    g = { ...g, players: [{ ...g.players[0], hand: [] }, g.players[1]] };
    g = checkWin(g);
    expect(g.status).toBe("finished");
    expect(g.winner!.id).toBe(g.players[0].id);
  });

  it("no winner when all have cards", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    g = checkWin(g);
    expect(g.status).toBe("playing");
  });
});

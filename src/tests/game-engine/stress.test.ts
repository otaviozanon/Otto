import { describe, it, expect } from "vitest";
import { startGame, playCard, drawCard, passTurn, callUno, chooseColor, processTurnTimeout } from "@/game-engine/game";
import { createRoom, joinRoom, removePlayer } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { isPlayable } from "@/game-engine/rules";
import { Card } from "@/game-engine/types";

function n(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }
function s(color: string): Card { return { type: "skip", color: color as any }; }
function r(color: string): Card { return { type: "reverse", color: color as any }; }
function d2(color: string): Card { return { type: "draw2", color: color as any }; }
function w(): Card { return { type: "wild" }; }
function w4(): Card { return { type: "wild4" }; }

describe("Every card type played on every card type", () => {
  const allCards = [
    n("red", 5), n("blue", 5), n("green", 5), n("yellow", 5),
    n("red", 3), n("blue", 7),
    s("red"), s("blue"), s("green"), s("yellow"),
    r("red"), r("blue"), r("green"), r("yellow"),
    d2("red"), d2("blue"), d2("green"), d2("yellow"),
    w(), w4(),
  ];

  const colors = ["red", "blue", "green", "yellow"] as const;

  for (const top of allCards) {
    for (const card of allCards) {
      for (const currentColor of colors) {
        const label = `${JSON.stringify(card)} on ${JSON.stringify(top)} (color: ${currentColor})`;
        it(label, () => {
          const result = isPlayable(card, top, currentColor);
          expect(typeof result).toBe("boolean");
          if (card.type === "wild" || card.type === "wild4") {
            expect(result).toBe(true);
          }
        });
      }
    }
  }
});

describe("Stacking chain counts", () => {
  it("1 draw2 stacked", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = { ...g, currentColor: "red", currentPlayerIndex: 0, drawPile: Array.from({ length: 10 }, () => n("red", 1)), discardPile: [n("red", 5)], players: [{ ...g.players[0], hand: [d2("red"), n("red", 3)] }, g.players[1], g.players[2]] };
    g = playCard(g, g.players[0].id, 0);
    expect(g.stackChain).toEqual({ type: "draw2", count: 1 });
  });

  it("2 draw2 stacked", () => {
    const room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let g = startGame(room);
    g = { ...g, currentColor: "red", currentPlayerIndex: 0, drawPile: Array.from({ length: 20 }, () => n("red", 1)), discardPile: [n("red", 5)], players: [{ ...g.players[0], hand: [d2("red"), n("red", 3)] }, { ...g.players[1], hand: [d2("blue"), n("red", 7)] }, g.players[2], g.players[3]] };
    g = playCard(g, g.players[0].id, 0); g = advanceAfterStack(g);
    g = playCard(g, g.players[1].id, 0);
    expect(g.stackChain).toEqual({ type: "draw2", count: 2 });
  });

  it("3 draw2 stacked", () => {
    const room = joinRoom(joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3"), "P4");
    let g = startGame(room);
    g = { ...g, currentColor: "red", currentPlayerIndex: 0, drawPile: Array.from({ length: 30 }, () => n("red", 1)), discardPile: [n("red", 5)], players: [{ ...g.players[0], hand: [d2("red"), n("red", 3)] }, { ...g.players[1], hand: [d2("blue"), n("red", 7)] }, { ...g.players[2], hand: [d2("green"), n("red", 9)] }, g.players[3], g.players[4]] };
    g = playCard(g, g.players[0].id, 0); g = advanceAfterStack(g);
    g = playCard(g, g.players[1].id, 0); g = advanceAfterStack(g);
    g = playCard(g, g.players[2].id, 0);
    expect(g.stackChain).toEqual({ type: "draw2", count: 3 });
  });

  it("2 skip stacked", () => {
    const room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let g = startGame(room);
    g = { ...g, currentColor: "red", currentPlayerIndex: 0, discardPile: [n("red", 5)], players: [{ ...g.players[0], hand: [s("red"), n("red", 3)] }, { ...g.players[1], hand: [s("blue"), n("red", 7)] }, g.players[2], g.players[3]] };
    g = playCard(g, g.players[0].id, 0); g = advanceAfterStack(g);
    g = playCard(g, g.players[1].id, 0);
    expect(g.stackChain).toEqual({ type: "skip", count: 2 });
  });

  it("2 reverse stacked", () => {
    const room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let g = startGame(room);
    g = { ...g, currentColor: "red", currentPlayerIndex: 0, discardPile: [n("red", 5)], players: [{ ...g.players[0], hand: [r("red"), n("red", 3)] }, { ...g.players[1], hand: [r("blue"), n("red", 7)] }, g.players[2], g.players[3]] };
    g = playCard(g, g.players[0].id, 0); g = advanceAfterStack(g);
    g = playCard(g, g.players[1].id, 0);
    expect(g.stackChain).toEqual({ type: "reverse", count: 2 });
  });

  it("2 wild stacked", () => {
    const room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let g = startGame(room);
    g = { ...g, currentColor: "red", currentPlayerIndex: 0, discardPile: [n("red", 5)], players: [{ ...g.players[0], hand: [w(), n("red", 3)] }, { ...g.players[1], hand: [w(), n("red", 7)] }, g.players[2], g.players[3]] };
    g = playCard(g, g.players[0].id, 0); g = advanceAfterStack(g);
    g = playCard(g, g.players[1].id, 0);
    expect(g.stackChain).toEqual({ type: "wild", count: 2 });
  });
});

describe("UNO penalty boundaries", () => {
  it("hand goes from 3 to 2: no penalty", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    const p0 = g.players[0];
    g = { ...g, currentColor: "red", discardPile: [n("red", 5)], calledUno: {}, players: [{ ...p0, hand: [n("red", 3), n("red", 7), n("red", 9)] }, g.players[1]] };
    g = playCard(g, g.players[0].id, 0);
    expect(g.players[0].hand.length).toBe(2);
  });

  it("hand goes from 2 to 1 with UNO called: no penalty", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    const p0 = g.players[0];
    g = { ...g, currentColor: "red", discardPile: [n("red", 5)], calledUno: { [p0.id]: true }, players: [{ ...p0, hand: [n("red", 3), n("red", 7)] }, g.players[1]] };
    g = playCard(g, g.players[0].id, 0);
    expect(g.players[0].hand.length).toBe(1);
  });

  it("hand goes from 2 to 1 without UNO: penalty", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    g = { ...g, currentColor: "red", drawPile: Array.from({ length: 10 }, () => n("red", 1)), discardPile: [n("red", 5)], calledUno: {}, players: [{ ...g.players[0], hand: [n("red", 3), n("red", 7)] }, g.players[1]] };
    g = playCard(g, g.players[0].id, 0);
    expect(g.players[0].hand.length).toBeGreaterThanOrEqual(2);
  });

  it("hand goes from 1 to 0: win (no penalty check)", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    g = { ...g, currentColor: "red", discardPile: [n("red", 5)], calledUno: {}, players: [{ ...g.players[0], hand: [n("red", 3)] }, g.players[1]] };
    g = playCard(g, g.players[0].id, 0);
    expect(g.status).toBe("finished");
  });
});

describe("Wild color choice then normal play", () => {
  it("wild changes color, next player plays new color", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0, discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [w(), n("blue", 3)] },
        { ...g.players[1], hand: [n("blue", 7)] },
        { ...g.players[2], hand: [n("blue", 9)] },
      ],
    };
    g = playCard(g, g.players[0].id, 0);
    g = chooseColor(g, "blue");
    g = advanceAfterStack(g);
    g = resolveStack(g);
    expect(g.currentColor).toBe("blue");
    const cp = g.players[g.currentPlayerIndex];
    const pi = cp.hand.findIndex((c: Card) => {
      if (c.type === "wild" || c.type === "wild4") return true;
      return "color" in c && c.color === g.currentColor;
    });
    if (pi >= 0) {
      g = playCard(g, cp.id, pi);
      expect(g.discardPile[g.discardPile.length - 1].type).toBe("number");
    }
  });
});

describe("processTurnTimeout scenarios", () => {
  it("no prior draw: auto-draws and passes", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    g = { ...g, lastDrawnCard: {} };
    const before = g.players[0].hand.length;
    g = processTurnTimeout(g, g.players[0].id);
    expect(g.players[0].hand.length).toBe(before + 1);
    expect(g.currentPlayerIndex).toBe(1);
  });

  it("with stack chain: resolves chain first", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = { ...g, currentColor: "red", currentPlayerIndex: 0, drawPile: Array.from({ length: 20 }, () => n("red", 1)), discardPile: [n("red", 5)], players: [{ ...g.players[0], hand: [d2("red"), n("red", 3)] }, g.players[1], g.players[2]] };
    g = playCard(g, g.players[0].id, 0);
    g = advanceAfterStack(g);
    const before = g.players[1].hand.length;
    g = processTurnTimeout(g, g.players[1].id);
    expect(g.players[1].hand.length).toBe(before + 2);
    expect(g.stackChain).toBeNull();
  });

  it("already drew: just passes", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    g = { ...g, currentColor: "red", drawPile: [n("red", 9)], discardPile: [n("red", 5)], players: [{ ...g.players[0], hand: [n("blue", 3)] }, g.players[1]] };
    g = drawCard(g, g.players[0].id);
    const before = g.players[0].hand.length;
    g = processTurnTimeout(g, g.players[0].id);
    expect(g.players[0].hand.length).toBe(before);
  });
});

describe("Disconnect during game", () => {
  it("active game continues when player disconnects", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = { ...g, currentColor: "red", currentPlayerIndex: g.players.findIndex(p => p.id !== g.players[0].id), players: g.players.map(p => p.id === g.players[0].id ? { ...p, connected: false } : p) };
    const cleaned = removePlayer(g, g.players[0].id);
    expect(cleaned.players.length).toBe(2);
  });
});

describe("Resolve penaltes: correct card count", () => {
  it("+2 single: draws 2", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = { ...g, currentColor: "red", currentPlayerIndex: 0, drawPile: Array.from({ length: 5 }, () => n("red", 1)), discardPile: [n("red", 5)], players: [{ ...g.players[0], hand: [d2("red"), n("red", 3)] }, g.players[1], g.players[2]] };
    g = playCard(g, g.players[0].id, 0); g = advanceAfterStack(g);
    const b = g.players[1].hand.length;
    g = resolveStack(g);
    expect(g.players[1].hand.length).toBe(b + 2);
  });

  it("+2 x2: draws 4", () => {
    const room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let g = startGame(room);
    g = { ...g, currentColor: "red", currentPlayerIndex: 0, drawPile: Array.from({ length: 10 }, () => n("red", 1)), discardPile: [n("red", 5)], players: [{ ...g.players[0], hand: [d2("red"), n("red", 3)] }, { ...g.players[1], hand: [d2("blue"), n("red", 7)] }, g.players[2], g.players[3]] };
    g = playCard(g, g.players[0].id, 0); g = advanceAfterStack(g);
    g = playCard(g, g.players[1].id, 0); g = advanceAfterStack(g);
    const b = g.players[2].hand.length;
    g = resolveStack(g);
    expect(g.players[2].hand.length).toBe(b + 4);
  });

  it("+4 single: draws 4", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = { ...g, currentColor: "red", currentPlayerIndex: 0, drawPile: Array.from({ length: 10 }, () => n("red", 1)), discardPile: [n("red", 5)], players: [{ ...g.players[0], hand: [w4(), n("red", 3)] }, g.players[1], g.players[2]] };
    g = playCard(g, g.players[0].id, 0); g = chooseColor(g, "green"); g = advanceAfterStack(g);
    const b = g.players[1].hand.length;
    g = resolveStack(g);
    expect(g.players[1].hand.length).toBe(b + 4);
  });
});

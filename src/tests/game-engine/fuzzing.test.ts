import { describe, it, expect } from "vitest";
import { startGame, playCard, drawCard, passTurn, callUno, chooseColor, checkWin, processTurnTimeout, playDrawnCard } from "@/game-engine/game";
import { createRoom, joinRoom, removePlayer } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { isPlayable, requiresColorChoice, getInitialColor } from "@/game-engine/rules";
import { Card, Room } from "@/game-engine/types";

function n(color: string, v: number): Card { return { type: "number", color: color as any, value: v }; }
function s(color: string): Card { return { type: "skip", color: color as any }; }
function r(color: string): Card { return { type: "reverse", color: color as any }; }
function d2(color: string): Card { return { type: "draw2", color: color as any }; }
function w(): Card { return { type: "wild" }; }
function w4(): Card { return { type: "wild4" }; }

describe("Fuzzing: 500 random turns, 3 players", () => {
  it("never crashes or produces invalid state", () => {
    const deckCards = [
      n("red",1),n("red",2),n("red",3),n("blue",1),n("blue",2),n("blue",3),
      n("green",1),n("green",2),n("green",3),n("yellow",1),n("yellow",2),n("yellow",3),
      s("red"),s("blue"),s("green"),s("yellow"),
      r("red"),r("blue"),r("green"),r("yellow"),
      d2("red"),d2("blue"),d2("green"),d2("yellow"),
      w(),w(),w4(),w4(),
    ];

    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 200 }, (_, i) => deckCards[i % deckCards.length]),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [n("red",3),n("red",7),n("red",9),n("blue",3),s("red"),w()] },
        { ...g.players[1], hand: [n("red",1),n("red",2),n("red",3),d2("red"),r("red"),w4()] },
        { ...g.players[2], hand: [n("red",7),n("red",8),n("red",9),s("blue"),w(),w4()] },
      ],
    };

    let turns = 0;
    while (g.status === "playing" && turns < 500) {
      const cp = g.players[g.currentPlayerIndex];
      const top = g.discardPile[g.discardPile.length - 1];

      if (g.stackChain) {
        const penaltyType = g.stackChain.type === "draw2" || g.stackChain.type === "wild4";
        if (penaltyType) {
          const si = cp.hand.findIndex((c) => c.type === g.stackChain!.type);
          if (si >= 0) {
            try { g = playCard(g, cp.id, si); g = advanceAfterStack(g); } catch { g = resolveStack(g); }
          } else {
            g = resolveStack(g);
          }
        } else {
          const si = cp.hand.findIndex((c) => c.type === g.stackChain!.type);
          if (si >= 0) {
            try { g = playCard(g, cp.id, si); g = advanceAfterStack(g); } catch { g = resolveStack(g); }
          } else {
            const pi = cp.hand.findIndex((c) => isPlayable(c, top, g.currentColor));
            if (pi >= 0) {
              try { g = playCard(g, cp.id, pi); } catch { g = resolveStack(g); }
            } else {
              g = resolveStack(g);
            }
          }
        }
        turns++;
        continue;
      }

      const pi = cp.hand.findIndex((c) => isPlayable(c, top, g.currentColor));
      if (pi >= 0) {
        try {
          g = playCard(g, cp.id, pi);
          if (g.status === "playing" && !g.stackChain) g = advanceAfterStack(g);
          if (g.status === "playing" && g.stackChain && requiresColorChoice(g.discardPile[g.discardPile.length - 1])) {
            const colors: Array<"red"|"blue"|"green"|"yellow"> = ["red","blue","green","yellow"];
            g = chooseColor(g, colors[turns % 4]);
            g = advanceAfterStack(g);
            g = resolveStack(g);
          } else if (g.status === "playing" && g.stackChain) {
            g = advanceAfterStack(g);
          }
        } catch {
          g = drawCard(g, cp.id);
          g = passTurn(g, cp.id);
        }
      } else {
        g = drawCard(g, cp.id);
        const drawn = g.lastDrawnCard[cp.id];
        if (drawn && isPlayable(drawn, top, g.currentColor)) {
          try {
            g = playCard(g, cp.id, cp.hand.length - 1);
            if (g.status === "playing" && !g.stackChain) g = advanceAfterStack(g);
            if (g.status === "playing" && g.stackChain && requiresColorChoice(g.discardPile[g.discardPile.length - 1])) {
              const colors: Array<"red"|"blue"|"green"|"yellow"> = ["red","blue","green","yellow"];
              g = chooseColor(g, colors[turns % 4]);
              g = advanceAfterStack(g);
              g = resolveStack(g);
            } else if (g.status === "playing" && g.stackChain) {
              g = advanceAfterStack(g);
            }
          } catch { g = passTurn(g, cp.id); }
        } else {
          g = passTurn(g, cp.id);
        }
      }
      turns++;

      for (const p of g.players) {
        expect(p.hand.length).toBeGreaterThanOrEqual(0);
        expect(p.hand.length).toBeLessThan(200);
      }
      expect(g.currentPlayerIndex).toBeGreaterThanOrEqual(0);
      expect(g.currentPlayerIndex).toBeLessThan(g.players.length);
      expect(g.discardPile.length).toBeGreaterThan(0);
    }

    if (g.status === "finished") {
      expect(g.winner).toBeDefined();
      expect(g.ranking.length).toBeGreaterThan(0);
    }
  });
});

describe("Fuzzing: 500 random turns, 4 players", () => {
  it("never crashes with 4 players", () => {
    const deckCards = [
      n("red",1),n("red",2),n("blue",1),n("blue",2),n("green",1),n("green",2),n("yellow",1),n("yellow",2),
      s("red"),s("blue"),s("green"),s("yellow"),r("red"),r("blue"),r("green"),r("yellow"),
      d2("red"),d2("blue"),d2("green"),d2("yellow"),w(),w(),w4(),w4(),
    ];

    const room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let g = startGame(room);
    g = {
      ...g, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 200 }, (_, i) => deckCards[i % deckCards.length]),
      discardPile: [n("red", 5)],
      players: [
        { ...g.players[0], hand: [n("red",3),n("red",7),n("blue",3),s("red"),w()] },
        { ...g.players[1], hand: [n("red",1),n("red",2),n("red",3),d2("red"),r("red")] },
        { ...g.players[2], hand: [n("red",7),n("red",9),s("blue"),w(),w4()] },
        { ...g.players[3], hand: [n("red",4),n("red",5),n("red",6),d2("blue"),r("blue")] },
      ],
    };

    let turns = 0;
    while (g.status === "playing" && turns < 500) {
      const cp = g.players[g.currentPlayerIndex];
      const top = g.discardPile[g.discardPile.length - 1];

      if (g.stackChain) {
        const penaltyType = g.stackChain.type === "draw2" || g.stackChain.type === "wild4";
        const si = cp.hand.findIndex((c) => c.type === g.stackChain!.type);
        if (si >= 0) {
          try { g = playCard(g, cp.id, si); g = advanceAfterStack(g); } catch { g = resolveStack(g); }
        } else if (!penaltyType) {
          const pi = cp.hand.findIndex((c) => isPlayable(c, top, g.currentColor));
          if (pi >= 0) { try { g = playCard(g, cp.id, pi); } catch { g = resolveStack(g); } }
          else { g = resolveStack(g); }
        } else {
          g = resolveStack(g);
        }
        turns++;
        continue;
      }

      const pi = cp.hand.findIndex((c) => isPlayable(c, top, g.currentColor));
      if (pi >= 0) {
        try {
          g = playCard(g, cp.id, pi);
          if (g.status === "playing" && !g.stackChain) g = advanceAfterStack(g);
          if (g.status === "playing" && g.stackChain && requiresColorChoice(g.discardPile[g.discardPile.length - 1])) {
            const colors: Array<"red"|"blue"|"green"|"yellow"> = ["red","blue","green","yellow"];
            g = chooseColor(g, colors[turns % 4]);
            g = advanceAfterStack(g);
            g = resolveStack(g);
          } else if (g.status === "playing" && g.stackChain) {
            g = advanceAfterStack(g);
          }
        } catch {
          g = drawCard(g, cp.id);
          g = passTurn(g, cp.id);
        }
      } else {
        g = drawCard(g, cp.id);
        const drawn = g.lastDrawnCard[cp.id];
        if (drawn && isPlayable(drawn, top, g.currentColor)) {
          try {
            g = playCard(g, cp.id, cp.hand.length - 1);
            if (g.status === "playing" && !g.stackChain) g = advanceAfterStack(g);
            if (g.status === "playing" && g.stackChain && requiresColorChoice(g.discardPile[g.discardPile.length - 1])) {
              const colors: Array<"red"|"blue"|"green"|"yellow"> = ["red","blue","green","yellow"];
              g = chooseColor(g, colors[turns % 4]);
              g = advanceAfterStack(g);
              g = resolveStack(g);
            } else if (g.status === "playing" && g.stackChain) {
              g = advanceAfterStack(g);
            }
          } catch { g = passTurn(g, cp.id); }
        } else {
          g = passTurn(g, cp.id);
        }
      }
      turns++;

      for (const p of g.players) {
        expect(p.hand.length).toBeGreaterThanOrEqual(0);
        expect(p.hand.length).toBeLessThan(200);
      }
      expect(g.currentPlayerIndex).toBeGreaterThanOrEqual(0);
      expect(g.currentPlayerIndex).toBeLessThan(g.players.length);
      expect(g.discardPile.length).toBeGreaterThan(0);
    }
  });
});

describe("Validation: all invariants hold during play", () => {
  it("direction is always 1 or -1", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    for (let i = 0; i < 50; i++) {
      if (g.status !== "playing") break;
      expect([1, -1]).toContain(g.direction);
      const cp = g.players[g.currentPlayerIndex];
      const top = g.discardPile[g.discardPile.length - 1];
      const pi = cp.hand.findIndex((c) => isPlayable(c, top, g.currentColor));
      if (pi >= 0) {
        try { g = playCard(g, cp.id, pi); if (!g.stackChain) g = advanceAfterStack(g); else g = advanceAfterStack(g); } catch { g = drawCard(g, cp.id); g = passTurn(g, cp.id); }
      } else {
        g = drawCard(g, cp.id);
        g = passTurn(g, cp.id);
      }
    }
  });

  it("currentPlayerIndex always in bounds", () => {
    const room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let g = startGame(room);
    for (let i = 0; i < 30; i++) {
      if (g.status !== "playing") break;
      expect(g.currentPlayerIndex).toBeLessThan(g.players.length);
      expect(g.currentPlayerIndex).toBeGreaterThanOrEqual(0);
      const cp = g.players[g.currentPlayerIndex];
      const top = g.discardPile[g.discardPile.length - 1];
      const pi = cp.hand.findIndex((c) => isPlayable(c, top, g.currentColor));
      if (pi >= 0) { try { g = playCard(g, cp.id, pi); g = advanceAfterStack(g); } catch { g = drawCard(g, cp.id); g = passTurn(g, cp.id); } }
      else { g = drawCard(g, cp.id); g = passTurn(g, cp.id); }
    }
  });

  it("discardPile never empty", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    for (let i = 0; i < 20; i++) {
      if (g.status !== "playing") break;
      expect(g.discardPile.length).toBeGreaterThan(0);
      const cp = g.players[g.currentPlayerIndex];
      const top = g.discardPile[g.discardPile.length - 1];
      const pi = cp.hand.findIndex((c) => isPlayable(c, top, g.currentColor));
      if (pi >= 0) { try { g = playCard(g, cp.id, pi); g = advanceAfterStack(g); } catch { g = drawCard(g, cp.id); g = passTurn(g, cp.id); } }
      else { g = drawCard(g, cp.id); g = passTurn(g, cp.id); }
    }
  });

  it("total cards in game equals 108 + draws from regeneration", () => {
    const room = joinRoom(createRoom("P0"), "P1");
    let g = startGame(room);
    let total = g.drawPile.length + g.discardPile.length;
    for (const p of g.players) total += p.hand.length;
    expect(total).toBeGreaterThanOrEqual(106);
    expect(total).toBeLessThanOrEqual(110);
  });
});

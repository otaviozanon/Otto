import { describe, it, expect } from "vitest";
import { startGame, playCard, drawCard, passTurn, callUno, chooseColor, checkWin } from "@/game-engine/game";
import { createRoom, joinRoom, removePlayer, setPlayerDisconnected } from "@/game-engine/room";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { Card, Room } from "@/game-engine/types";

describe("Wild color choice flow", () => {
  it("player chooses color after playing wild", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "wild" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        s.players[1],
        s.players[2],
      ],
    };
    s = playCard(s, s.players[0].id, 0);
    expect(s.stackChain).toEqual({ type: "wild", count: 1 });
    expect(s.discardPile[s.discardPile.length - 1].type).toBe("wild");

    s = chooseColor(s, "blue");
    expect(s.currentColor).toBe("blue");

    s = resolveStack(s);
    expect(s.currentColor).toBe("blue");
    expect(s.stackChain).toBeNull();
    expect(s.currentPlayerIndex).toBe(1);
  });

  it("wild does not advance turn until color chosen", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "wild" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        s.players[1],
        s.players[2],
      ],
    };
    s = playCard(s, s.players[0].id, 0);
    expect(s.currentPlayerIndex).toBe(0);
  });
});

describe("Wild stacking: wild on wild", () => {
  it("three wilds stacked advance three times after color choice", () => {
    let room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "wild" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        { ...s.players[1], hand: [{ type: "wild" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        { ...s.players[2], hand: [{ type: "wild" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        s.players[3],
      ],
    };
    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);
    s = playCard(s, s.players[1].id, 0);
    s = advanceAfterStack(s);
    s = playCard(s, s.players[2].id, 0);

    s = chooseColor(s, "yellow");
    s = resolveStack(s);
    expect(s.currentColor).toBe("yellow");
    expect(s.stackChain).toBeNull();
  });
});

describe("Reverse stacking: reverse on reverse", () => {
  it("two reverses cancel each other direction-wise", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0, direction: 1,
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "reverse", color: "red" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        { ...s.players[1], hand: [{ type: "reverse", color: "blue" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        s.players[2],
      ],
    };
    s = playCard(s, s.players[0].id, 0);
    expect(s.stackChain).toEqual({ type: "reverse", count: 1 });

    s = advanceAfterStack(s);
    s = playCard(s, s.players[1].id, 0);
    expect(s.stackChain).toEqual({ type: "reverse", count: 2 });

    s = resolveStack(s);
    expect(s.direction).toBe(1);
    expect(s.stackChain).toBeNull();
  });
});

describe("Skip chain: normal play allowed for non-penalty chains", () => {
  it("player with matching color card can play normally after skip", () => {
    let room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 5 }, () => ({ type: "number" as const, color: "red" as const, value: 1 })),
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "skip", color: "red" } as Card, { type: "number", color: "red", value: 1 } as Card] },
        { ...s.players[1], hand: [{ type: "number", color: "red", value: 3 } as Card] },
        s.players[2],
        s.players[3],
      ],
    };
    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);
    expect(s.stackChain).not.toBeNull();

    s = playCard(s, s.players[1].id, 0);
    expect(s.discardPile[s.discardPile.length - 1].type).toBe("number");
  });
});

describe("Game state after disconnect", () => {
  it("room removes disconnected player after timeout window", () => {
    let room = joinRoom(joinRoom(createRoom("P0"), "P1"), "P2");
    let s = startGame(room);
    const p1Id = s.players[1].id;

    s = setPlayerDisconnected(s, p1Id);
    expect(s.players[1].connected).toBe(false);

    s = removePlayer(s, p1Id);
    expect(s.players).toHaveLength(2);
    expect(s.players.find((p) => p.id === p1Id)).toBeUndefined();
  });

  it("host transfers when host disconnects", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    const hostId = s.players[0].id;
    s = removePlayer(s, hostId);
    expect(s.host).toBe(s.players[0].id);
    expect(s.players[0].id).not.toBe(hostId);
  });
});

describe("Full game with 4 players", () => {
  it("completes with stacked penalties", () => {
    let room = joinRoom(joinRoom(joinRoom(createRoom("P0"), "P1"), "P2"), "P3");
    let s = startGame(room);

    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 100 }, () => ({ type: "number" as const, color: "red" as const, value: 1 })),
      discardPile: [{ type: "number", color: "red", value: 5 } as Card],
      players: [
        { ...s.players[0], hand: [
          { type: "draw2", color: "red" } as Card,
          { type: "skip", color: "red" } as Card,
          { type: "reverse", color: "red" } as Card,
          { type: "wild" } as Card,
          { type: "number", color: "red", value: 3 } as Card,
        ]},
        { ...s.players[1], hand: [
          { type: "draw2", color: "blue" } as Card,
          { type: "number", color: "red", value: 7 } as Card,
        ]},
        { ...s.players[2], hand: [
          { type: "number", color: "red", value: 9 } as Card,
        ]},
        { ...s.players[3], hand: [
          { type: "number", color: "red", value: 1 } as Card,
        ]},
      ],
    };

    s = playCard(s, s.players[0].id, 0);
    s = advanceAfterStack(s);

    s = playCard(s, s.players[1].id, 0);
    s = advanceAfterStack(s);

    s = resolveStack(s);
    expect(s.players[2].hand.length).toBe(5);
    expect(s.stackChain).toBeNull();
    expect(s.currentPlayerIndex).toBe(0);
  });
});

describe("Drawn card edge cases", () => {
  it("passes when drawn card is not playable", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: [{ type: "number", color: "blue", value: 5 } as Card],
      discardPile: [{ type: "number", color: "red", value: 9 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "number", color: "blue", value: 3 } as Card] },
        s.players[1],
      ],
    };
    s = drawCard(s, s.players[0].id);
    expect(s.players[0].hand).toHaveLength(2);

    s = passTurn(s, s.players[0].id);
    expect(s.currentPlayerIndex).toBe(1);
  });

  it("plays drawn card when compatible by color", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    const pId = s.players[0].id;
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      drawPile: Array.from({ length: 10 }, () => ({ type: "number" as const, color: "red" as const, value: 1 })),
      discardPile: [{ type: "number", color: "red", value: 9 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "number", color: "blue", value: 3 } as Card] },
        s.players[1],
      ],
      calledUno: { [pId]: true },
    };
    s = drawCard(s, pId);
    expect(s.players[0].hand).toHaveLength(2);

    s = playCard(s, pId, 1);
    expect(s.players[0].hand).toHaveLength(1);
    expect((s.discardPile[s.discardPile.length - 1] as any).color).toBe("red");
  });
});

describe("Room management", () => {
  it("generates unique room codes", () => {
    const room1 = createRoom("A");
    const room2 = createRoom("B");
    expect(room1.id).not.toBe(room2.id);
    expect(room1.id).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("max 15 players enforced", () => {
    let room = createRoom("Host");
    for (let i = 1; i < 15; i++) room = joinRoom(room, `P${i}`);
    expect(room.players).toHaveLength(15);
    expect(() => joinRoom(room, "Extra")).toThrow("Sala cheia");
  });

  it("join blocked when game started", () => {
    let room = createRoom("Host");
    room = joinRoom(room, "P1");
    room = { ...room, status: "playing" };
    expect(() => joinRoom(room, "Late")).toThrow("Jogo ja iniciado");
  });
});

describe("UNO edge cases", () => {
  it("calling UNO persists across turns until hand size changes", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    const pId = s.players[0].id;
    s = {
      ...s, currentColor: "red", currentPlayerIndex: 0,
      discardPile: [{ type: "number", color: "red", value: 9 } as Card],
      players: [
        { ...s.players[0], hand: [{ type: "number", color: "red", value: 3 } as Card] },
        s.players[1],
      ],
    };
    const before = s.players[0].hand.length;

    s = callUno(s, pId);
    expect(s.calledUno[pId]).toBe(true);

    s = playCard(s, pId, 0);
    expect(s.players[0].hand.length).toBe(before - 1);
  });
});

describe("checkWin validation", () => {
  it("does not change status when no winner", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = checkWin(s);
    expect(s.status).toBe("playing");
  });

  it("sets finished and ranking when winner exists", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    s = { ...s, players: [{ ...s.players[0], hand: [] }, s.players[1]] };
    s = checkWin(s);
    expect(s.status).toBe("finished");
    expect(s.winner).toBeDefined();
    expect(s.ranking).toHaveLength(2);
    expect(s.ranking[0].id).toBe(s.players[0].id);
  });
});

import { createDeck } from "@/game-engine/deck";

describe("Deck integrity", () => {
  it("total 108 cards in fresh deck", () => {
    expect(createDeck()).toHaveLength(108);
  });

  it("no duplicate of single zero per color", () => {
    const deck = createDeck();
    const zeros = deck.filter((c) => c.type === "number" && c.value === 0);
    const colors = new Set(zeros.map((c: any) => c.color));
    expect(colors.size).toBe(4);
  });
});

describe("playCard rejects invalid cards with stacking chain", () => {
  it("rejects card with wrong index", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    expect(() => playCard(s, s.players[0].id, -1)).toThrow("Carta invalida");
    expect(() => playCard(s, s.players[0].id, 999)).toThrow("Carta invalida");
  });

  it("rejects card for non-existent player", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let s = startGame(room);
    expect(() => playCard(s, "nonexistent", 0)).toThrow("Jogador nao encontrado");
  });
});

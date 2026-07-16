import { describe, it, expect } from "vitest";
import { createDeck, shuffle, draw, reshuffleDiscard } from "@/game-engine/deck";

describe("createDeck", () => {
  it("creates 108 cards", () => expect(createDeck()).toHaveLength(108));
  it("has 1 zero per color", () => expect(createDeck().filter((c) => c.type === "number" && c.value === 0)).toHaveLength(4));
  it("has 2 of each number 1-9 per color", () => {
    const deck = createDeck();
    for (let v = 1; v <= 9; v++) expect(deck.filter((c) => c.type === "number" && c.value === v)).toHaveLength(8);
  });
  it("has 2 skip, 2 reverse, 2 draw2 per color", () => {
    for (const type of ["skip", "reverse", "draw2"] as const) expect(createDeck().filter((c) => c.type === type)).toHaveLength(8);
  });
  it("has 4 wild and 4 wild4", () => {
    expect(createDeck().filter((c) => c.type === "wild")).toHaveLength(4);
    expect(createDeck().filter((c) => c.type === "wild4")).toHaveLength(4);
  });
});

describe("shuffle", () => {
  it("returns same count", () => expect(shuffle(createDeck())).toHaveLength(108));
});

describe("draw", () => {
  it("draws from top", () => { const { card, remaining } = draw(createDeck()); expect(card).toBeDefined(); expect(remaining).toHaveLength(107); });
  it("generates fresh card when empty", () => {
    const { card, remaining } = draw([]);
    expect(card).toBeDefined();
    expect(remaining.length).toBeGreaterThanOrEqual(0);
  });
});

describe("reshuffleDiscard", () => {
  it("moves discard minus top into draw", () => {
    const deck = createDeck();
    const res = reshuffleDiscard([], deck.slice(0, 5));
    expect(res.drawPile).toHaveLength(4);
    expect(res.discardPile).toHaveLength(1);
  });

  it("generates new deck when both piles exhausted", () => {
    const res = reshuffleDiscard([], [{ type: "number", color: "red", value: 5 } as any]);
    expect(res.drawPile.length).toBeGreaterThanOrEqual(107);
    expect(res.discardPile).toHaveLength(1);
  });

  it("keeps draw when not empty", () => {
    const deck = createDeck();
    const res = reshuffleDiscard(deck.slice(3), deck.slice(0, 3));
    expect(res.drawPile).toHaveLength(105);
    expect(res.discardPile).toHaveLength(3);
  });
});

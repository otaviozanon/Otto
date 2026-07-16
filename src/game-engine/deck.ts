import { Card, Color } from "./types";

const COLORS: Color[] = ["red", "blue", "green", "yellow"];

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const color of COLORS) {
    deck.push({ type: "number", color, value: 0 });
    for (let v = 1; v <= 9; v++) {
      deck.push({ type: "number", color, value: v });
      deck.push({ type: "number", color, value: v });
    }
    for (let i = 0; i < 2; i++) {
      deck.push({ type: "skip", color });
      deck.push({ type: "reverse", color });
      deck.push({ type: "draw2", color });
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ type: "wild" });
    deck.push({ type: "wild4" });
  }

  return deck;
}

export function shuffle(deck: Card[]): Card[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function draw(deck: Card[]): { card: Card; remaining: Card[] } {
  if (deck.length > 0) {
    const [card, ...remaining] = deck;
    return { card, remaining };
  }
  const fresh = shuffle(createDeck());
  return { card: fresh[0], remaining: fresh.slice(1) };
}

export function reshuffleDiscard(drawPile: Card[], discardPile: Card[]): { drawPile: Card[]; discardPile: Card[] } {
  if (drawPile.length > 0) return { drawPile, discardPile };
  const toShuffle = discardPile.slice(0, -1);
  if (toShuffle.length > 0) {
    return { drawPile: shuffle(toShuffle), discardPile: [discardPile[discardPile.length - 1]] };
  }
  const freshDeck = shuffle(createDeck());
  const topCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : freshDeck[0];
  return { drawPile: freshDeck, discardPile: [topCard] };
}

export function drawInitialCard(deck: Card[]): { card: Card; remaining: Card[] } {
  const shuffled = shuffle(deck);
  let { card, remaining } = draw(shuffled);
  while (card.type === "wild" || card.type === "wild4") {
    remaining = [...remaining, card];
    const result = draw(remaining);
    card = result.card;
    remaining = result.remaining;
  }
  return { card, remaining };
}

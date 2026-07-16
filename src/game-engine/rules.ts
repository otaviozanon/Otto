import { Card, Color } from "./types";

export function isPlayable(card: Card, topCard: Card, currentColor: Color): boolean {
  if (card.type === "wild" || card.type === "wild4") return true;
  if ("color" in card && card.color === currentColor) return true;
  if (card.type === topCard.type) return true;
  if (card.type === "number" && topCard.type === "number" && card.value === topCard.value) return true;
  return false;
}

export function canStack(card: Card, stackChain: { type: string; count: number } | null): boolean {
  if (!stackChain) return false;
  return card.type === stackChain.type;
}

export function requiresColorChoice(card: Card): boolean {
  return card.type === "wild" || card.type === "wild4";
}

export function getInitialColor(card: Card): Color | undefined {
  if ("color" in card) return card.color;
  return undefined;
}

export type Color = "red" | "blue" | "green" | "yellow";

export type CardType = "number" | "skip" | "reverse" | "draw2" | "wild" | "wild4";

export type Card =
  | { type: "number"; color: Color; value: number }
  | { type: "skip"; color: Color }
  | { type: "reverse"; color: Color }
  | { type: "draw2"; color: Color }
  | { type: "wild" }
  | { type: "wild4" };

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  connected: boolean;
}

export interface Room {
  id: string;
  host: string;
  players: Player[];
  status: "lobby" | "playing" | "finished";
  drawPile: Card[];
  discardPile: Card[];
  currentColor: Color;
  direction: 1 | -1;
  currentPlayerIndex: number;
  turnTimer: number;
  calledUno: Record<string, boolean>;
  stackChain: { type: CardType; count: number } | null;
  winner: Player | null;
  ranking: PlayerPublic[];
  lastDrawnCard: Record<string, Card | null>;
}

export interface PlayerPublic {
  id: string;
  name: string;
  cardCount: number;
}

export interface PlayerGameState {
  hand: Card[];
  currentCard: Card;
  currentColor: Color;
  drawPileCount: number;
  direction: 1 | -1;
  players: PlayerPublic[];
  currentPlayerId: string;
  turnTimer: number;
  calledUno: boolean;
  canPlay: boolean;
  canStack: boolean;
  isDrawing: boolean;
  drawnCardPlayable: boolean;
}

export interface GameResult {
  winner: PlayerPublic;
  ranking: PlayerPublic[];
}

# Otto (Uno) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Otto — a digital Uno card game, multiplayer via Socket.IO, engine on server, per-player private state, first to empty hand wins.

**Architecture:** Next.js 15 + Socket.IO server (same port via `tsx server.mts`), Zustand client store, Tailwind CSS 4. Game engine 100% server-side; client only renders and sends actions. State filtered per player via `game:your-state`.

**Tech Stack:** Next.js 15.5, React 19, TypeScript 5.8, Socket.IO 4, Zustand 4, Tailwind CSS 4, Vitest 4, tsx

**Project root:** `D:\01 - Works\Otavio\Otto`

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `vitest.config.ts`
- Create: `postcss.config.js`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "otto",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=18" },
  "scripts": {
    "dev": "tsx server.mts",
    "build": "next build --turbo",
    "start": "NODE_ENV=production tsx server.mts",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "next lint"
  },
  "dependencies": {
    "@tailwindcss/postcss": "^4.3.2",
    "lucide-react": "^0.500.0",
    "next": "15.5.20",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^26.1.1",
    "@types/react": "^19.2.17",
    "@vitejs/plugin-react": "^6.0.3",
    "autoprefixer": "^10.5.2",
    "jsdom": "^29.1.1",
    "postcss": "^8.5.17",
    "tailwindcss": "^4.3.2",
    "tsx": "^4.23.0",
    "typescript": "5.8.2",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.js** — copy exact from NoWay:

```js
/** @type {import('next').NextConfig} */
module.exports = {};
```

- [ ] **Step 4: Create vitest.config.ts** — copy from NoWay, adjust alias:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    globals: true,
  },
});
```

- [ ] **Step 5: Create postcss.config.js** — copy exact from NoWay:

```js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
.next/
.superpowers/
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`

---

### Task 2: Server Entry Point

**Files:**
- Create: `server.mts`

- [ ] **Step 1: Create server.mts** — copy exact from NoWay server.mts, update import path to `./src/server/socket`:

```ts
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { setupSocket } from "./src/server/socket";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  setupSocket(io);

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
```

---

### Task 3: Game Engine — Types

**Files:**
- Create: `src/game-engine/types.ts`

- [ ] **Step 1: Create types.ts**

```ts
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
```

---

### Task 4: Game Engine — Deck

**Files:**
- Create: `src/game-engine/deck.ts`
- Create: `src/tests/setup.ts`
- Create: `src/tests/game-engine/deck.test.ts`

- [ ] **Step 1: Write the failing deck test**

```ts
import { describe, it, expect } from "vitest";
import { createDeck, shuffle, draw, reshuffleDiscard } from "@/game-engine/deck";

describe("createDeck", () => {
  it("creates 108 cards", () => {
    expect(createDeck()).toHaveLength(108);
  });

  it("has 1 zero per color (4 total)", () => {
    const zeros = createDeck().filter((c) => c.type === "number" && c.value === 0);
    expect(zeros).toHaveLength(4);
  });

  it("has 2 of each number 1-9 per color (72 total)", () => {
    const deck = createDeck();
    for (let v = 1; v <= 9; v++) {
      expect(deck.filter((c) => c.type === "number" && c.value === v)).toHaveLength(8);
    }
  });

  it("has 2 skip, 2 reverse, 2 draw2 per color (24 total)", () => {
    const deck = createDeck();
    for (const type of ["skip", "reverse", "draw2"] as const) {
      expect(deck.filter((c) => c.type === type)).toHaveLength(8);
    }
  });

  it("has 4 wild and 4 wild4", () => {
    const deck = createDeck();
    expect(deck.filter((c) => c.type === "wild")).toHaveLength(4);
    expect(deck.filter((c) => c.type === "wild4")).toHaveLength(4);
  });
});

describe("shuffle", () => {
  it("returns same number of cards", () => {
    expect(shuffle(createDeck())).toHaveLength(108);
  });
});

describe("draw", () => {
  it("draws from top and reduces pile", () => {
    const { card, remaining } = draw(createDeck());
    expect(card).toBeDefined();
    expect(remaining).toHaveLength(107);
  });

  it("throws when deck empty", () => {
    expect(() => draw([])).toThrow("Deck is empty");
  });
});

describe("reshuffleDiscard", () => {
  it("moves discard (minus top) into draw pile", () => {
    const deck = createDeck();
    const result = reshuffleDiscard([], deck.slice(0, 5));
    expect(result).toHaveLength(4);
  });

  it("keeps draw pile when not empty", () => {
    const deck = createDeck();
    const result = reshuffleDiscard(deck.slice(3), deck.slice(0, 3));
    expect(result).toHaveLength(105);
  });
});
```

- [ ] **Step 2: Create test setup**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/tests/game-engine/deck.test.ts`
Expected: FAIL

- [ ] **Step 4: Create deck.ts**

```ts
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
  if (deck.length === 0) throw new Error("Deck is empty");
  const [card, ...remaining] = deck;
  return { card, remaining };
}

export function reshuffleDiscard(drawPile: Card[], discardPile: Card[]): Card[] {
  if (drawPile.length > 0) return drawPile;
  const toShuffle = discardPile.slice(0, -1);
  if (toShuffle.length === 0) return drawPile;
  return shuffle(toShuffle);
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/tests/game-engine/deck.test.ts`
Expected: PASS

---

### Task 5: Game Engine — Rules

**Files:**
- Create: `src/game-engine/rules.ts`
- Create: `src/tests/game-engine/rules.test.ts`

- [ ] **Step 1: Write the failing rules test**

```ts
import { describe, it, expect } from "vitest";
import { isPlayable, canStack, requiresColorChoice, getInitialColor } from "@/game-engine/rules";
import { Card } from "@/game-engine/types";

const red7: Card = { type: "number", color: "red", value: 7 };
const blue7: Card = { type: "number", color: "blue", value: 7 };
const red3: Card = { type: "number", color: "red", value: 3 };
const skipRed: Card = { type: "skip", color: "red" };
const skipBlue: Card = { type: "skip", color: "blue" };
const draw2Red: Card = { type: "draw2", color: "red" };
const wild: Card = { type: "wild" };
const wild4: Card = { type: "wild4" };

describe("isPlayable", () => {
  it("matches by color", () => expect(isPlayable(red7, red3, "red")).toBe(true));
  it("matches by number", () => expect(isPlayable(blue7, red7, "red")).toBe(true));
  it("matches by type (skip on skip)", () => expect(isPlayable(skipBlue, skipRed, "red")).toBe(true));
  it("rejects different color and number", () => expect(isPlayable(blue7, red3, "red")).toBe(false));
  it("wild always playable", () => expect(isPlayable(wild, red7, "red")).toBe(true));
  it("wild4 always playable", () => expect(isPlayable(wild4, red7, "red")).toBe(true));
});

describe("canStack", () => {
  it("same type stacks", () => expect(canStack(draw2Red, { type: "draw2", count: 1 })).toBe(true));
  it("different type does not stack", () => expect(canStack(skipRed, { type: "draw2", count: 1 })).toBe(false));
  it("null chain = cannot stack", () => expect(canStack(draw2Red, null)).toBe(false));
  it("wild stacks on wild", () => expect(canStack(wild, { type: "wild", count: 1 })).toBe(true));
  it("wild4 stacks on wild4", () => expect(canStack(wild4, { type: "wild4", count: 1 })).toBe(true));
});

describe("requiresColorChoice", () => {
  it("wild requires", () => expect(requiresColorChoice(wild)).toBe(true));
  it("wild4 requires", () => expect(requiresColorChoice(wild4)).toBe(true));
  it("number does not", () => expect(requiresColorChoice(red7)).toBe(false));
});

describe("getInitialColor", () => {
  it("returns card color", () => expect(getInitialColor(red7)).toBe("red"));
  it("returns undefined for wild", () => expect(getInitialColor(wild)).toBeUndefined());
});
```

- [ ] **Step 2: Run test (FAIL)**

Run: `npx vitest run src/tests/game-engine/rules.test.ts`

- [ ] **Step 3: Create rules.ts**

```ts
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
```

- [ ] **Step 4: Run test (PASS)**

Run: `npx vitest run src/tests/game-engine/rules.test.ts`

---

### Task 6: Game Engine — Stacking

**Files:**
- Create: `src/game-engine/stacking.ts`
- Create: `src/tests/game-engine/stacking.test.ts`

- [ ] **Step 1: Write failing stacking test**

```ts
import { describe, it, expect } from "vitest";
import { resolveStack, advanceAfterStack } from "@/game-engine/stacking";
import { Card, Room } from "@/game-engine/types";

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "test", host: "p1",
    players: [
      { id: "p1", name: "A", hand: [], connected: true },
      { id: "p2", name: "B", hand: [], connected: true },
      { id: "p3", name: "C", hand: [], connected: true },
    ],
    status: "playing",
    drawPile: Array(20).fill({ type: "number", color: "red", value: 1 } as Card),
    discardPile: [{ type: "number", color: "blue", value: 5 } as Card],
    currentColor: "blue", direction: 1, currentPlayerIndex: 0,
    turnTimer: 15, calledUno: {}, stackChain: null,
    winner: null, ranking: [], lastDrawnCard: {},
    ...overrides,
  };
}

describe("resolveStack", () => {
  it("draw2: next draws 2", () => {
    const r = resolveStack(makeRoom({ stackChain: { type: "draw2", count: 1 } }));
    expect(r.players[1].hand).toHaveLength(2);
    expect(r.stackChain).toBeNull();
  });

  it("draw2 stacked x2: next draws 4", () => {
    const r = resolveStack(makeRoom({ stackChain: { type: "draw2", count: 2 } }));
    expect(r.players[1].hand).toHaveLength(4);
  });

  it("wild4 stacked x3: next draws 12", () => {
    const r = resolveStack(makeRoom({ stackChain: { type: "wild4", count: 3 } }));
    expect(r.players[1].hand).toHaveLength(12);
  });

  it("skip x2: skips 2 players", () => {
    const r = resolveStack(makeRoom({ stackChain: { type: "skip", count: 2 } }));
    expect(r.currentPlayerIndex).toBe(2);
  });

  it("reverse: inverts direction", () => {
    const r = resolveStack(makeRoom({ stackChain: { type: "reverse", count: 1 } }));
    expect(r.direction).toBe(-1);
  });

  it("reverse with 2 players = skip (stays on same)", () => {
    const room = makeRoom({
      players: makeRoom().players.slice(0, 2),
      stackChain: { type: "reverse", count: 1 },
    });
    const r = resolveStack(room);
    expect(r.currentPlayerIndex).toBe(0);
  });

  it("wild: clears stack", () => {
    const r = resolveStack(makeRoom({ stackChain: { type: "wild", count: 1 } }));
    expect(r.stackChain).toBeNull();
  });
});

describe("advanceAfterStack", () => {
  it("advances forward", () => expect(advanceAfterStack(makeRoom({ currentPlayerIndex: 0, direction: 1 })).currentPlayerIndex).toBe(1));
  it("advances backward", () => expect(advanceAfterStack(makeRoom({ currentPlayerIndex: 1, direction: -1 })).currentPlayerIndex).toBe(0));
  it("wraps forward", () => expect(advanceAfterStack(makeRoom({ currentPlayerIndex: 2, direction: 1 })).currentPlayerIndex).toBe(0));
  it("wraps backward", () => expect(advanceAfterStack(makeRoom({ currentPlayerIndex: 0, direction: -1 })).currentPlayerIndex).toBe(2));
});
```

- [ ] **Step 2: Run test (FAIL)**

Run: `npx vitest run src/tests/game-engine/stacking.test.ts`

- [ ] **Step 3: Create stacking.ts**

```ts
import { Card, Room } from "./types";
import { draw } from "./deck";

const DRAW_MAP: Record<string, number> = { draw2: 2, wild4: 4 };

export function resolveStack(room: Room): Room {
  const chain = room.stackChain;
  if (!chain) return room;

  let updated = { ...room };

  if (chain.type === "draw2" || chain.type === "wild4") {
    const drawCount = DRAW_MAP[chain.type] * chain.count;
    const nextIdx = getNextPlayerIndex(updated);
    let currentDraw = updated.drawPile;

    for (let i = 0; i < drawCount; i++) {
      if (currentDraw.length === 0) {
        currentDraw = [...updated.discardPile.slice(0, -1)].sort(() => Math.random() - 0.5);
      }
      const { card, remaining } = draw(currentDraw);
      currentDraw = remaining;
      updated = {
        ...updated,
        players: updated.players.map((p, idx) =>
          idx === nextIdx ? { ...p, hand: [...p.hand, card] } : p
        ),
      };
    }
    updated = { ...updated, drawPile: currentDraw, stackChain: null };
    updated = advanceAfterStack(updated);
    updated = advanceAfterStack(updated);
    return updated;
  }

  if (chain.type === "skip") {
    for (let i = 0; i < chain.count; i++) updated = advanceAfterStack(updated);
    return { ...updated, stackChain: null };
  }

  if (chain.type === "reverse") {
    const newDir = (updated.direction * -1) as 1 | -1;
    updated = { ...updated, direction: newDir };
    const isTwo = updated.players.length === 2;
    for (let i = 0; i < chain.count; i++) {
      if (isTwo) updated = advanceAfterStack(updated);
      updated = advanceAfterStack(updated);
    }
    if (isTwo) updated = advanceAfterStack({ ...updated, direction: (newDir * -1) as 1 | -1 });
    return { ...updated, stackChain: null, direction: newDir };
  }

  if (chain.type === "wild") return { ...updated, stackChain: null };

  return updated;
}

export function advanceAfterStack(room: Room): Room {
  const n = room.players.length;
  return { ...room, currentPlayerIndex: ((room.currentPlayerIndex + room.direction) % n + n) % n };
}

export function getNextPlayerIndex(room: Room): number {
  const n = room.players.length;
  return ((room.currentPlayerIndex + room.direction) % n + n) % n;
}
```

- [ ] **Step 4: Run test (PASS)**

Run: `npx vitest run src/tests/game-engine/stacking.test.ts`

---

### Task 7: Game Engine — Room Management

**Files:**
- Create: `src/game-engine/room.ts`
- Create: `src/tests/game-engine/room.test.ts`

- [ ] **Step 1: Write failing room test**

```ts
import { describe, it, expect } from "vitest";
import { createRoom, joinRoom, removePlayer, setPlayerDisconnected } from "@/game-engine/room";

describe("createRoom", () => {
  it("creates room with 1 player host", () => {
    const room = createRoom("Alice");
    expect(room.players).toHaveLength(1);
    expect(room.host).toBe(room.players[0].id);
    expect(room.status).toBe("lobby");
    expect(room.id).toMatch(/^[A-Z0-9]{6}$/);
  });
});

describe("joinRoom", () => {
  it("adds player", () => {
    expect(joinRoom(createRoom("A"), "B").players).toHaveLength(2);
  });

  it("throws at 15 players", () => {
    let room = createRoom("H");
    for (let i = 1; i < 15; i++) room = joinRoom(room, `P${i}`);
    expect(() => joinRoom(room, "Extra")).toThrow("Sala cheia");
  });

  it("throws if game started", () => {
    const room = { ...createRoom("H"), status: "playing" as const };
    expect(() => joinRoom(room, "Late")).toThrow("Jogo ja iniciado");
  });
});

describe("removePlayer", () => {
  it("removes player and transfers host", () => {
    let room = joinRoom(createRoom("A"), "B");
    const updated = removePlayer(room, room.players[0].id);
    expect(updated.players).toHaveLength(1);
    expect(updated.host).toBe(updated.players[0].id);
  });
});

describe("setPlayerDisconnected", () => {
  it("marks disconnected", () => {
    const room = createRoom("A");
    expect(setPlayerDisconnected(room, room.players[0].id).players[0].connected).toBe(false);
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

Run: `npx vitest run src/tests/game-engine/room.test.ts`

- [ ] **Step 3: Create room.ts**

```ts
import { Room, Player } from "./types";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function createRoom(playerName: string): Room {
  const player: Player = { id: Math.random().toString(36).slice(2, 10), name: playerName, hand: [], connected: true };
  return {
    id: generateCode(), host: player.id, players: [player], status: "lobby",
    drawPile: [], discardPile: [], currentColor: "red", direction: 1,
    currentPlayerIndex: 0, turnTimer: 15, calledUno: {}, stackChain: null,
    winner: null, ranking: [], lastDrawnCard: {},
  };
}

export function joinRoom(room: Room, playerName: string): Room {
  if (room.status !== "lobby") throw new Error("Jogo ja iniciado");
  if (room.players.length >= 15) throw new Error("Sala cheia (maximo 15 jogadores)");
  const player: Player = { id: Math.random().toString(36).slice(2, 10), name: playerName, hand: [], connected: true };
  return { ...room, players: [...room.players, player] };
}

export function removePlayer(room: Room, playerId: string): Room {
  const remaining = room.players.filter((p) => p.id !== playerId);
  const newHost = room.host === playerId && remaining.length > 0 ? remaining[0].id : room.host;
  return { ...room, players: remaining, host: newHost };
}

export function setPlayerDisconnected(room: Room, playerId: string): Room {
  return { ...room, players: room.players.map((p) => p.id === playerId ? { ...p, connected: false } : p) };
}

export function isPlayerTurn(room: Room, playerId: string): boolean {
  return room.players[room.currentPlayerIndex]?.id === playerId;
}
```

- [ ] **Step 4: Run test (PASS)**

Run: `npx vitest run src/tests/game-engine/room.test.ts`

---

### Task 8: Game Engine — Scoring

**Files:**
- Create: `src/game-engine/scoring.ts`
- Create: `src/tests/game-engine/scoring.test.ts`

- [ ] **Step 1: Write failing scoring test**

```ts
import { describe, it, expect } from "vitest";
import { buildRanking } from "@/game-engine/scoring";
import { startGame } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";

describe("buildRanking", () => {
  it("ranks winner first (empty hand)", () => {
    let room = joinRoom(joinRoom(createRoom("A"), "B"), "C");
    let started = startGame(room);
    const winnerId = started.players[0].id;
    started = { ...started, players: started.players.map((p) => p.id === winnerId ? { ...p, hand: [] } : p) };
    expect(buildRanking(started)[0].id).toBe(winnerId);
  });

  it("ranks by fewer cards for non-winners", () => {
    let room = joinRoom(createRoom("A"), "B");
    let started = startGame(room);
    const [p1, p2] = started.players;
    started = {
      ...started,
      players: [
        { ...p1, hand: [] },
        { ...p2, hand: [{ type: "number", color: "red", value: 3 } as any] },
      ],
    };
    const ranking = buildRanking(started);
    expect(ranking[0].id).toBe(p1.id);
    expect(ranking[1].id).toBe(p2.id);
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

Run: `npx vitest run src/tests/game-engine/scoring.test.ts`

- [ ] **Step 3: Create scoring.ts**

```ts
import { Room, PlayerPublic } from "./types";

export function buildRanking(room: Room): PlayerPublic[] {
  return [...room.players]
    .sort((a, b) => a.hand.length - b.hand.length)
    .map((p) => ({ id: p.id, name: p.name, cardCount: p.hand.length }));
}
```

- [ ] **Step 4: Run test (PASS)**

Run: `npx vitest run src/tests/game-engine/scoring.test.ts`

---

### Task 9: Game Engine — Game Orchestrator

**Files:**
- Create: `src/game-engine/game.ts`
- Create: `src/tests/game-engine/game.test.ts`

- [ ] **Step 1: Write failing game test**

```ts
import { describe, it, expect } from "vitest";
import { startGame, playCard, drawCard, passTurn, callUno, checkWin, processTurnTimeout } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";

describe("startGame", () => {
  it("deals 7 cards to each player", () => {
    const room = joinRoom(joinRoom(createRoom("A"), "B"), "C");
    const started = startGame(room);
    for (const p of started.players) expect(p.hand).toHaveLength(7);
  });

  it("sets status to playing", () => {
    const room = joinRoom(createRoom("A"), "B");
    expect(startGame(room).status).toBe("playing");
  });

  it("first discard is not wild", () => {
    const room = joinRoom(createRoom("A"), "B");
    const top = startGame(room).discardPile[startGame(room).discardPile.length - 1];
    expect(top.type).not.toBe("wild");
    expect(top.type).not.toBe("wild4");
  });

  it("throws if <2 players", () => {
    expect(() => startGame(createRoom("A"))).toThrow("Minimo de 2 jogadores");
  });
});

describe("drawCard", () => {
  it("adds 1 card and sets lastDrawnCard", () => {
    const room = joinRoom(createRoom("A"), "B");
    const started = startGame(room);
    const pid = started.players[0].id;
    const result = drawCard(started, pid);
    expect(result.players[0].hand).toHaveLength(8);
    expect(result.lastDrawnCard[pid]).toBeDefined();
  });
});

describe("callUno", () => {
  it("marks player as having called uno", () => {
    const room = joinRoom(createRoom("A"), "B");
    const started = startGame(room);
    const pid = started.players[0].id;
    expect(callUno(started, pid).calledUno[pid]).toBe(true);
  });
});

describe("checkWin", () => {
  it("returns winner when hand empty", () => {
    const room = joinRoom(createRoom("A"), "B");
    let started = startGame(room);
    const pid = started.players[0].id;
    started = { ...started, players: started.players.map((p) => p.id === pid ? { ...p, hand: [] } : p) };
    expect(checkWin(started).winner!.id).toBe(pid);
  });
});

describe("processTurnTimeout", () => {
  it("draws and advances when no prior draw", () => {
    const room = joinRoom(createRoom("A"), "B");
    let started = { ...startGame(room), lastDrawnCard: {} };
    const pid = started.players[0].id;
    const len = started.players[0].hand.length;
    const result = processTurnTimeout(started, pid);
    expect(result.players[0].hand).toHaveLength(len + 1);
    expect(result.currentPlayerIndex).not.toBe(0);
  });

  it("does not draw again if already drew", () => {
    const room = joinRoom(createRoom("A"), "B");
    let started = startGame(room);
    const pid = started.players[0].id;
    started = drawCard(started, pid);
    const len = started.players[0].hand.length;
    const result = processTurnTimeout(started, pid);
    expect(result.players[0].hand).toHaveLength(len);
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

Run: `npx vitest run src/tests/game-engine/game.test.ts`

- [ ] **Step 3: Create game.ts**

```ts
import { Card, Color, Room } from "./types";
import { createDeck, shuffle, draw, drawInitialCard, reshuffleDiscard } from "./deck";
import { isPlayable, requiresColorChoice, getInitialColor } from "./rules";
import { resolveStack, advanceAfterStack } from "./stacking";
import { buildRanking } from "./scoring";

export function startGame(room: Room): Room {
  if (room.players.length < 2) throw new Error("Minimo de 2 jogadores");

  const deck = shuffle(createDeck());
  const players = room.players.map((p) => ({ ...p, hand: [] as Card[] }));

  let remaining = deck;
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < players.length; j++) {
      const { card, remaining: rest } = draw(remaining);
      players[j] = { ...players[j], hand: [...players[j].hand, card] };
      remaining = rest;
    }
  }

  const { card: firstCard, remaining: afterFirst } = drawInitialCard(remaining);
  const initialColor = getInitialColor(firstCard) || "red";

  return {
    ...room, status: "playing", players, drawPile: afterFirst,
    discardPile: [firstCard], currentColor: initialColor as Color,
    currentPlayerIndex: 0, direction: 1, turnTimer: 15,
    calledUno: {}, stackChain: null, winner: null, ranking: [], lastDrawnCard: {},
  };
}

export function playCard(room: Room, playerId: string, cardIndex: number): Room {
  const pIdx = room.players.findIndex((p) => p.id === playerId);
  if (pIdx === -1) throw new Error("Jogador nao encontrado");

  const player = room.players[pIdx];
  if (cardIndex < 0 || cardIndex >= player.hand.length) throw new Error("Carta invalida");

  const card = player.hand[cardIndex];
  const topCard = room.discardPile[room.discardPile.length - 1];
  if (!isPlayable(card, topCard, room.currentColor)) throw new Error("Carta nao pode ser jogada");

  const remainingHand = [...player.hand.slice(0, cardIndex), ...player.hand.slice(cardIndex + 1)];

  let updated: Room = {
    ...room,
    players: room.players.map((p, i) => i === pIdx ? { ...p, hand: remainingHand } : p),
    discardPile: [...room.discardPile, card],
    lastDrawnCard: { ...room.lastDrawnCard, [playerId]: null },
  };

  const newColor = getInitialColor(card);
  if (newColor) updated = { ...updated, currentColor: newColor };

  // UNO penalty: played penultimate without calling
  if (remainingHand.length === 1 && !room.calledUno[playerId]) {
    const cards: Card[] = [];
    let pile = updated.drawPile;
    for (let i = 0; i < 2; i++) {
      if (pile.length === 0) pile = reshuffleDiscard(pile, updated.discardPile);
      const { card: c, remaining: r } = draw(pile);
      cards.push(c);
      pile = r;
    }
    updated = {
      ...updated,
      players: updated.players.map((p, i) => i === pIdx ? { ...p, hand: [...p.hand, ...cards] } : p),
      drawPile: pile,
    };
  }

  if (updated.players[pIdx].hand.length === 0) return checkWin(updated);

  if (card.type === "skip" || card.type === "reverse" || card.type === "draw2" || card.type === "wild" || card.type === "wild4") {
    if (updated.stackChain && card.type === updated.stackChain.type) {
      updated = { ...updated, stackChain: { type: card.type, count: updated.stackChain.count + 1 } };
    } else {
      updated = { ...updated, stackChain: { type: card.type, count: 1 } };
    }
    updated = advanceAfterStack(updated);
    return updated;
  }

  return advanceAfterStack(updated);
}

export function drawCard(room: Room, playerId: string): Room {
  const pIdx = room.players.findIndex((p) => p.id === playerId);
  if (pIdx === -1) throw new Error("Jogador nao encontrado");

  let pile = room.drawPile;
  if (pile.length === 0) pile = reshuffleDiscard(pile, room.discardPile);
  const { card, remaining } = draw(pile);

  return {
    ...room,
    players: room.players.map((p, i) => i === pIdx ? { ...p, hand: [...p.hand, card] } : p),
    drawPile: remaining,
    lastDrawnCard: { ...room.lastDrawnCard, [playerId]: card },
  };
}

export function playDrawnCard(room: Room, playerId: string): Room {
  const pIdx = room.players.findIndex((p) => p.id === playerId);
  if (pIdx === -1) throw new Error("Jogador nao encontrado");

  const drawnCard = room.lastDrawnCard[playerId];
  if (!drawnCard) throw new Error("Nenhuma carta comprada");

  const topCard = room.discardPile[room.discardPile.length - 1];
  if (!isPlayable(drawnCard, topCard, room.currentColor)) throw new Error("Carta comprada nao pode ser jogada");

  const player = room.players[pIdx];
  const drawnIdx = player.hand.length - 1;

  return playCard(
    { ...room, players: room.players.map((p, i) => i === pIdx ? { ...p, hand: [...p.hand.slice(0, drawnIdx), drawnCard] } : p), lastDrawnCard: { ...room.lastDrawnCard, [playerId]: null } },
    playerId, drawnIdx
  );
}

export function passTurn(room: Room, playerId: string): Room {
  return advanceAfterStack({ ...room, lastDrawnCard: { ...room.lastDrawnCard, [playerId]: null } });
}

export function callUno(room: Room, playerId: string): Room {
  return { ...room, calledUno: { ...room.calledUno, [playerId]: true } };
}

export function chooseColor(room: Room, color: Color): Room {
  return { ...room, currentColor: color };
}

export function checkWin(room: Room): Room {
  const winner = room.players.find((p) => p.hand.length === 0);
  if (!winner) return room;
  return { ...room, winner, ranking: buildRanking(room), status: "finished" };
}

export function processTurnTimeout(room: Room, playerId: string): Room {
  const hasDrawn = room.lastDrawnCard[playerId] != null;
  let updated = room;
  if (!hasDrawn) updated = drawCard(updated, playerId);
  return passTurn(updated, playerId);
}
```

- [ ] **Step 4: Run test (PASS)**

Run: `npx vitest run src/tests/game-engine/game.test.ts`

---

### Task 10: Server — Rooms Storage

**Files:**
- Create: `src/server/rooms.ts`

- [ ] **Step 1: Create rooms.ts** — copy exact from NoWay:

```ts
import { Room } from "@/game-engine/types";

const rooms = new Map<string, Room>();

export function getRoom(roomId: string): Room | undefined { return rooms.get(roomId); }
export function setRoom(roomId: string, room: Room): void { rooms.set(roomId, room); }
export function deleteRoom(roomId: string): void { rooms.delete(roomId); }

const socketToPlayer = new Map<string, { roomId: string; playerId: string }>();
const playerToSocket = new Map<string, string>();

export function mapSocketToPlayer(socketId: string, roomId: string, playerId: string): void {
  socketToPlayer.set(socketId, { roomId, playerId });
  playerToSocket.set(playerId, socketId);
}

export function removeSocketMapping(socketId: string): { roomId: string; playerId: string } | undefined {
  const mapping = socketToPlayer.get(socketId);
  if (mapping) { socketToPlayer.delete(socketId); playerToSocket.delete(mapping.playerId); }
  return mapping;
}

export function getSocketId(playerId: string): string | undefined { return playerToSocket.get(playerId); }

export function getRoomBySocketId(socketId: string): Room | undefined {
  const m = socketToPlayer.get(socketId);
  return m ? rooms.get(m.roomId) : undefined;
}

export function getPlayerIdBySocketId(socketId: string): string | undefined {
  return socketToPlayer.get(socketId)?.playerId;
}
```

---

### Task 11: Server — Socket Handlers

**Files:**
- Create: `src/server/socket.ts`

- [ ] **Step 1: Create socket.ts** — Uno-specific game flow with per-player state:

```ts
import { Server as SocketIOServer, Socket } from "socket.io";
import { createRoom, joinRoom, removePlayer, setPlayerDisconnected, isPlayerTurn } from "@/game-engine/room";
import { startGame, playCard, drawCard, playDrawnCard, passTurn, callUno, chooseColor, checkWin, processTurnTimeout } from "@/game-engine/game";
import { resolveStack } from "@/game-engine/stacking";
import { requiresColorChoice } from "@/game-engine/rules";
import { getRoom, setRoom, deleteRoom, mapSocketToPlayer, removeSocketMapping, getRoomBySocketId, getPlayerIdBySocketId, getSocketId } from "./rooms";
import { PlayerGameState } from "@/game-engine/types";

const TURN_TIMEOUT = 15000;
const roomTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function setupSocket(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {

    socket.on("room:create", ({ playerName }: { playerName: string }) => {
      if (!playerName?.trim()) { socket.emit("error", { message: "Nome nao pode ser vazio" }); return; }
      const room = createRoom(playerName.trim());
      setRoom(room.id, room);
      const player = room.players[0];
      mapSocketToPlayer(socket.id, room.id, player.id);
      socket.join(room.id);
      socket.emit("player:id", player.id);
      socket.emit("room:state", room);
    });

    socket.on("room:join", ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
      const room = getRoom(roomCode?.toUpperCase());
      if (!room) { socket.emit("error", { message: "Sala nao encontrada" }); return; }
      if (!playerName?.trim()) { socket.emit("error", { message: "Nome nao pode ser vazio" }); return; }
      try {
        const updated = joinRoom(room, playerName.trim());
        setRoom(room.id, updated);
        const player = updated.players[updated.players.length - 1];
        mapSocketToPlayer(socket.id, room.id, player.id);
        socket.join(room.id);
        socket.emit("player:id", player.id);
        io.to(room.id).emit("room:state", updated);
      } catch (e: any) { socket.emit("error", { message: e.message }); }
    });

    socket.on("room:start", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room) return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (room.host !== playerId) { socket.emit("error", { message: "Apenas o host pode iniciar" }); return; }
      try {
        const started = startGame(room);
        setRoom(room.id, started);
        io.to(room.id).emit("room:state", { ...started, status: "playing" });
        sendYourState(io, started);
      } catch (e: any) { socket.emit("error", { message: e.message }); }
    });

    socket.on("game:play-card", ({ cardIndex }: { cardIndex: number }) => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) { socket.emit("error", { message: "Nao e seu turno" }); return; }
      try {
        clearRoomTimer(room.id);
        let updated = playCard(room, playerId, cardIndex);
        if (updated.status === "finished") { setRoom(room.id, updated); io.to(room.id).emit("game:end", { winner: toPublic(updated.winner!), ranking: updated.ranking }); return; }
        if (requiresColorChoice(updated.discardPile[updated.discardPile.length - 1])) {
          setRoom(room.id, updated);
          const sid = getSocketId(updated.players[updated.currentPlayerIndex].id);
          if (sid) io.to(sid).emit("game:color-prompt", {});
          return;
        }
        updated = resolveStack(updated);
        setRoom(room.id, updated);
        if (updated.status === "finished") { io.to(room.id).emit("game:end", { winner: toPublic(updated.winner!), ranking: updated.ranking }); return; }
        startTurnTimer(io, updated, room.id);
        sendYourState(io, updated);
      } catch (e: any) { socket.emit("error", { message: e.message }); }
    });

    socket.on("game:draw-card", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) { socket.emit("error", { message: "Nao e seu turno" }); return; }
      try {
        const updated = drawCard(room, playerId);
        setRoom(room.id, updated);
        sendYourState(io, updated);
      } catch (e: any) { socket.emit("error", { message: e.message }); }
    });

    socket.on("game:play-drawn-card", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) { socket.emit("error", { message: "Nao e seu turno" }); return; }
      try {
        clearRoomTimer(room.id);
        let updated = playDrawnCard(room, playerId);
        if (updated.status === "finished") { setRoom(room.id, updated); io.to(room.id).emit("game:end", { winner: toPublic(updated.winner!), ranking: updated.ranking }); return; }
        if (requiresColorChoice(updated.discardPile[updated.discardPile.length - 1])) { setRoom(room.id, updated); sendYourState(io, updated); return; }
        updated = resolveStack(updated);
        setRoom(room.id, updated);
        if (updated.status === "finished") { io.to(room.id).emit("game:end", { winner: toPublic(updated.winner!), ranking: updated.ranking }); return; }
        startTurnTimer(io, updated, room.id);
        sendYourState(io, updated);
      } catch (e: any) { socket.emit("error", { message: e.message }); }
    });

    socket.on("game:pass", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId || !isPlayerTurn(room, playerId)) { socket.emit("error", { message: "Nao e seu turno" }); return; }
      clearRoomTimer(room.id);
      const updated = passTurn(room, playerId);
      setRoom(room.id, updated);
      startTurnTimer(io, updated, room.id);
      sendYourState(io, updated);
    });

    socket.on("game:call-uno", () => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!playerId) return;
      const updated = callUno(room, playerId);
      setRoom(room.id, updated);
      sendYourState(io, updated);
    });

    socket.on("game:choose-color", ({ color }: { color: string }) => {
      const room = getRoomBySocketId(socket.id);
      if (!room || room.status !== "playing") return;
      const valid = ["red", "blue", "green", "yellow"];
      if (!valid.includes(color)) { socket.emit("error", { message: "Cor invalida" }); return; }
      let updated = chooseColor(room, color as any);
      updated = resolveStack(updated);
      setRoom(room.id, updated);
      if (updated.status === "finished") { io.to(room.id).emit("game:end", { winner: toPublic(updated.winner!), ranking: updated.ranking }); return; }
      startTurnTimer(io, updated, room.id);
      sendYourState(io, updated);
    });

    socket.on("disconnect", () => {
      const mapping = removeSocketMapping(socket.id);
      if (!mapping) return;
      const room = getRoom(mapping.roomId);
      if (!room) return;
      clearRoomTimer(mapping.roomId);
      const updated = setPlayerDisconnected(room, mapping.playerId);
      setRoom(mapping.roomId, updated);
      io.to(mapping.roomId).emit("room:state", updated);
      setTimeout(() => {
        const r = getRoom(mapping.roomId);
        if (r) {
          const p = r.players.find((x) => x.id === mapping.playerId);
          if (p && !p.connected) {
            const cleaned = removePlayer(r, mapping.playerId);
            clearRoomTimer(mapping.roomId);
            if (cleaned.players.length === 0) deleteRoom(mapping.roomId);
            else { setRoom(mapping.roomId, cleaned); io.to(mapping.roomId).emit("room:state", cleaned); if (cleaned.status === "playing") sendYourState(io, cleaned); }
          }
        }
      }, 60000);
    });
  });
}

function clearRoomTimer(roomId: string) { const t = roomTimers.get(roomId); if (t) clearTimeout(t); roomTimers.delete(roomId); }

function startTurnTimer(io: SocketIOServer, room: any, roomId: string) {
  clearRoomTimer(roomId);
  const timer = setTimeout(() => {
    const r = getRoom(roomId);
    if (!r || r.status !== "playing") return;
    const cp = r.players[r.currentPlayerIndex];
    if (!cp) return;
    const updated = processTurnTimeout(r, cp.id);
    setRoom(roomId, updated);
    sendYourState(io, updated);
  }, TURN_TIMEOUT);
  roomTimers.set(roomId, timer);
}

function sendYourState(io: SocketIOServer, room: any) {
  const topCard = room.discardPile[room.discardPile.length - 1];
  const currentPlayer = room.players[room.currentPlayerIndex];
  for (const player of room.players) {
    const sockId = getSocketId(player.id);
    if (!sockId) continue;
    const hand = player.hand;
    const canPlay = hand.some((c: any) => c.type === "wild" || c.type === "wild4" || ("color" in c && (c.color === room.currentColor || c.type === topCard.type || (c.type === "number" && topCard.type === "number" && c.value === topCard.value))));
    const isMyTurn = player.id === currentPlayer?.id;
    const drawnCard = room.lastDrawnCard[player.id];
    const canStack = isMyTurn && room.stackChain ? hand.some((c: any) => c.type === room.stackChain.type) : false;
    const state: PlayerGameState = {
      hand, currentCard: topCard, currentColor: room.currentColor,
      drawPileCount: room.drawPile.length, direction: room.direction,
      players: room.players.map((p: any) => ({ id: p.id, name: p.name, cardCount: p.hand.length })),
      currentPlayerId: currentPlayer?.id || "", turnTimer: isMyTurn ? TURN_TIMEOUT / 1000 : 0,
      calledUno: room.calledUno[player.id] || false,
      canPlay: isMyTurn && canPlay, canStack,
      isDrawing: isMyTurn && drawnCard != null,
      drawnCardPlayable: isMyTurn && drawnCard != null ? (drawnCard.type === "wild" || drawnCard.type === "wild4" || ("color" in drawnCard && (drawnCard.color === room.currentColor || drawnCard.type === topCard.type || (drawnCard.type === "number" && topCard.type === "number" && drawnCard.value === topCard.value)))) : false,
    };
    io.to(sockId).emit("game:your-state", state);
  }
}

function toPublic(p: any) { return { id: p.id, name: p.name, cardCount: p.hand.length }; }
```

---

### Task 12: Client — Socket & Zustand Store

**Files:**
- Create: `src/lib/socket.ts`
- Create: `src/lib/store.ts`

- [ ] **Step 1: Create socket.ts** — copy exact from NoWay:

```ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) socket = io(process.env.NEXT_PUBLIC_WS_URL || "", { autoConnect: false });
  return socket;
}

export function connectSocket(): Socket { const s = getSocket(); if (!s.connected) s.connect(); return s; }
export function disconnectSocket(): void { if (socket?.connected) socket.disconnect(); }
```

- [ ] **Step 2: Create store.ts**

```ts
import { create } from "zustand";
import { Room, PlayerGameState, GameResult } from "@/game-engine/types";
import { getSocket } from "./socket";

interface GameStore {
  room: Room | null;
  myPlayerId: string | null;
  gameState: PlayerGameState | null;
  gameResult: GameResult | null;
  showColorPicker: boolean;
  error: string | null;
  setRoom: (room: Room) => void;
  setMyPlayerId: (id: string) => void;
  setGameState: (state: PlayerGameState) => void;
  setGameResult: (result: GameResult) => void;
  setShowColorPicker: (show: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null, myPlayerId: null, gameState: null, gameResult: null, showColorPicker: false, error: null,
  setRoom: (room) => set({ room, error: null }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setGameState: (state) => set({ gameState: state }),
  setGameResult: (result) => set({ gameResult: result }),
  setShowColorPicker: (show) => set({ showColorPicker: show }),
  setError: (error) => set({ error }),
  reset: () => set({ room: null, myPlayerId: null, gameState: null, gameResult: null, showColorPicker: false, error: null }),
}));

let listenersSetup = false;

export function setupSocketListeners(): void {
  if (listenersSetup) return;
  listenersSetup = true;
  const socket = getSocket();

  socket.on("room:state", (room: Room) => {
    useGameStore.setState((s) => ({ room, error: null, gameResult: room.status === "playing" ? null : s.gameResult }));
  });

  socket.on("player:id", (id: string) => useGameStore.getState().setMyPlayerId(id));
  socket.on("game:your-state", (state: PlayerGameState) => useGameStore.getState().setGameState(state));
  socket.on("game:color-prompt", () => useGameStore.getState().setShowColorPicker(true));
  socket.on("game:end", (result: GameResult) => useGameStore.getState().setGameResult(result));

  let errorTimer: ReturnType<typeof setTimeout>;
  socket.on("error", ({ message }: { message: string }) => {
    useGameStore.getState().setError(message);
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => useGameStore.getState().setError(null), 5000);
  });

  socket.on("disconnect", () => useGameStore.getState().setError("Conexao perdida. Tentando reconectar..."));
}
```

---

### Task 13: App Layout & Global Styles

**Files:**
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `public/icon.svg`

- [ ] **Step 1: Create globals.css** — copy from NoWay, change brand to Uno red:

```css
@import "tailwindcss";

@theme {
  --color-surface: #050505;
  --color-surface-raised: #0d0d0d;
  --color-surface-overlay: #141414;
  --color-surface-card: #1a1a1a;
  --color-brand: #e74c3c;
  --color-brand-light: #ff6b6b;
  --color-brand-dark: #c0392b;
  --color-brand-glow: rgba(231, 76, 60, 0.18);
  --color-uno-red: #e74c3c;
  --color-uno-blue: #3498db;
  --color-uno-green: #2ecc71;
  --color-uno-yellow: #f1c40f;
  --color-accent-danger: #ef4444;
  --color-accent-success: #22c55e;
  --color-accent-warning: #eab308;
  --color-accent-info: #3498db;
  --color-text-primary: #fafafa;
  --color-text-secondary: #a3a3a3;
  --color-text-muted: #737373;
  --color-border: rgba(255, 255, 255, 0.06);
  --color-border-hover: rgba(255, 255, 255, 0.1);

  --font-sans: Inter, system-ui, sans-serif;
  --font-mono: JetBrains Mono, Fira Code, monospace;

  --animate-fade-in: fadeIn 200ms ease-out;
  --animate-slide-up: slideUp 250ms ease-out;
  --animate-scale-in: scaleIn 200ms ease-out;
  --animate-float: float 3s ease-in-out infinite;
  --animate-bounce-in: bounceIn 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --animate-glow-pulse: glowPulse 2s ease-in-out infinite;

  @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
  @keyframes slideUp { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes scaleIn { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  @keyframes bounceIn { 0% { opacity: 0; transform: scale(0.3); } 50% { transform: scale(1.08); } 70% { transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 4px rgba(231,76,60,0.15); } 50% { box-shadow: 0 0 18px rgba(231,76,60,0.35); } }
}

@layer base {
  body { background-color: var(--color-surface); color: var(--color-text-primary); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; overflow-x: hidden; }
  input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type="number"] { -moz-appearance: textfield; }
}

@layer utilities {
  .touch-target { min-height: 44px; min-width: 44px; }
  .text-balance { text-wrap: balance; }
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.15); }
* { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.08) transparent; }
```

- [ ] **Step 2: Create layout.tsx** — same as NoWay, Otto theme:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Otto - Uno",
  description: "Jogo de cartas Uno multiplayer",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="antialiased">
      <body className="bg-surface text-text-primary min-h-dvh">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create icon.svg** — Uno-style icon with rounded card:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <ellipse cx="50" cy="50" rx="45" ry="55" fill="#e74c3c" stroke="#fff" stroke-width="4"/>
  <ellipse cx="50" cy="50" rx="25" ry="33" fill="#fff"/>
  <text x="50" y="62" text-anchor="middle" font-size="30" font-weight="900" fill="#e74c3c">U</text>
</svg>
```

---

### Task 14: Components — Card, CardHand, PlayerBar, ColorPicker, GameResult, RulesModal

**Files:**
- Create: `src/components/card.tsx`
- Create: `src/components/card-hand.tsx`
- Create: `src/components/player-bar.tsx`
- Create: `src/components/color-picker.tsx`
- Create: `src/components/game-result.tsx`
- Create: `src/components/rules-modal.tsx`
- Create: `src/components/action-buttons.tsx`

- [ ] **Step 1: Create card.tsx**

```tsx
"use client";
import { Card as CardType } from "@/game-engine/types";
import { Ban, RefreshCw, Sparkles, Zap } from "lucide-react";

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: "bg-uno-red", text: "text-white", border: "border-uno-red" },
  blue: { bg: "bg-uno-blue", text: "text-white", border: "border-uno-blue" },
  green: { bg: "bg-uno-green", text: "text-white", border: "border-uno-green" },
  yellow: { bg: "bg-uno-yellow", text: "text-black", border: "border-uno-yellow" },
};

interface CardProps {
  card: CardType;
  onClick?: () => void;
  selected?: boolean;
  playable?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Card({ card, onClick, selected, playable, size = "md" }: CardProps) {
  const isWild = card.type === "wild" || card.type === "wild4";
  const colors = isWild ? { bg: "bg-gray-900", text: "text-white", border: "border-gray-700" } : COLOR_MAP[card.color!] || COLOR_MAP.red;
  const sizes = { sm: "w-10 h-14 text-xs rounded-md", md: "w-14 h-20 text-sm rounded-lg", lg: "w-20 h-28 text-lg rounded-xl" };

  const content = () => {
    switch (card.type) {
      case "number": return <span className="font-black text-2xl">{card.value}</span>;
      case "skip": return <Ban size={20} />;
      case "reverse": return <RefreshCw size={20} />;
      case "draw2": return <span className="font-black">+2</span>;
      case "wild": return <Sparkles size={20} />;
      case "wild4": return <><span className="font-black">+4</span><Zap size={14} /></>;
    }
  };

  return (
    <button onClick={onClick} disabled={!playable && onClick != null}
      className={`${sizes[size]} ${colors.bg} ${colors.text} flex flex-col items-center justify-center gap-1 border-2 ${colors.border} transition-all duration-200 font-bold select-none
        ${selected ? "ring-2 ring-white ring-offset-2 ring-offset-surface -translate-y-2" : ""}
        ${playable ? "hover:-translate-y-2 hover:shadow-lg cursor-pointer" : onClick ? "opacity-50 cursor-not-allowed" : "cursor-default"}`}
    >{content()}</button>
  );
}
```

- [ ] **Step 2: Create card-hand.tsx**

```tsx
"use client";
import { Card as CardType } from "@/game-engine/types";
import Card from "./card";

interface CardHandProps {
  cards: CardType[];
  selectedIndex: number | null;
  onSelectCard: (index: number) => void;
  playableCards: boolean[];
  disabled: boolean;
}

export default function CardHand({ cards, selectedIndex, onSelectCard, playableCards, disabled }: CardHandProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-surface via-surface/95 to-transparent">
      <div className="flex justify-center items-end gap-1 overflow-x-auto pb-2">
        {cards.map((card, i) => (
          <Card key={i} card={card} selected={selectedIndex === i} playable={playableCards[i] && !disabled} onClick={() => onSelectCard(i)} size="md" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create player-bar.tsx**

```tsx
"use client";
import { PlayerPublic } from "@/game-engine/types";

interface PlayerBarProps { players: PlayerPublic[]; currentPlayerId: string; myPlayerId: string; direction: 1 | -1; }

export default function PlayerBar({ players, currentPlayerId, myPlayerId, direction }: PlayerBarProps) {
  const others = players.filter((p) => p.id !== myPlayerId);
  return (
    <div className="flex justify-center gap-3 flex-wrap px-4 pt-4">
      {others.map((p) => (
        <div key={p.id} className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl min-w-[80px] transition-all duration-200 ${p.id === currentPlayerId ? "bg-uno-red/20 border-2 border-uno-red shadow-lg shadow-uno-red/20" : "bg-surface-raised border border-border"}`}>
          <span className="text-xs text-text-muted truncate max-w-[80px]">{p.name}</span>
          <span className="text-xl font-black text-text-primary">{p.cardCount}</span>
          <span className="text-[10px] text-text-muted">cartas</span>
        </div>
      ))}
      {direction === -1 && <span className="text-xs text-text-muted self-center">↺ invertido</span>}
    </div>
  );
}
```

- [ ] **Step 4: Create action-buttons.tsx**

```tsx
"use client";
import { Play, Download, SkipForward, Megaphone } from "lucide-react";

interface ActionButtonsProps {
  canPlay: boolean; canStack: boolean; hasSelectedCard: boolean;
  hasDrawn: boolean; drawnPlayable: boolean; calledUno: boolean;
  handSize: number; isMyTurn: boolean;
  onPlay: () => void; onDraw: () => void; onPlayDrawn: () => void;
  onPass: () => void; onUno: () => void;
}

export default function ActionButtons(props: ActionButtonsProps) {
  if (!props.isMyTurn) return <div className="flex justify-center py-4"><p className="text-text-muted text-sm animate-pulse">Aguardando seu turno...</p></div>;

  const showUno = props.handSize === 2 && !props.calledUno;
  const canPlayCard = props.canPlay && props.hasSelectedCard;

  return (
    <div className="flex justify-center gap-3 py-3 flex-wrap">
      {showUno && (
        <button onClick={props.onUno} className="px-5 py-3 rounded-xl bg-uno-yellow text-black font-black text-base hover:bg-yellow-300 active:scale-[0.95] transition-all duration-200 shadow-lg shadow-uno-yellow/30 animate-bounce-in flex items-center gap-2">
          <Megaphone size={18} />UNO!
        </button>
      )}
      {!props.hasDrawn && (
        <>
          <button onClick={props.onPlay} disabled={!canPlayCard} className={`px-5 py-3 rounded-xl font-black text-base transition-all duration-200 ${canPlayCard ? "bg-uno-green text-white hover:bg-green-600 active:scale-[0.95] shadow-lg shadow-green-500/30" : "bg-surface-raised text-text-muted border border-border"}`}>
            <Play size={18} className="inline mr-1" />Jogar
          </button>
          <button onClick={props.onDraw} className="px-5 py-3 rounded-xl bg-uno-blue text-white font-black text-base hover:bg-blue-600 active:scale-[0.95] transition-all duration-200 shadow-lg shadow-blue-500/30">
            <Download size={18} className="inline mr-1" />Comprar
          </button>
        </>
      )}
      {props.hasDrawn && props.drawnPlayable && (
        <button onClick={props.onPlayDrawn} className="px-5 py-3 rounded-xl bg-uno-green text-white font-black text-base hover:bg-green-600 active:scale-[0.95] transition-all duration-200 shadow-lg shadow-green-500/30">
          <Play size={18} className="inline mr-1" />Jogar esta carta
        </button>
      )}
      {props.hasDrawn && !props.drawnPlayable && (
        <button onClick={props.onPass} className="px-5 py-3 rounded-xl bg-surface-raised text-text-primary font-black text-base hover:bg-surface-card border-2 border-border active:scale-[0.95] transition-all duration-200">
          <SkipForward size={18} className="inline mr-1" />Passar
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create color-picker.tsx**

```tsx
"use client";
import { useGameStore } from "@/lib/store";
import { getSocket } from "@/lib/socket";

const COLORS = [
  { color: "red", bg: "bg-uno-red", label: "Vermelho" },
  { color: "blue", bg: "bg-uno-blue", label: "Azul" },
  { color: "green", bg: "bg-uno-green", label: "Verde" },
  { color: "yellow", bg: "bg-uno-yellow", label: "Amarelo" },
];

export default function ColorPicker() {
  const show = useGameStore((s) => s.showColorPicker);
  if (!show) return null;

  const pick = (color: string) => { getSocket().emit("game:choose-color", { color }); useGameStore.getState().setShowColorPicker(false); };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface-card rounded-2xl p-6 space-y-4 animate-scale-in border border-border max-w-xs w-full mx-4">
        <h3 className="text-lg font-bold text-center text-text-primary">Escolha uma cor</h3>
        <div className="grid grid-cols-2 gap-3">
          {COLORS.map((c) => (
            <button key={c.color} onClick={() => pick(c.color)} className={`${c.bg} py-4 rounded-xl font-black text-lg text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create game-result.tsx**

```tsx
"use client";
import { useGameStore } from "@/lib/store";
import { Crown, Medal } from "lucide-react";

export default function GameResult() {
  const result = useGameStore((s) => s.gameResult);
  if (!result) return null;
  const medals = ["text-yellow-400", "text-gray-300", "text-amber-600"];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-surface-card rounded-2xl p-8 space-y-6 animate-scale-in border border-border max-w-sm w-full">
        <div className="text-center space-y-2">
          <Crown size={48} className="mx-auto text-uno-yellow animate-bounce-in" />
          <h2 className="text-2xl font-black text-text-primary">{result.winner.name} venceu!</h2>
        </div>
        <div className="space-y-2">
          {result.ranking.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border">
              <span className={`text-lg ${medals[i] || "text-text-muted"}`}>{i === 0 ? <Crown size={20} /> : <Medal size={20} />}</span>
              <span className="flex-1 text-text-primary font-medium">{p.name}</span>
              <span className="text-sm text-text-muted">{p.cardCount} cartas</span>
            </div>
          ))}
        </div>
        <button onClick={() => window.location.reload()} className="w-full py-3 rounded-xl bg-uno-red text-white font-black text-lg hover:bg-red-600 active:scale-[0.98] transition-all duration-200">
          Nova Partida
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create rules-modal.tsx**

```tsx
"use client";
import { useState } from "react";
import { BookOpen, X } from "lucide-react";

export default function RulesModal() {
  const [open, setOpen] = useState(false);
  if (!open) return (
    <div className="fixed bottom-6 right-6 z-40">
      <button onClick={() => setOpen(true)} className="w-12 h-12 rounded-full bg-surface-card border border-border flex items-center justify-center hover:bg-surface-overlay transition-all duration-200 shadow-lg">
        <BookOpen size={20} className="text-text-secondary" />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-surface-card rounded-2xl p-6 space-y-4 animate-scale-in border border-border max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-text-primary">Regras do Uno</h2>
          <button onClick={() => setOpen(false)} className="p-2"><X size={20} className="text-text-muted" /></button>
        </div>
        <div className="space-y-3 text-sm text-text-secondary">
          <p><strong className="text-text-primary">Objetivo:</strong> Ser o primeiro a ficar sem cartas na mao.</p>
          <p><strong className="text-text-primary">Jogada:</strong> Jogue uma carta que combine por cor, numero ou tipo com a do topo.</p>
          <p><strong className="text-text-primary">Cartas Especiais:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pular (⊘):</strong> Proximo perde a vez.</li>
            <li><strong>Inverter (↺):</strong> Inverte sentido. 2 jogadores = Pular.</li>
            <li><strong>+2:</strong> Proximo compra 2 e perde a vez.</li>
            <li><strong>Curinga:</strong> Escolha uma nova cor.</li>
            <li><strong>+4:</strong> Escolha cor e proximo compra 4.</li>
          </ul>
          <p><strong className="text-text-primary">Empilhamento:</strong> Cartas do mesmo tipo empilham (+2/+2, +4/+4, etc).</p>
          <p><strong className="text-text-primary">UNO:</strong> Com 2 cartas, declare UNO antes de jogar a penultima. Sem declarar: +2 cartas.</p>
          <p><strong className="text-text-primary">Comprar:</strong> Sem carta jogavel, compre do monte. Se servir, pode joga-la.</p>
          <p><strong className="text-text-primary">Timer:</strong> 15s por turno. Estourou = compra 1 e passa.</p>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 15: Game Board Component

**Files:**
- Create: `src/components/game-board.tsx`

- [ ] **Step 1: Create game-board.tsx**

```tsx
"use client";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { getSocket } from "@/lib/socket";
import Card from "./card";
import CardHand from "./card-hand";
import PlayerBar from "./player-bar";
import ActionButtons from "./action-buttons";
import ColorPicker from "./color-picker";
import GameResult from "./game-result";
import { Card as CardType } from "@/game-engine/types";

export default function GameBoard() {
  const router = useRouter();
  const { gameState, gameResult, myPlayerId } = useGameStore();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timer, setTimer] = useState(15);

  useEffect(() => {
    if (!gameState) return;
    setTimer(gameState.turnTimer);
    const int = setInterval(() => setTimer((t) => { if (t <= 1) { clearInterval(int); return 0; } return t - 1; }), 1000);
    return () => clearInterval(int);
  }, [gameState?.currentPlayerId, gameState?.turnTimer]);

  useEffect(() => {
    if (gameResult) return;
    if (!gameState && !useGameStore.getState().room) router.push("/");
  }, [gameState, gameResult, router]);

  if (!gameState) return null;

  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const hasDrawn = gameState.isDrawing;

  const playableCards = gameState.hand.map((card: CardType) => {
    if (!isMyTurn) return false;
    if (gameState.canStack) return card.type === useGameStore.getState().room?.stackChain?.type;
    if (hasDrawn) return false;
    if (card.type === "wild" || card.type === "wild4") return true;
    const top = gameState.currentCard;
    if ("color" in card && card.color === gameState.currentColor) return true;
    if (card.type === top.type) return true;
    if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
    return false;
  });

  const handlePlay = useCallback(() => {
    if (selectedIndex == null) return;
    getSocket().emit("game:play-card", { cardIndex: selectedIndex });
    setSelectedIndex(null);
  }, [selectedIndex]);

  const handleDraw = useCallback(() => { getSocket().emit("game:draw-card"); setSelectedIndex(null); }, []);
  const handlePlayDrawn = useCallback(() => getSocket().emit("game:play-drawn-card"), []);
  const handlePass = useCallback(() => getSocket().emit("game:pass"), []);
  const handleUno = useCallback(() => getSocket().emit("game:call-uno"), []);

  return (
    <div className="min-h-dvh flex flex-col">
      <PlayerBar players={gameState.players} currentPlayerId={gameState.currentPlayerId} myPlayerId={myPlayerId!} direction={gameState.direction} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-22 rounded-xl bg-surface-raised border-2 border-border flex items-center justify-center">
              <span className="text-2xl font-black text-text-muted">{gameState.drawPileCount}</span>
            </div>
            <span className="text-xs text-text-muted">Comprar</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Card card={gameState.currentCard} size="lg" />
            <span className="text-xs text-text-muted">
              {gameState.currentColor === "red" && "🔴"}
              {gameState.currentColor === "blue" && "🔵"}
              {gameState.currentColor === "green" && "🟢"}
              {gameState.currentColor === "yellow" && "🟡"}
            </span>
          </div>

          {isMyTurn && (
            <div className="text-center">
              <span className={`text-2xl font-black ${timer <= 5 ? "text-accent-danger animate-pulse" : "text-text-primary"}`}>{timer}s</span>
            </div>
          )}
        </div>

        <ActionButtons canPlay={gameState.canPlay} canStack={gameState.canStack} hasSelectedCard={selectedIndex != null}
          hasDrawn={hasDrawn} drawnPlayable={gameState.drawnCardPlayable} calledUno={gameState.calledUno}
          handSize={gameState.hand.length} isMyTurn={isMyTurn}
          onPlay={handlePlay} onDraw={handleDraw} onPlayDrawn={handlePlayDrawn} onPass={handlePass} onUno={handleUno} />
      </div>

      <CardHand cards={gameState.hand} selectedIndex={selectedIndex} onSelectCard={setSelectedIndex}
        playableCards={playableCards} disabled={!isMyTurn || hasDrawn} />

      <ColorPicker />
      <GameResult />
    </div>
  );
}
```

---

### Task 16: App Pages (Home, Lobby, Game)

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/sala/[id]/page.tsx`
- Create: `src/app/jogo/[id]/page.tsx`

- [ ] **Step 1: Create home page** — copy from NoWay, adapt to Otto (no ruleSet):

```tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { connectSocket, getSocket } from "@/lib/socket";
import { setupSocketListeners, useGameStore } from "@/lib/store";
import { Room } from "@/game-engine/types";
import { Users, LogIn, ArrowRight, Gamepad2 } from "lucide-react";
import RulesModal from "@/components/rules-modal";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const { error, setError } = useGameStore();

  useEffect(() => { setupSocketListeners(); connectSocket(); }, []);

  useEffect(() => {
    const socket = getSocket();
    function onRoomState(room: Room) { router.push(`/sala/${room.id}`); }
    socket.on("room:state", onRoomState);
    return () => { socket.off("room:state", onRoomState); };
  }, [router]);

  const handleCreate = useCallback(() => {
    if (!name.trim()) { setError("Digite seu nome"); return; }
    getSocket().emit("room:create", { playerName: name.trim() });
  }, [name, setError]);

  const handleJoin = useCallback(() => {
    if (!name.trim()) { setError("Digite seu nome"); return; }
    if (!roomCode.trim()) { setError("Digite o codigo da sala"); return; }
    getSocket().emit("room:join", { roomCode: roomCode.trim().toUpperCase(), playerName: name.trim() });
  }, [name, roomCode, setError]);

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-surface">
      <div className="w-full max-w-md space-y-10 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-18 h-24 rounded-2xl bg-uno-red flex items-center justify-center shadow-2xl shadow-uno-red/30 animate-float">
              <Gamepad2 size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-text-primary tracking-tight">Otto</h1>
          <p className="text-text-secondary text-lg mt-1 font-medium">Uno Multiplayer</p>
          <p className="text-text-muted text-sm">2-15 jogadores</p>
        </div>

        <div className="space-y-4">
          <input className="w-full px-5 py-4 rounded-2xl bg-surface-raised border-2 border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-uno-red/40 focus:bg-surface-card transition-all duration-300 text-lg font-medium touch-target"
            placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} />

          <button onClick={handleCreate} className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-gradient-to-r from-uno-red to-red-700 hover:from-red-500 hover:to-red-800 active:scale-[0.98] text-white font-black text-lg transition-all duration-200 touch-target shadow-2xl shadow-uno-red/30">
            <Users size={22} />Criar Sala<ArrowRight size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-text-muted text-xs font-medium">ou entre em uma sala</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="flex gap-2">
            <input className="flex-1 px-5 py-4 rounded-2xl bg-surface-raised border-2 border-border text-text-primary placeholder:text-text-muted/50 text-center text-lg font-mono font-bold tracking-[0.4em] uppercase focus:outline-none focus:border-uno-red/40 transition-all duration-300 touch-target"
              placeholder="CODIGO" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} maxLength={6} />
            <button onClick={handleJoin} className="px-7 py-4 rounded-2xl bg-surface-raised hover:bg-surface-card border-2 border-border hover:border-uno-red/30 text-text-primary font-bold text-lg transition-all duration-200 active:scale-[0.98] touch-target">
              <LogIn size={22} />
            </button>
          </div>
        </div>

        {error && <div className="px-5 py-4 rounded-2xl bg-accent-danger/10 border-2 border-accent-danger/20 text-accent-danger text-sm font-medium text-center animate-slide-up">{error}</div>}
      </div>
      <RulesModal />
    </main>
  );
}
```

- [ ] **Step 2: Create lobby page** — copy from NoWay, update to 15 players:

```tsx
"use client";
import { useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/lib/store";
import { Copy, Play, Users, Crown, WifiOff } from "lucide-react";
import RulesModal from "@/components/rules-modal";

export const dynamic = "force-dynamic";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const { room, myPlayerId } = useGameStore();

  useEffect(() => { if (!room) router.push("/"); }, [room, router]);

  const idRef = useRef(params.id);
  idRef.current = params.id;

  useEffect(() => {
    const socket = getSocket();
    function onUpdate(updated: ReturnType<typeof useGameStore.getState>["room"]) {
      if (!updated) return;
      useGameStore.getState().setRoom(updated);
      if (updated.status === "playing") router.push(`/jogo/${idRef.current}`);
    }
    socket.on("room:state", onUpdate);
    return () => { socket.off("room:state", onUpdate); };
  }, []);

  if (!room) return null;

  const isHost = myPlayerId === room.host;
  const canStart = room.players.length >= 2;

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-surface">
      <div className="w-full max-w-md space-y-8 animate-scale-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-uno-red flex items-center justify-center shadow-lg shadow-uno-red/30">
            <Users size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Sala de Espera</h1>
        </div>

        <div className="text-center p-6 rounded-xl bg-surface-raised border border-border">
          <p className="text-text-muted text-sm mb-2">Codigo da sala</p>
          <button onClick={() => navigator.clipboard.writeText(room.id).catch(() => {})} className="group flex items-center justify-center gap-3 mx-auto text-4xl font-mono font-bold text-uno-red hover:text-red-400 tracking-[0.3em] transition-all duration-200 touch-target">
            {room.id}<Copy size={20} />
          </button>
          <p className="text-text-muted text-xs mt-2">Clique para copiar</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-text-secondary flex items-center gap-2"><Users size={16} />Jogadores</span>
            <span className="text-sm font-mono text-text-muted">{room.players.length}/15</span>
          </div>
          {room.players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-4 rounded-xl bg-surface-raised border border-border animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className={`shrink-0 w-3 h-3 rounded-full ${p.connected ? "bg-accent-success shadow-[0_0_6px_rgba(34,197,94,0.4)]" : "bg-accent-warning"}`} />
              <span className="flex-1 text-text-primary font-medium truncate">{p.name}{p.id === myPlayerId && <span className="text-text-muted ml-2 text-sm">(voce)</span>}</span>
              {p.id === room.host && <span className="flex items-center gap-1 text-accent-warning text-xs font-semibold"><Crown size={14} />HOST</span>}
              {!p.connected && <WifiOff size={14} className="text-accent-warning shrink-0" />}
            </div>
          ))}
        </div>

        {isHost ? (
          <button onClick={() => { if (canStart) getSocket().emit("room:start"); }} disabled={!canStart} className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-200 touch-target ${canStart ? "bg-accent-success text-white hover:bg-accent-success/90 active:scale-[0.98] shadow-lg shadow-accent-success/25" : "bg-surface-raised text-text-muted cursor-not-allowed border border-border"}`}>
            <Play size={22} />{canStart ? "Iniciar Partida" : "Aguardando jogadores..."}
          </button>
        ) : (
          <div className="text-center py-6"><p className="text-text-muted text-sm animate-pulse">Aguardando o host iniciar a partida...</p></div>
        )}
        <RulesModal />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create game page**

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore, setupSocketListeners } from "@/lib/store";
import { connectSocket } from "@/lib/socket";
import GameBoard from "@/components/game-board";
import RulesModal from "@/components/rules-modal";

export const dynamic = "force-dynamic";

export default function GamePage() {
  const router = useRouter();
  const { room } = useGameStore();

  useEffect(() => { setupSocketListeners(); connectSocket(); }, []);
  useEffect(() => { if (!room) router.push("/"); }, [room, router]);
  if (!room) return null;

  return <main className="min-h-screen bg-surface"><GameBoard /><RulesModal /></main>;
}
```

---

### Task 17: Remaining Unit Tests (Turn + Edge Cases)

**Files:**
- Create: `src/tests/game-engine/turn.test.ts`
- Create: `src/tests/game-engine/edge-cases.test.ts`

- [ ] **Step 1: Create turn.test.ts**

```ts
import { describe, it, expect } from "vitest";
import { startGame, drawCard, passTurn, processTurnTimeout, playDrawnCard } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { Card } from "@/game-engine/types";

describe("turn cycle", () => {
  it("draw then pass when card not playable", () => {
    let room = joinRoom(createRoom("A"), "B");
    let started = startGame(room);
    const pid = started.players[0].id;
    let updated = drawCard(started, pid);
    expect(updated.lastDrawnCard[pid]).toBeDefined();
    updated = passTurn(updated, pid);
    expect(updated.currentPlayerIndex).not.toBe(0);
  });

  it("timeout without drawing: auto-draws and advances", () => {
    let room = joinRoom(createRoom("A"), "B");
    let started = { ...startGame(room), lastDrawnCard: {} };
    const pid = started.players[0].id;
    const len = started.players[0].hand.length;
    const result = processTurnTimeout(started, pid);
    expect(result.players[0].hand).toHaveLength(len + 1);
    expect(result.currentPlayerIndex).not.toBe(0);
  });

  it("timeout after drawing: does not draw again", () => {
    let room = joinRoom(createRoom("A"), "B");
    let started = startGame(room);
    const pid = started.players[0].id;
    started = drawCard(started, pid);
    const len = started.players[0].hand.length;
    const result = processTurnTimeout(started, pid);
    expect(result.players[0].hand).toHaveLength(len);
  });
});
```

- [ ] **Step 2: Create edge-cases.test.ts**

```ts
import { describe, it, expect } from "vitest";
import { startGame, drawCard } from "@/game-engine/game";
import { createRoom, joinRoom, removePlayer } from "@/game-engine/room";
import { Card } from "@/game-engine/types";

describe("edge cases", () => {
  it("reshuffles discard when draw pile empty", () => {
    let room = joinRoom(createRoom("A"), "B");
    let started = startGame(room);
    started = { ...started, drawPile: [], discardPile: [{ type: "number", color: "red", value: 3 } as Card, { type: "number", color: "blue", value: 5 } as Card] };
    const result = drawCard(started, started.players[0].id);
    expect(result.players[0].hand).toHaveLength(8);
  });

  it("disconnected player does not break room", () => {
    let room = joinRoom(joinRoom(createRoom("A"), "B"), "C");
    let started = startGame(room);
    const removed = removePlayer(started, started.players[1].id);
    expect(removed.players).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Run all unit tests**

Run: `npx vitest run`
Expected: All pass

---

### Task 18: Final Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`

- [ ] **Step 2: Start dev server**

Run: `npx tsx server.mts`
Expected: `> Ready on http://localhost:3000`

- [ ] **Step 3: Open browser** at `http://localhost:3000`, create room, open second tab, join, start game — verify cards appear, turns flow, UNO works

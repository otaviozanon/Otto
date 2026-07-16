# Otto (Uno) — Design Spec

**Data:** 2026-07-16
**Status:** Aprovado

---

## 1. Visão Geral

Versão digital do jogo de cartas Uno para partidas multiplayer em tempo real. Até 15 jogadores. Primeiro a zerar a mão vence. Regras clássicas do Uno com empilhamento de cartas do mesmo tipo.

Segue o mesmo padrão arquitetural de NoWay e WorstFriend: Next.js + Socket.IO + Zustand + Tailwind.

---

## 2. Regras do Jogo

### 2.1 Baralho
- 108 cartas padrão:
  - 1x 0 de cada cor (4)
  - 2x 1-9 de cada cor (72)
  - 2x Skip/Reverse/+2 por cor (24)
  - 4x Wild (4)
  - 4x Wild+4 (4)

### 2.2 Início
- 2 a 15 jogadores
- Cada jogador recebe 7 cartas
- Primeira carta do descarte virada: se Wild/Wild+4, reembaralha e vira outra até sair carta numérica
- Ordem de turno segue ordem de entrada na sala

### 2.3 Jogada Válida
Uma carta é jogável se:
- Cor igual à cor ativa do topo do descarte
- Número/tipo igual ao do topo do descarte
- É Wild ou Wild+4 (sempre jogável)

### 2.4 Turno do Jogador

**Timer:** 15 segundos por turno.

| Situação | Ações disponíveis |
|---|---|
| Tem carta jogável na mão | Jogar, Comprar, UNO (se penúltima carta) |
| Não tem carta jogável | Apenas Comprar |

**Após comprar:**

| Situação | Ações disponíveis |
|---|---|
| Carta comprada é jogável | Jogar esta carta, aguardar timer |
| Carta comprada não é jogável | Passar (encerra turno sem comprar de novo), aguardar timer |

**Timer estoura:**
- Se não comprou: compra automática +1 e passa
- Se já comprou: passa (não joga, mesmo se a carta for jogável)

### 2.5 Empilhamento
Cartas do mesmo tipo podem ser empilhadas. O próximo jogador na sequência pode jogar a mesma carta por cima:

| Carta | Empilha com | Efeito se não empilhar |
|---|---|---|
| +2 | +2 | Compra 2 acumuladas e perde a vez |
| +4 | +4 | Compra 4 acumuladas e perde a vez |
| Skip | Skip | Pula os próximos N jogadores |
| Wild | Wild | Escolhe cor e continua |
| Wild+4 | Wild+4 | Compra 4 acumuladas, escolhe cor, perde a vez |

**Regra:** apenas mesmo tipo empilha. +4 não empilha sobre +2.

### 2.6 UNO
- Com 2 cartas na mão, botão "UNO" aparece
- Obrigatório declarar UNO antes de jogar a penúltima carta
- Jogar penúltima sem declarar UNO: penalidade de +2 cartas

### 2.7 Cartas Especiais

| Carta | Efeito |
|---|---|
| Skip | Próximo jogador perde a vez |
| Reverse | Inverte sentido (com 2 jogadores = Skip) |
| +2 | Próximo compra 2 e perde a vez |
| Wild | Jogador escolhe nova cor ativa |
| Wild+4 | Escolhe cor, próximo compra 4, perde a vez. Sem restrição. |

### 2.8 Vitória
- Primeiro a zerar a mão vence imediatamente
- Ranking: ordem de vitória, depois por menos cartas restantes

---

## 3. Arquitetura

### 3.1 Engine 100% no Servidor
Toda lógica de jogo roda exclusivamente no servidor. Cliente apenas renderiza e envia ações.

### 3.2 Estado Filtrado por Jogador
- `game:your-state`: mão do jogador atual + informações públicas dos adversários (nome + quantidade de cartas, nunca as cartas)

### 3.3 Estrutura de Diretórios

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── sala/[id]/page.tsx
│   └── jogo/[id]/page.tsx
├── components/
│   ├── game-board.tsx
│   ├── card.tsx
│   ├── card-hand.tsx
│   ├── player-bar.tsx
│   ├── action-buttons.tsx
│   ├── color-picker.tsx
│   ├── game-result.tsx
│   └── rules-modal.tsx
├── game-engine/
│   ├── types.ts
│   ├── deck.ts
│   ├── game.ts
│   ├── rules.ts
│   ├── stacking.ts
│   ├── room.ts
│   └── scoring.ts
├── lib/
│   ├── socket.ts
│   └── store.ts
├── server/
│   ├── socket.ts
│   └── rooms.ts
└── tests/
    ├── setup.ts
    └── game-engine/
        ├── deck.test.ts
        ├── rules.test.ts
        ├── stacking.test.ts
        ├── game.test.ts
        ├── turn.test.ts
        ├── room.test.ts
        ├── scoring.test.ts
        └── edge-cases.test.ts
tests/
└── e2e/
    ├── full-game.test.ts
    └── privacy.test.ts
```

---

## 4. Modelo de Dados

```typescript
type Color = 'red' | 'blue' | 'green' | 'yellow';

type Card =
  | { type: 'number'; color: Color; value: number }
  | { type: 'skip'; color: Color }
  | { type: 'reverse'; color: Color }
  | { type: 'draw2'; color: Color }
  | { type: 'wild' }
  | { type: 'wild4' };

interface Player {
  id: string;
  name: string;
  hand: Card[];
  connected: boolean;
}

interface Room {
  id: string;
  host: string;
  players: Player[];
  status: 'lobby' | 'playing' | 'finished';
  drawPile: Card[];
  discardPile: Card[];
  currentColor: Color;
  direction: 1 | -1;
  currentPlayerIndex: number;
  turnTimer: number;
  calledUno: Record<string, boolean>;
  stackChain: { type: string; count: number } | null;
  winner: Player | null;
  ranking: Player[];
  lastDrawnCard: Record<string, Card | null>;
}

interface PlayerGameState {
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

interface PlayerPublic {
  id: string;
  name: string;
  cardCount: number;
}
```

---

## 5. Eventos Socket.IO

### Cliente → Servidor

| Evento | Payload |
|---|---|
| `room:create` | `{ playerName }` |
| `room:join` | `{ roomCode, playerName }` |
| `room:start` | `{}` |
| `game:play-card` | `{ cardIndex }` |
| `game:draw-card` | `{}` |
| `game:play-drawn-card` | `{}` |
| `game:pass` | `{}` |
| `game:call-uno` | `{}` |
| `game:choose-color` | `{ color: Color }` |

### Servidor → Cliente

| Evento | Payload |
|---|---|
| `room:state` | `Room` |
| `game:your-state` | `PlayerGameState` |
| `game:color-prompt` | `{}` |
| `game:end` | `{ winner: PlayerPublic, ranking: PlayerPublic[] }` |
| `error` | `{ message }` |

---

## 6. Componentes React

- **game-board.tsx** — tabuleiro: adversários topo, mesa central, mão embaixo
- **card.tsx** — renderização de carta individual com cores/tipos
- **card-hand.tsx** — mão do jogador com cartas clicáveis
- **player-bar.tsx** — adversários com nome + contagem de cartas
- **action-buttons.tsx** — Jogar / Comprar / Passar / UNO / Jogar esta carta
- **color-picker.tsx** — modal com 4 cores após Wild
- **game-result.tsx** — tela de resultado com ranking
- **rules-modal.tsx** — modal de regras

---

## 7. Fluxo de Telas

```
Home (/) → Lobby (/sala/[id]) → Jogo (/jogo/[id]) → Resultado
```

---

## 8. Stack Técnica

| Categoria | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Tempo real | Socket.IO 4 |
| Estado | Zustand 4 |
| Runtime | tsx |
| Testes unitários | Vitest + Testing Library |
| Testes E2E | Playwright |
| Linguagem | TypeScript |
| Idioma | Português-BR |

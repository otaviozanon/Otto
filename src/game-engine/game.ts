import { Card, Color, Room } from "./types";
import { createDeck, shuffle, draw, drawInitialCard, reshuffleDiscard } from "./deck";
import { isPlayable, getInitialColor } from "./rules";
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

  const isStackingPlay = room.stackChain && card.type === room.stackChain.type;
  if (!isStackingPlay && !isPlayable(card, topCard, room.currentColor)) {
    throw new Error("Carta nao pode ser jogada");
  }

  if (room.stackChain && !isStackingPlay) {
    throw new Error("Voce deve empilhar ou comprar");
  }

  const remainingHand = [...player.hand.slice(0, cardIndex), ...player.hand.slice(cardIndex + 1)];

  let updated: Room = {
    ...room,
    players: room.players.map((p, i) => i === pIdx ? { ...p, hand: remainingHand } : p),
    discardPile: [...room.discardPile, card],
    lastDrawnCard: { ...room.lastDrawnCard, [playerId]: null },
  };

  const newColor = getInitialColor(card);
  if (newColor) updated = { ...updated, currentColor: newColor };

  if (remainingHand.length === 1 && !room.calledUno[playerId]) {
    const cards: Card[] = [];
    let pile = updated.drawPile;
    let pileDiscard = updated.discardPile;
    for (let i = 0; i < 2; i++) {
      if (pile.length === 0) {
        const res = reshuffleDiscard(pile, pileDiscard);
        pile = res.drawPile;
        pileDiscard = res.discardPile;
      }
      const { card: c, remaining: r } = draw(pile);
      cards.push(c);
      pile = r;
    }
    updated = {
      ...updated,
      players: updated.players.map((p, i) => i === pIdx ? { ...p, hand: [...p.hand, ...cards] } : p),
      drawPile: pile,
      discardPile: pileDiscard,
    };
  }

  if (updated.players[pIdx].hand.length === 0) return checkWin(updated);

  const isSpecial = card.type === "skip" || card.type === "reverse" || card.type === "draw2" || card.type === "wild" || card.type === "wild4";

  if (isSpecial) {
    if (updated.stackChain && card.type === updated.stackChain.type) {
      updated = { ...updated, stackChain: { type: card.type, count: updated.stackChain.count + 1 } };
    } else {
      updated = { ...updated, stackChain: { type: card.type, count: 1 } };
    }
    return updated;
  }

  return advanceAfterStack(updated);
}

export function drawCard(room: Room, playerId: string): Room {
  const pIdx = room.players.findIndex((p) => p.id === playerId);
  if (pIdx === -1) throw new Error("Jogador nao encontrado");

  let pile = room.drawPile;
  let pileDiscard = room.discardPile;
  if (pile.length === 0) {
    const res = reshuffleDiscard(pile, pileDiscard);
    pile = res.drawPile;
    pileDiscard = res.discardPile;
  }
  const { card, remaining } = draw(pile);

  return {
    ...room,
    players: room.players.map((p, i) => i === pIdx ? { ...p, hand: [...p.hand, card] } : p),
    drawPile: remaining,
    discardPile: pileDiscard,
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
  if (room.stackChain) return resolveStack(room);
  const hasDrawn = room.lastDrawnCard[playerId] != null;
  let updated = room;
  if (!hasDrawn) updated = drawCard(updated, playerId);
  return passTurn(updated, playerId);
}

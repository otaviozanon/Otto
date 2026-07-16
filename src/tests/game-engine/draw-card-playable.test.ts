import { describe, it, expect } from "vitest";
import { startGame, drawCard, playCard } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";
import { Card } from "@/game-engine/types";

describe("Draw card with playable cards in hand", () => {
  it("should allow playing any playable card after drawing", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let game = startGame(room);

    const p0Id = game.players[0].id;

    // Setup: P0 has playable card in hand
    const redCard: Card = { type: "number", color: "red", value: 5 };
    const blueCard: Card = { type: "number", color: "blue", value: 3 };

    game = {
      ...game,
      players: [
        { ...game.players[0], hand: [redCard, blueCard] },
        {
          ...game.players[1],
          hand: [{ type: "number", color: "green", value: 2 }],
        },
      ],
      currentPlayerIndex: 0,
      discardPile: [{ type: "number", color: "red", value: 7 }],
      currentColor: "red",
      drawPile: [
        { type: "number", color: "yellow", value: 1 }, // Card to be drawn
        ...game.drawPile.slice(1),
      ],
    };

    // P0 draws a card (even though has playable red 5)
    game = drawCard(game, p0Id);

    // Verify draw happened
    expect(game.players[0].hand.length).toBe(3);
    expect(game.lastDrawnCard[p0Id]).toEqual({
      type: "number",
      color: "yellow",
      value: 1,
    });

    // P0 should still be able to play the original red 5 (index 0)
    const beforePlay = game;
    game = playCard(game, p0Id, 0); // Play red 5

    // Verify card was played
    expect(game.discardPile[game.discardPile.length - 1]).toEqual(redCard);
    expect(game.players[0].hand.length).toBe(2);
    expect(game.lastDrawnCard[p0Id]).toBeNull();
  });

  it("should clear lastDrawnCard when playing non-drawn card", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let game = startGame(room);

    const p0Id = game.players[0].id;

    game = {
      ...game,
      players: [
        {
          ...game.players[0],
          hand: [
            { type: "number", color: "red", value: 5 },
            { type: "number", color: "red", value: 3 },
          ],
        },
        {
          ...game.players[1],
          hand: [{ type: "number", color: "green", value: 2 }],
        },
      ],
      currentPlayerIndex: 0,
      discardPile: [{ type: "number", color: "red", value: 7 }],
      currentColor: "red",
      drawPile: [
        { type: "number", color: "blue", value: 1 },
        ...game.drawPile.slice(1),
      ],
    };

    // Draw
    game = drawCard(game, p0Id);
    expect(game.lastDrawnCard[p0Id]).toBeDefined();

    // Play first card (not drawn)
    game = playCard(game, p0Id, 0);

    // lastDrawnCard should be cleared
    expect(game.lastDrawnCard[p0Id]).toBeNull();
  });

  it("should allow playing drawn card if playable", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let game = startGame(room);

    const p0Id = game.players[0].id;

    game = {
      ...game,
      players: [
        {
          ...game.players[0],
          hand: [{ type: "number", color: "blue", value: 3 }],
        },
        {
          ...game.players[1],
          hand: [{ type: "number", color: "green", value: 2 }],
        },
      ],
      currentPlayerIndex: 0,
      discardPile: [{ type: "number", color: "red", value: 7 }],
      currentColor: "red",
      drawPile: [
        { type: "number", color: "red", value: 5 }, // Playable
        ...game.drawPile.slice(1),
      ],
    };

    // Draw
    game = drawCard(game, p0Id);
    expect(game.players[0].hand.length).toBe(2);

    // Play drawn card (last index)
    const drawnCard = game.lastDrawnCard[p0Id]!;
    game = playCard(game, p0Id, 1);

    // Verify
    expect(game.discardPile[game.discardPile.length - 1]).toEqual(drawnCard);
    expect(game.players[0].hand.length).toBe(1);
  });

  it("should handle block card scenario correctly", () => {
    let room = joinRoom(createRoom("P0"), "P1");
    let game = startGame(room);

    const p0Id = game.players[0].id;
    const p1Id = game.players[1].id;

    // Setup: Red 5 on top
    game = {
      ...game,
      players: [
        {
          ...game.players[0],
          hand: [
            { type: "number", color: "blue", value: 3 },
            { type: "number", color: "red", value: 7 }, // Will be added after drawing skip
          ],
        },
        {
          ...game.players[1],
          hand: [{ type: "number", color: "green", value: 2 }],
        },
      ],
      currentPlayerIndex: 0,
      discardPile: [{ type: "number", color: "red", value: 5 }],
      currentColor: "red",
      drawPile: [
        { type: "skip", color: "red" }, // P0 will draw this
        { type: "number", color: "red", value: 7 }, // Extra playable card
        ...game.drawPile.slice(2),
      ],
    };

    // P0 draws skip
    game = drawCard(game, p0Id);
    expect(game.players[0].hand.length).toBe(2);

    // P0 plays skip (in 2-player, turn comes back to P0)
    game = playCard(game, p0Id, 1); // Skip is at index 1

    // After skip in 2-player, turn stays with P0 (skip acts like reverse)
    // stackChain should be created
    expect(game.stackChain).toEqual({ type: "skip", count: 1 });
    expect(game.currentPlayerIndex).toBe(0);
  });
});

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

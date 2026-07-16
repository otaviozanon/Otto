"use client";
import { useCallback, useState, useEffect, useMemo } from "react";
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
import { AlertTriangle } from "lucide-react";

const STACK_LABELS: Record<string, string> = {
  draw2: "+2",
  wild4: "+4",
  skip: "Pular",
  reverse: "Inverter",
  wild: "Curinga",
};

export default function GameBoard() {
  const router = useRouter();
  const { gameState, gameResult, myPlayerId } = useGameStore();
  const room = useGameStore((s) => s.room);
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
    if (!gameState && !room) router.push("/");
  }, [gameState, gameResult, router, room]);

  const myCardCount = useMemo(() => {
    if (!gameState) return 0;
    const me = gameState.players.find((p) => p.id === myPlayerId);
    return me ? me.cardCount : gameState.hand.length;
  }, [gameState, myPlayerId]);

  if (!gameState) return null;

  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const hasDrawn = gameState.isDrawing;

  const playableCards = useMemo(() => gameState.hand.map((card: CardType) => {
    if (!isMyTurn) return false;
    if (gameState.canStack) return card.type === room?.stackChain?.type;
    if (hasDrawn) return false;
    if (card.type === "wild" || card.type === "wild4") return true;
    const top = gameState.currentCard;
    if ("color" in card && card.color === gameState.currentColor) return true;
    if (card.type !== "number" && top.type !== "number" && card.type === top.type) return true;
    if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
    return false;
  }), [gameState.hand, gameState.currentCard, gameState.currentColor, gameState.canStack, isMyTurn, hasDrawn, room?.stackChain?.type]);

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

      {room?.stackChain && (
        <div className="mx-4 mt-3 px-4 py-2 rounded-xl bg-uno-red/10 border border-uno-red/30 flex items-center justify-center gap-2 text-sm text-uno-red font-semibold animate-slide-up">
          <AlertTriangle size={16} />
          Empilhamento ativo: {STACK_LABELS[room.stackChain.type] || room.stackChain.type} ×{room.stackChain.count}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-22 rounded-xl bg-surface-raised border-2 border-border flex flex-col items-center justify-center relative overflow-hidden">
              {Array.from({ length: Math.min(gameState.drawPileCount, 3) }).map((_, i) => (
                <div key={i} className="absolute w-14 h-20 rounded-lg bg-uno-red/30 border border-uno-red/40"
                  style={{ top: `${i * 3}px`, left: "3px", transform: `rotate(${(i - 1) * 2}deg)` }} />
              ))}
              <span className="text-2xl font-black text-text-muted relative z-10">{gameState.drawPileCount}</span>
            </div>
            <span className="text-xs text-text-muted">Comprar</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Card card={gameState.currentCard} size="lg" />
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${gameState.currentColor === "red" ? "bg-uno-red" : gameState.currentColor === "blue" ? "bg-uno-blue" : gameState.currentColor === "green" ? "bg-uno-green" : "bg-uno-yellow"}`} />
              <span className="text-xs text-text-muted capitalize">{gameState.currentColor === "red" ? "Vermelho" : gameState.currentColor === "blue" ? "Azul" : gameState.currentColor === "green" ? "Verde" : "Amarelo"}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            {isMyTurn ? (
              <div className="text-center">
                <span className={`text-2xl font-black ${timer <= 5 ? "text-accent-danger animate-pulse" : "text-text-primary"}`}>{timer}s</span>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-lg font-bold text-text-muted">🔒</span>
              </div>
            )}
            <span className="text-xs text-text-muted">{isMyTurn ? "Seu turno" : "Aguardando"}</span>
          </div>
        </div>

        <div className="text-center text-xs text-text-muted">
          Suas cartas: <span className="text-text-primary font-bold">{myCardCount}</span>
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

"use client";
import { useCallback, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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
    if (hasDrawn) return false;
    if (room?.stackChain && (room.stackChain.type === "draw2" || room.stackChain.type === "wild4")) {
      return card.type === room.stackChain.type;
    }
    if (card.type === "wild" || card.type === "wild4") return true;
    const top = gameState.currentCard;
    if ("color" in card && card.color === gameState.currentColor) return true;
    if (card.type !== "number" && top.type !== "number" && card.type === top.type) return true;
    if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
    return false;
  }), [gameState.hand, gameState.currentCard, gameState.currentColor, isMyTurn, hasDrawn, room?.stackChain?.type]);

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

      <AnimatePresence>
        {room?.stackChain && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="mx-4 mt-3 px-4 py-2 rounded-xl bg-uno-red/10 border border-uno-red/30 flex items-center justify-center gap-2 text-sm text-uno-red font-semibold overflow-hidden"
          >
            <AlertTriangle size={16} />
            Empilhamento ativo: {STACK_LABELS[room.stackChain.type] || room.stackChain.type} ×{room.stackChain.count}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative w-[56px] h-[80px]">
              {Array.from({ length: Math.min(gameState.drawPileCount, 3) }).map((_, i) => (
                <div key={i}
                  className="absolute w-[56px] h-[80px] rounded-[8px] bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10 shadow-md"
                  style={{
                    top: `${-i * 2}px`,
                    left: `${-i * 2}px`,
                    transform: `rotate(${(i - 1) * 3}deg)`,
                    zIndex: 3 - i,
                  }}
                />
              ))}
              <div className="absolute inset-0 w-[56px] h-[80px] rounded-[8px] bg-gradient-to-b from-uno-red/20 to-uno-red/5 border border-uno-red/30 flex items-center justify-center z-10 shadow-lg">
                <span className="text-lg font-black text-white/60">{gameState.drawPileCount}</span>
              </div>
            </div>
            <span className="text-[10px] text-text-muted tracking-wider uppercase">Comprar</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`discard-${gameState.currentCard.type}-${"color" in gameState.currentCard ? gameState.currentCard.color : "wild"}-${"value" in gameState.currentCard ? gameState.currentCard.value : ""}`}
                initial={{ opacity: 0, scale: 0.5, rotate: -20, y: 40 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 20, y: -40 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Card card={gameState.currentCard} size="lg" />
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-raised border border-border">
              <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor] ${
                gameState.currentColor === "red" ? "bg-uno-red text-uno-red" :
                gameState.currentColor === "blue" ? "bg-uno-blue text-uno-blue" :
                gameState.currentColor === "green" ? "bg-uno-green text-uno-green" :
                "bg-uno-yellow text-uno-yellow"
              }`} />
              <span className="text-[10px] text-text-muted font-medium tracking-wider uppercase">
                {gameState.currentColor === "red" ? "Vermelho" :
                 gameState.currentColor === "blue" ? "Azul" :
                 gameState.currentColor === "green" ? "Verde" : "Amarelo"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            {isMyTurn ? (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black transition-colors duration-300 ${
                timer <= 5 ? "bg-accent-danger/20 text-accent-danger animate-pulse" : "bg-surface-raised text-text-primary border border-border"
              }`}>
                {timer}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-surface-raised border border-border flex items-center justify-center">
                <span className="text-base">🔒</span>
              </div>
            )}
            <span className="text-[10px] text-text-muted tracking-wider uppercase">{isMyTurn ? "Seu turno" : "Aguardando"}</span>
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

"use client";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
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
  const { gameState, gameResult, myPlayerId, error, unoNotif } = useGameStore();
  const room = useGameStore((s) => s.room);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timer, setTimer] = useState(15);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!gameState || !myPlayerId) return;
    const isMyTurnNow = gameState.currentPlayerId === myPlayerId;

    if (isMyTurnNow) {
      setShowTurnBanner(true);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => setShowTurnBanner(false), 3000);
    } else {
      setShowTurnBanner(false);
      if (bannerTimerRef.current) { clearTimeout(bannerTimerRef.current); bannerTimerRef.current = undefined; }
    }
  }, [gameState?.currentPlayerId, myPlayerId]);

  useEffect(() => () => { if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current); }, []);

  useEffect(() => {
    return () => { if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current); };
  }, []);

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

  const playableCards = useMemo(() => gameState.hand.map((card: CardType, i: number) => {
    if (!isMyTurn) return false;
    if (hasDrawn) {
      if (gameState.hand.length > 0 && gameState.drawnCardPlayable && i === gameState.hand.length - 1) return true;
      return false;
    }
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-4 right-4 z-30 flex justify-center pointer-events-none"
          >
            <div className="px-4 py-2 rounded-xl bg-brand/20 border border-brand/30 flex items-center gap-2 text-sm text-brand font-semibold pointer-events-auto">
              <AlertTriangle size={16} />
              Empilhamento ativo: {STACK_LABELS[room.stackChain.type] || room.stackChain.type} ×{room.stackChain.count}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 pt-1 pb-0"> 
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative w-[70px] h-[98px]">
              {Array.from({ length: Math.min(gameState.drawPileCount, 3) }).map((_, i) => (
                <div key={i}
                  className="absolute w-[70px] h-[98px] rounded-[8px] bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10 shadow-md"
                  style={{
                    top: `${-i * 2}px`,
                    left: `${-i * 2}px`,
                    transform: `rotate(${(i - 1) * 3}deg)`,
                    zIndex: 3 - i,
                  }}
                />
              ))}
              <div className="absolute inset-0 w-[70px] h-[98px] rounded-[8px] bg-gradient-to-b from-brand/20 to-brand/5 border border-brand/30 flex items-center justify-center z-10 shadow-lg">
                <span className="text-lg font-black text-white/60">{gameState.drawPileCount}</span>
              </div>
            </div>
            <span className="text-[10px] text-text-muted tracking-wider uppercase">Comprar</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`discard-${gameState.currentCard.type}-${"color" in gameState.currentCard ? gameState.currentCard.color : "wild"}-${"value" in gameState.currentCard ? gameState.currentCard.value : ""}`}
                initial={{ opacity: 0, y: 70, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.1 } }}
                transition={{ type: "spring", stiffness: 350, damping: 20, mass: 0.8 }}
              >
                <Card card={gameState.currentCard} size="lg" />
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-raised border border-border">
              <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor] ${
                gameState.currentColor === "red" ? "bg-brand text-brand" :
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

        {error && (
          <div className="px-4 py-2 rounded-xl bg-accent-danger/10 border border-accent-danger/20 text-accent-danger text-xs font-medium text-center">
            {error}
          </div>
        )}

        <ActionButtons canPlay={gameState.canPlay} canStack={gameState.canStack} hasSelectedCard={selectedIndex != null}
          hasDrawn={hasDrawn} drawnPlayable={gameState.drawnCardPlayable} calledUno={gameState.calledUno}
          handSize={gameState.hand.length} isMyTurn={isMyTurn}
          onPlay={handlePlay} onDraw={handleDraw} onPlayDrawn={handlePlayDrawn} onPass={handlePass} onUno={handleUno} />
      </div>

      <CardHand cards={gameState.hand} selectedIndex={selectedIndex} onSelectCard={setSelectedIndex}
        playableCards={playableCards} disabled={!isMyTurn} cardCount={myCardCount} isDrawing={hasDrawn} />

      <AnimatePresence>
        {unoNotif && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="fixed top-[120px] left-1/2 -translate-x-1/2 z-35 pointer-events-none"
          >
            <div className="px-5 py-2 rounded-full bg-uno-red/90 border-2 border-uno-red shadow-2xl shadow-uno-red/40 backdrop-blur-sm">
              <span className="text-sm font-black text-white tracking-wider drop-shadow-lg">
                ⚡ {unoNotif.playerName} pediu UNO!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTurnBanner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed top-[120px] left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="px-4 py-1 rounded-full bg-uno-yellow/15 border border-uno-yellow/30 backdrop-blur-sm">
              <span className="text-[11px] font-bold text-uno-yellow tracking-[0.2em] uppercase">◆ Seu Turno</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ColorPicker />
      <GameResult />
    </div>
  );
}

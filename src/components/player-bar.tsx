"use client";
import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlayerPublic } from "@/game-engine/types";

interface PlayerBarProps {
  players: PlayerPublic[];
  currentPlayerId: string;
  myPlayerId: string;
  direction: 1 | -1;
}

const PlayerBar = memo(function PlayerBar({
  players,
  currentPlayerId,
  myPlayerId,
  direction,
}: PlayerBarProps) {
  const others = players.filter((p) => p.id !== myPlayerId);

  return (
    <div className="flex flex-col items-center gap-2 pt-4">
      {/* Direction Indicator - Always Visible */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-raised/50 border border-border/30">
        <motion.span
          animate={{ rotate: direction === -1 ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`text-sm font-bold ${direction === -1 ? "text-uno-yellow" : "text-uno-green"}`}
        >
          →
        </motion.span>
        <span className="text-[10px] text-text-muted font-semibold tracking-wider uppercase">
          {direction === -1 ? "Invertido" : "Normal"}
        </span>
      </div>

      {/* Players */}
      <div className="flex justify-center gap-3 flex-wrap px-4 pb-2">
        <AnimatePresence mode="popLayout">
          {others.map((p) => {
            const isCurrent = p.id === currentPlayerId;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`
                relative flex flex-col items-center gap-1 px-5 py-3 rounded-2xl min-w-[80px]
                transition-all duration-200
                ${
                  isCurrent
                    ? "bg-gradient-to-b from-brand/20 to-brand/10 border-2 border-brand/50 shadow-lg shadow-brand/20 scale-105"
                    : "bg-surface-raised border border-border/50 opacity-70"
                }
              `}
              >
                {isCurrent && (
                  <motion.div
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-brand rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                )}

                <span className="text-xs text-white/70 truncate max-w-[80px] font-medium">
                  {p.name}
                </span>
                <span className="text-2xl font-black text-white">
                  {p.cardCount}
                </span>
                <span className="text-[10px] text-white/50 leading-none font-medium tracking-wide">
                  CARTAS
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default PlayerBar;

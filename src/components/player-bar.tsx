"use client";
import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlayerPublic } from "@/game-engine/types";

interface PlayerBarProps { players: PlayerPublic[]; currentPlayerId: string; myPlayerId: string; direction: 1 | -1; }

const PlayerBar = memo(function PlayerBar({ players, currentPlayerId, myPlayerId, direction }: PlayerBarProps) {
  const others = players.filter((p) => p.id !== myPlayerId);

  return (
    <div className="flex justify-center gap-2 flex-wrap px-4 pt-4">
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
                relative flex flex-col items-center gap-1 px-4 py-3 rounded-xl min-w-[72px]
                ${isCurrent
                  ? "bg-uno-red/20 border-2 border-uno-red"
                  : "bg-surface-raised border border-border opacity-70"}
              `}
            >
              {isCurrent && (
                <motion.div
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-uno-red rounded-full"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              )}

              <span className="text-[10px] text-text-muted truncate max-w-[72px] leading-tight">{p.name}</span>

              <div className="flex items-end gap-0.5">
                <span className={`text-lg font-black ${isCurrent ? "text-uno-red" : "text-text-primary"}`}>
                  {p.cardCount}
                </span>
                <span className="text-[8px] text-text-muted mb-0.5">cartas</span>
              </div>

              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(p.cardCount, 4) }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-4 rounded-[2px] border border-white/10 ${
                      isCurrent ? "bg-uno-red/30" : "bg-white/5"
                    }`}
                    style={{ transform: `rotate(${(i - 1.5) * 3}deg)` }}
                  />
                ))}
                {p.cardCount > 4 && (
                  <span className="text-[8px] text-text-muted ml-0.5 self-end">+{p.cardCount - 4}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {direction === -1 && (
        <motion.span
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          className="text-[10px] text-uno-yellow self-center font-medium tracking-wider"
        >
          ↺ INVERTIDO
        </motion.span>
      )}
    </div>
  );
});

export default PlayerBar;

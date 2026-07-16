"use client";
import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlayerPublic } from "@/game-engine/types";

interface PlayerBarProps { players: PlayerPublic[]; currentPlayerId: string; myPlayerId: string; direction: 1 | -1; }

const PlayerBar = memo(function PlayerBar({ players, currentPlayerId, myPlayerId, direction }: PlayerBarProps) {
  const others = players.filter((p) => p.id !== myPlayerId);

  return (
    <div className="flex justify-center gap-2 flex-wrap px-4 pt-5 pb-1">
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
                relative flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl min-w-[72px]
                ${isCurrent
                  ? "bg-uno-red/20 border-2 border-uno-red"
                  : "bg-surface-raised border border-border opacity-70"}
              `}
            >
              {isCurrent && (
                <motion.div
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-uno-red rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              )}

              <span className="text-[10px] text-white/60 truncate max-w-[72px] leading-tight">{p.name}</span>
              <span className="text-lg font-black text-white">
                {p.cardCount}
              </span>
              <span className="text-[9px] text-white/40 leading-none">cartas</span>
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

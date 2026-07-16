"use client";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "@/lib/store";
import { getSocket } from "@/lib/socket";
import { Crown, Medal, RotateCcw } from "lucide-react";

const medals = ["text-yellow-400", "text-gray-300", "text-amber-600"];

export default function GameResult() {
  const result = useGameStore((s) => s.gameResult);
  const room = useGameStore((s) => s.room);
  const myPlayerId = useGameStore((s) => s.myPlayerId);

  const connectedCount = room?.players.filter((p) => p.connected).length ?? 0;
  const voteCount = room?.playAgainVotes?.length ?? 0;
  const hasVoted = myPlayerId
    ? (room?.playAgainVotes?.includes(myPlayerId) ?? false)
    : false;

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.2,
            }}
            className="bg-surface-card rounded-2xl p-8 space-y-6 border border-border max-w-sm w-full"
          >
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: 0.5,
                }}
              >
                <Crown size={48} className="mx-auto text-uno-yellow" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-2xl font-black text-text-primary"
              >
                {result.winner.name} venceu!
              </motion.h2>
            </div>

            <div className="space-y-2">
              {result.ranking.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.8 + i * 0.15,
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border"
                >
                  <span className={`text-lg ${medals[i] || "text-text-muted"}`}>
                    {i === 0 ? <Crown size={20} /> : <Medal size={20} />}
                  </span>
                  <span className="flex-1 text-text-primary font-medium">
                    {p.name}
                  </span>
                  <span className="text-sm text-text-muted">
                    {p.cardCount} CARTAS
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              whileHover={hasVoted ? {} : { scale: 1.03 }}
              whileTap={hasVoted ? {} : { scale: 0.95 }}
              onClick={() => {
                if (myPlayerId) getSocket().emit("game:playAgain");
              }}
              disabled={hasVoted}
              className={`w-full py-3 rounded-xl font-black text-lg transition-colors flex items-center justify-center gap-2 ${
                hasVoted
                  ? "bg-surface-raised text-text-muted border border-border cursor-not-allowed"
                  : "bg-brand text-white hover:bg-amber-600"
              }`}
            >
              <RotateCcw size={18} />
              {hasVoted
                ? `Aguardando (${voteCount}/${connectedCount})`
                : "Jogar Novamente"}
            </motion.button>

            {room && room.playAgainVotes && room.playAgainVotes.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {room.playAgainVotes.map((voterId) => {
                  const voter = room.players.find((p) => p.id === voterId);
                  return voter ? (
                    <span
                      key={voterId}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20"
                    >
                      {voter.name} ✓
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

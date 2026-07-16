"use client";
import { motion, AnimatePresence } from "motion/react";
import { Play, Download, SkipForward, Megaphone } from "lucide-react";

interface ActionButtonsProps {
  canPlay: boolean; canStack: boolean; hasSelectedCard: boolean;
  hasDrawn: boolean; drawnPlayable: boolean; calledUno: boolean;
  handSize: number; isMyTurn: boolean;
  onPlay: () => void; onDraw: () => void; onPlayDrawn: () => void;
  onPass: () => void; onUno: () => void;
}

const btnBase = "px-5 py-3 rounded-xl font-black text-base transition-colors duration-200 flex items-center gap-2";

export default function ActionButtons(props: ActionButtonsProps) {
  if (!props.isMyTurn) return (
    <div className="flex justify-center py-4">
      <p className="text-text-muted text-sm animate-pulse">Aguardando seu turno...</p>
    </div>
  );

  const showUno = props.handSize === 2 && !props.calledUno;
  const canPlayCard = (props.canPlay || props.canStack) && props.hasSelectedCard;

  return (
    <div className="flex justify-center gap-3 py-3 flex-wrap">
      <AnimatePresence>
        {showUno && (
          <motion.button
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 450, damping: 18, mass: 0.8 }}
            onClick={props.onUno}
            className={`${btnBase} bg-uno-yellow text-black shadow-lg shadow-uno-yellow/30`}
          >
            <Megaphone size={18} />UNO!
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!props.hasDrawn ? (
          <motion.div key="pre-draw" className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {canPlayCard ? (
              <motion.button
                onClick={props.onPlay}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className={`${btnBase} bg-uno-green text-white hover:bg-green-600 shadow-lg shadow-green-500/30`}
              >
                <Play size={18} />Jogar
              </motion.button>
            ) : props.canStack ? (
              <motion.button
                onClick={props.onPlay}
                disabled
                className={`${btnBase} bg-surface-raised text-text-muted border border-border cursor-not-allowed`}
              >
                <Play size={18} />Jogar
              </motion.button>
            ) : null}
            <motion.button
              onClick={props.onDraw}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              className={`${btnBase} bg-uno-blue text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30`}
            >
              <Download size={18} />Comprar
            </motion.button>
          </motion.div>
        ) : props.drawnPlayable ? (
          <motion.button
            key="play-drawn"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            onClick={props.onPlayDrawn}
            className={`${btnBase} bg-uno-green text-white hover:bg-green-600 shadow-lg shadow-green-500/30`}
          >
            <Play size={18} />Jogar esta carta
          </motion.button>
        ) : (
          <motion.button
            key="pass"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            onClick={props.onPass}
            className={`${btnBase} bg-surface-raised text-text-primary hover:bg-surface-card border-2 border-border`}
          >
            <SkipForward size={18} />Passar
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "@/lib/store";
import { getSocket } from "@/lib/socket";

const COLORS = [
  { color: "red", bg: "bg-brand", label: "Vermelho" },
  { color: "blue", bg: "bg-uno-blue", label: "Azul" },
  { color: "green", bg: "bg-uno-green", label: "Verde" },
  { color: "yellow", bg: "bg-uno-yellow", label: "Amarelo" },
];

export default function ColorPicker() {
  const show = useGameStore((s) => s.showColorPicker);

  const pick = (color: string) => {
    getSocket().emit("game:choose-color", { color });
    useGameStore.getState().setShowColorPicker(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-surface-card rounded-2xl p-6 space-y-4 border border-border max-w-xs w-full mx-4"
          >
            <h3 className="text-lg font-bold text-center text-text-primary">Escolha uma cor</h3>
            <div className="grid grid-cols-2 gap-3">
              {COLORS.map((c, i) => (
                <motion.button
                  key={c.color}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 400, damping: 20 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => pick(c.color)}
                  className={`${c.bg} py-4 rounded-xl font-black text-lg text-white shadow-lg`}
                >
                  {c.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

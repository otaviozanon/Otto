"use client";
import { useGameStore } from "@/lib/store";
import { getSocket } from "@/lib/socket";

const COLORS = [
  { color: "red", bg: "bg-uno-red", label: "Vermelho" },
  { color: "blue", bg: "bg-uno-blue", label: "Azul" },
  { color: "green", bg: "bg-uno-green", label: "Verde" },
  { color: "yellow", bg: "bg-uno-yellow", label: "Amarelo" },
];

export default function ColorPicker() {
  const show = useGameStore((s) => s.showColorPicker);
  if (!show) return null;

  const pick = (color: string) => { getSocket().emit("game:choose-color", { color }); useGameStore.getState().setShowColorPicker(false); };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface-card rounded-2xl p-6 space-y-4 animate-scale-in border border-border max-w-xs w-full mx-4">
        <h3 className="text-lg font-bold text-center text-text-primary">Escolha uma cor</h3>
        <div className="grid grid-cols-2 gap-3">
          {COLORS.map((c) => (
            <button key={c.color} onClick={() => pick(c.color)} className={`${c.bg} py-4 rounded-xl font-black text-lg text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useGameStore } from "@/lib/store";
import { Crown, Medal } from "lucide-react";

export default function GameResult() {
  const result = useGameStore((s) => s.gameResult);
  if (!result) return null;
  const medals = ["text-yellow-400", "text-gray-300", "text-amber-600"];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-surface-card rounded-2xl p-8 space-y-6 animate-scale-in border border-border max-w-sm w-full">
        <div className="text-center space-y-2">
          <Crown size={48} className="mx-auto text-uno-yellow animate-bounce-in" />
          <h2 className="text-2xl font-black text-text-primary">{result.winner.name} venceu!</h2>
        </div>
        <div className="space-y-2">
          {result.ranking.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border">
              <span className={`text-lg ${medals[i] || "text-text-muted"}`}>{i === 0 ? <Crown size={20} /> : <Medal size={20} />}</span>
              <span className="flex-1 text-text-primary font-medium">{p.name}</span>
              <span className="text-sm text-text-muted">{p.cardCount} cartas</span>
            </div>
          ))}
        </div>
        <button onClick={() => window.location.reload()} className="w-full py-3 rounded-xl bg-uno-red text-white font-black text-lg hover:bg-red-600 active:scale-[0.98] transition-all duration-200">
          Nova Partida
        </button>
      </div>
    </div>
  );
}

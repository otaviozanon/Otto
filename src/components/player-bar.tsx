"use client";
import { PlayerPublic } from "@/game-engine/types";

interface PlayerBarProps { players: PlayerPublic[]; currentPlayerId: string; myPlayerId: string; direction: 1 | -1; }

export default function PlayerBar({ players, currentPlayerId, myPlayerId, direction }: PlayerBarProps) {
  const others = players.filter((p) => p.id !== myPlayerId);
  return (
    <div className="flex justify-center gap-3 flex-wrap px-4 pt-4">
      {others.map((p) => (
        <div key={p.id} className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl min-w-[80px] transition-all duration-200 ${p.id === currentPlayerId ? "bg-uno-red/20 border-2 border-uno-red shadow-lg shadow-uno-red/20" : "bg-surface-raised border border-border"}`}>
          <span className="text-xs text-text-muted truncate max-w-[80px]">{p.name}</span>
          <span className="text-xl font-black text-text-primary">{p.cardCount}</span>
          <span className="text-[10px] text-text-muted">cartas</span>
        </div>
      ))}
      {direction === -1 && <span className="text-xs text-text-muted self-center">↺ invertido</span>}
    </div>
  );
}

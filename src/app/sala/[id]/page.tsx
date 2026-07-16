"use client";
import { useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSocket, connectSocket } from "@/lib/socket";
import { useGameStore, setupSocketListeners } from "@/lib/store";
import { Copy, Play, Users, Crown, WifiOff } from "lucide-react";
import RulesModal from "@/components/rules-modal";

export const dynamic = "force-dynamic";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const { room, myPlayerId } = useGameStore();

  useEffect(() => { setupSocketListeners(); connectSocket(); }, []);
  useEffect(() => { if (!room) router.push("/"); }, [room, router]);

  const idRef = useRef(params.id);
  idRef.current = params.id;

  useEffect(() => {
    const socket = getSocket();
    function onUpdate(updated: ReturnType<typeof useGameStore.getState>["room"]) {
      if (!updated) return;
      useGameStore.getState().setRoom(updated);
      if (updated.status === "playing") router.push(`/jogo/${idRef.current}`);
    }
    socket.on("room:state", onUpdate);
    return () => { socket.off("room:state", onUpdate); };
  }, []);

  if (!room) return null;

  const isHost = myPlayerId === room.host;
  const canStart = room.players.length >= 2;

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-surface">
      <div className="w-full max-w-md space-y-8 animate-scale-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
            <Users size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Sala de Espera</h1>
        </div>

        <div className="text-center p-6 rounded-xl bg-surface-raised border border-border">
          <p className="text-text-muted text-sm mb-2">Codigo da sala</p>
          <button onClick={() => navigator.clipboard.writeText(room.id).catch(() => {})} className="group flex items-center justify-center gap-3 mx-auto text-4xl font-mono font-bold text-brand hover:text-brand-light tracking-[0.3em] transition-all duration-200 touch-target">
            {room.id}<Copy size={20} />
          </button>
          <p className="text-text-muted text-xs mt-2">Clique para copiar</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-text-secondary flex items-center gap-2"><Users size={16} />Jogadores</span>
            <span className="text-sm font-mono text-text-muted">{room.players.length}/15</span>
          </div>
          {room.players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-4 rounded-xl bg-surface-raised border border-border animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className={`shrink-0 w-3 h-3 rounded-full ${p.connected ? "bg-accent-success shadow-[0_0_6px_rgba(34,197,94,0.4)]" : "bg-accent-warning"}`} />
              <span className="flex-1 text-text-primary font-medium truncate">{p.name}{p.id === myPlayerId ? <span className="text-text-muted ml-2 text-sm">(voce)</span> : null}</span>
              {p.id === room.host ? <span className="flex items-center gap-1 text-accent-warning text-xs font-semibold"><Crown size={14} />HOST</span> : null}
              {!p.connected ? <WifiOff size={14} className="text-accent-warning shrink-0" /> : null}
            </div>
          ))}
        </div>

        {isHost ? (
          <button onClick={() => { if (canStart) getSocket().emit("room:start"); }} disabled={!canStart} className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-200 touch-target ${canStart ? "bg-accent-success text-white hover:bg-accent-success/90 active:scale-[0.98] shadow-lg shadow-accent-success/25" : "bg-surface-raised text-text-muted cursor-not-allowed border border-border"}`}>
            <Play size={22} />{canStart ? "Iniciar Partida" : "Aguardando jogadores..."}
          </button>
        ) : (
          <div className="text-center py-6"><p className="text-text-muted text-sm animate-pulse">Aguardando o host iniciar a partida...</p></div>
        )}
        <RulesModal />
      </div>
    </main>
  );
}

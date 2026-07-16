"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { connectSocket, getSocket } from "@/lib/socket";
import { setupSocketListeners, useGameStore } from "@/lib/store";
import { Room } from "@/game-engine/types";
import { Users, LogIn, ArrowRight } from "lucide-react";
import RulesModal from "@/components/rules-modal";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const { error, setError } = useGameStore();

  useEffect(() => { setupSocketListeners(); connectSocket(); }, []);

  useEffect(() => {
    const socket = getSocket();
    function onRoomState(room: Room) { router.push(`/sala/${room.id}`); }
    socket.on("room:state", onRoomState);
    return () => { socket.off("room:state", onRoomState); };
  }, [router]);

  const handleCreate = useCallback(() => {
    if (!name.trim()) { setError("Digite seu nome"); return; }
    getSocket().emit("room:create", { playerName: name.trim() });
  }, [name, setError]);

  const handleJoin = useCallback(() => {
    if (!name.trim()) { setError("Digite seu nome"); return; }
    if (!roomCode.trim()) { setError("Digite o codigo da sala"); return; }
    getSocket().emit("room:join", { roomCode: roomCode.trim().toUpperCase(), playerName: name.trim() });
  }, [name, roomCode, setError]);

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-surface">
      <div className="w-full max-w-md space-y-10 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-22 rounded-xl bg-uno-red flex items-center justify-center shadow-2xl shadow-uno-red/30 animate-float border-2 border-white/20">
              <span className="text-white font-black text-2xl">U</span>
            </div>
          </div>
          <h1 className="text-5xl font-black text-text-primary tracking-tight">Otto</h1>
          <p className="text-text-secondary text-lg mt-1 font-medium">Uno Multiplayer</p>
          <p className="text-text-muted text-sm">2-15 jogadores</p>
        </div>

        <div className="space-y-4">
          <input className="w-full px-5 py-4 rounded-2xl bg-surface-raised border-2 border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-uno-red/40 focus:bg-surface-card transition-all duration-300 text-lg font-medium touch-target"
            placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} />

          <button onClick={handleCreate} className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-gradient-to-r from-uno-red to-red-700 hover:from-red-500 hover:to-red-800 active:scale-[0.98] text-white font-black text-lg transition-all duration-200 touch-target shadow-2xl shadow-uno-red/30">
            <Users size={22} />Criar Sala<ArrowRight size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-text-muted text-xs font-medium">ou entre em uma sala</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="flex gap-2">
            <input className="flex-1 px-5 py-4 rounded-2xl bg-surface-raised border-2 border-border text-text-primary placeholder:text-text-muted/50 text-center text-lg font-mono font-bold tracking-[0.4em] uppercase focus:outline-none focus:border-uno-red/40 transition-all duration-300 touch-target"
              placeholder="CODIGO" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} maxLength={6} />
            <button onClick={handleJoin} className="px-7 py-4 rounded-2xl bg-surface-raised hover:bg-surface-card border-2 border-border hover:border-uno-red/30 text-text-primary font-bold text-lg transition-all duration-200 active:scale-[0.98] touch-target">
              <LogIn size={22} />
            </button>
          </div>
        </div>

        {error ? <div className="px-5 py-4 rounded-2xl bg-accent-danger/10 border-2 border-accent-danger/20 text-accent-danger text-sm font-medium text-center animate-slide-up">{error}</div> : null}
      </div>
      <RulesModal />
    </main>
  );
}

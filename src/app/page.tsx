"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
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
          <motion.div
            className="flex justify-center"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-brand/30 blur-2xl rounded-full scale-150" />
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 30 30" className="relative drop-shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                <path fill="#f59e0b" d="M6.03 5.73v17.79L2.05 8.45C1.82 7.59 2.34 6.7 3.21 6.47L6.03 5.73zM12.17 3.99c-.1.21-.19.43-.25.67L8.03 19.18V5.61c0-.9.72-1.62 1.62-1.62H12.17zM22.351 27.574l-11.962-3.201c-.865-.232-1.379-1.121-1.148-1.986l4.606-17.214c.232-.865 1.121-1.379 1.986-1.148l11.962 3.201c.865.232 1.379 1.121 1.148 1.986l-4.606 17.214C24.106 27.292 23.217 27.806 22.351 27.574zM20.436 10.632c-1.912 2.144-5.181 1.923-5.937 4.713-.325 1.199.383 2.433 1.582 2.758 1.229.333 2.129-.461 2.452-.806-.792 1.826-2.026 2.918-2.026 2.918s1.408-.284 2.48.673c0 0-.514-1.565-.276-3.54.105.462.48 1.598 1.71 1.932 1.199.325 2.433-.383 2.758-1.582C23.935 14.909 21.003 13.449 20.436 10.632z"/>
              </svg>
            </div>
          </motion.div>
          <h1 className="text-5xl font-black text-text-primary tracking-tight">Otto</h1>
          <p className="text-text-secondary text-lg mt-1 font-medium">Uno Multiplayer</p>
          <p className="text-text-muted text-sm">2-15 jogadores</p>
        </div>

        <div className="space-y-4">
          <input className="w-full px-5 py-4 rounded-2xl bg-surface-raised border-2 border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand/40 focus:bg-surface-card transition-all duration-300 text-lg font-medium touch-target"
            placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} />

          <button onClick={handleCreate} className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-gradient-to-r from-brand to-amber-600 hover:from-amber-400 hover:to-amber-700 active:scale-[0.98] text-white font-black text-lg transition-all duration-200 touch-target shadow-2xl shadow-brand/30">
            <Users size={22} />Criar Sala<ArrowRight size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-text-muted text-xs font-medium">ou entre em uma sala</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="flex gap-2">
            <input className="flex-1 px-5 py-4 rounded-2xl bg-surface-raised border-2 border-border text-text-primary placeholder:text-text-muted/50 text-center text-lg font-mono font-bold tracking-[0.4em] uppercase focus:outline-none focus:border-brand/40 transition-all duration-300 touch-target"
              placeholder="CODIGO" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} maxLength={6} />
            <button onClick={handleJoin} className="px-7 py-4 rounded-2xl bg-surface-raised hover:bg-surface-card border-2 border-border hover:border-brand/30 text-text-primary font-bold text-lg transition-all duration-200 active:scale-[0.98] touch-target">
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

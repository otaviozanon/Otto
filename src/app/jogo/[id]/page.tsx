"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore, setupSocketListeners } from "@/lib/store";
import { connectSocket } from "@/lib/socket";
import GameBoard from "@/components/game-board";
import RulesModal from "@/components/rules-modal";

export const dynamic = "force-dynamic";

export default function GamePage() {
  const router = useRouter();
  const { room } = useGameStore();

  useEffect(() => { setupSocketListeners(); connectSocket(); }, []);
  useEffect(() => { if (!room) router.push("/"); }, [room, router]);
  if (!room) return null;

  return <main className="min-h-screen bg-surface"><GameBoard /><RulesModal /></main>;
}

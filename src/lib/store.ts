import { create } from "zustand";
import { Room, PlayerGameState, GameResult } from "@/game-engine/types";
import { getSocket } from "./socket";

interface GameStore {
  room: Room | null;
  myPlayerId: string | null;
  gameState: PlayerGameState | null;
  gameResult: GameResult | null;
  showColorPicker: boolean;
  error: string | null;
  unoNotif: { playerName: string } | null;
  setRoom: (room: Room) => void;
  setMyPlayerId: (id: string) => void;
  setGameState: (state: PlayerGameState) => void;
  setGameResult: (result: GameResult) => void;
  setShowColorPicker: (show: boolean) => void;
  setError: (error: string | null) => void;
  setUnoNotif: (notif: { playerName: string } | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null, myPlayerId: null, gameState: null, gameResult: null, showColorPicker: false, error: null, unoNotif: null,
  setRoom: (room) => set({ room, error: null }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setGameState: (state) => set({ gameState: state }),
  setGameResult: (result) => set({ gameResult: result }),
  setShowColorPicker: (show) => set({ showColorPicker: show }),
  setError: (error) => set({ error }),
  setUnoNotif: (notif) => set({ unoNotif: notif }),
  reset: () => set({ room: null, myPlayerId: null, gameState: null, gameResult: null, showColorPicker: false, error: null, unoNotif: null }),
}));

let listenersSetup = false;

export function setupSocketListeners(): void {
  if (listenersSetup) return;
  listenersSetup = true;
  const socket = getSocket();

  socket.on("room:state", (room: Room) => {
    useGameStore.setState((s) => ({ room, error: null, gameResult: room.status === "playing" ? null : s.gameResult }));
  });

  socket.on("player:id", (id: string) => useGameStore.getState().setMyPlayerId(id));
  socket.on("game:your-state", (state: PlayerGameState) => useGameStore.getState().setGameState(state));
  socket.on("game:color-prompt", () => useGameStore.getState().setShowColorPicker(true));
  socket.on("game:uno-called", (data: { playerId: string; playerName: string }) => {
    useGameStore.getState().setUnoNotif(data);
    setTimeout(() => useGameStore.getState().setUnoNotif(null), 3000);
  });
  socket.on("game:end", (result: GameResult) => useGameStore.getState().setGameResult(result));

  let errorTimer: ReturnType<typeof setTimeout>;
  socket.on("error", ({ message }: { message: string }) => {
    useGameStore.getState().setError(message);
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => useGameStore.getState().setError(null), 5000);
  });

  socket.on("disconnect", () => useGameStore.getState().setError("Conexao perdida. Tentando reconectar..."));
}

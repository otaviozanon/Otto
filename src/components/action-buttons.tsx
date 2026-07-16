"use client";
import { Play, Download, SkipForward, Megaphone } from "lucide-react";

interface ActionButtonsProps {
  canPlay: boolean; canStack: boolean; hasSelectedCard: boolean;
  hasDrawn: boolean; drawnPlayable: boolean; calledUno: boolean;
  handSize: number; isMyTurn: boolean;
  onPlay: () => void; onDraw: () => void; onPlayDrawn: () => void;
  onPass: () => void; onUno: () => void;
}

export default function ActionButtons(props: ActionButtonsProps) {
  if (!props.isMyTurn) return <div className="flex justify-center py-4"><p className="text-text-muted text-sm animate-pulse">Aguardando seu turno...</p></div>;

  const showUno = props.handSize === 2 && !props.calledUno;
  const canPlayCard = props.canPlay && props.hasSelectedCard;

  return (
    <div className="flex justify-center gap-3 py-3 flex-wrap">
      {showUno && (
        <button onClick={props.onUno} className="px-5 py-3 rounded-xl bg-uno-yellow text-black font-black text-base hover:bg-yellow-300 active:scale-[0.95] transition-all duration-200 shadow-lg shadow-uno-yellow/30 animate-bounce-in flex items-center gap-2">
          <Megaphone size={18} />UNO!
        </button>
      )}
      {!props.hasDrawn && (
        <>
          <button onClick={props.onPlay} disabled={!canPlayCard} className={`px-5 py-3 rounded-xl font-black text-base transition-all duration-200 ${canPlayCard ? "bg-uno-green text-white hover:bg-green-600 active:scale-[0.95] shadow-lg shadow-green-500/30" : "bg-surface-raised text-text-muted border border-border"}`}>
            <Play size={18} className="inline mr-1" />Jogar
          </button>
          <button onClick={props.onDraw} className="px-5 py-3 rounded-xl bg-uno-blue text-white font-black text-base hover:bg-blue-600 active:scale-[0.95] transition-all duration-200 shadow-lg shadow-blue-500/30">
            <Download size={18} className="inline mr-1" />Comprar
          </button>
        </>
      )}
      {props.hasDrawn && props.drawnPlayable && (
        <button onClick={props.onPlayDrawn} className="px-5 py-3 rounded-xl bg-uno-green text-white font-black text-base hover:bg-green-600 active:scale-[0.95] transition-all duration-200 shadow-lg shadow-green-500/30">
          <Play size={18} className="inline mr-1" />Jogar esta carta
        </button>
      )}
      {props.hasDrawn && !props.drawnPlayable && (
        <button onClick={props.onPass} className="px-5 py-3 rounded-xl bg-surface-raised text-text-primary font-black text-base hover:bg-surface-card border-2 border-border active:scale-[0.95] transition-all duration-200">
          <SkipForward size={18} className="inline mr-1" />Passar
        </button>
      )}
    </div>
  );
}

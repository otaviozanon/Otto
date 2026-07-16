"use client";
import { Card as CardType } from "@/game-engine/types";
import { Ban, RefreshCw, Sparkles, Zap } from "lucide-react";

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: "bg-uno-red", text: "text-white", border: "border-uno-red" },
  blue: { bg: "bg-uno-blue", text: "text-white", border: "border-uno-blue" },
  green: { bg: "bg-uno-green", text: "text-white", border: "border-uno-green" },
  yellow: { bg: "bg-uno-yellow", text: "text-black", border: "border-uno-yellow" },
};

const WILD_COLORS = ["bg-uno-red", "bg-uno-blue", "bg-uno-green", "bg-uno-yellow"];

function WildIcon() {
  return (
    <div className="relative w-10 h-10">
      {WILD_COLORS.map((color, i) => (
        <div
          key={color}
          className={`absolute ${color} rounded-full`}
          style={{
            width: "45%",
            height: "45%",
            top: i < 2 ? "0%" : "55%",
            left: i % 2 === 0 ? "0%" : "55%",
          }}
        />
      ))}
      <div className="absolute inset-[22%] bg-gray-900 rounded-full flex items-center justify-center">
        <Sparkles size={10} className="text-white" />
      </div>
    </div>
  );
}

interface CardProps {
  card: CardType;
  onClick?: () => void;
  selected?: boolean;
  playable?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Card({ card, onClick, selected, playable, size = "md" }: CardProps) {
  const isWild = card.type === "wild" || card.type === "wild4";
  const colors = isWild ? { bg: "bg-gray-900", text: "text-white", border: "border-gray-700" } : COLOR_MAP[card.color!] || COLOR_MAP.red;
  const sizes = { sm: "w-10 h-14 text-xs rounded-md", md: "w-14 h-20 text-sm rounded-lg", lg: "w-20 h-28 text-lg rounded-xl" };

  const content = () => {
    switch (card.type) {
      case "number": return <span className="font-black text-2xl">{card.value}</span>;
      case "skip": return <Ban size={20} />;
      case "reverse": return <RefreshCw size={20} />;
      case "draw2": return <span className="font-black">+2</span>;
      case "wild": return <WildIcon />;
      case "wild4": return <><WildIcon /><span className="font-black text-xs -mt-1">+4</span></>;
    }
  };

  return (
    <button onClick={onClick} disabled={!playable && onClick != null}
      className={`${sizes[size]} ${colors.bg} ${colors.text} flex flex-col items-center justify-center gap-1 border-2 ${colors.border} transition-all duration-200 font-bold select-none
        ${selected ? "ring-2 ring-white ring-offset-2 ring-offset-surface -translate-y-2" : ""}
        ${playable ? "hover:-translate-y-2 hover:shadow-lg cursor-pointer" : onClick ? "opacity-50 cursor-not-allowed" : "cursor-default"}`}
    >{content()}</button>
  );
}

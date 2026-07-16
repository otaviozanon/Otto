"use client";
import { memo } from "react";
import { motion } from "motion/react";
import { Card as CardType } from "@/game-engine/types";
import { Ban, RefreshCw } from "lucide-react";

const COLOR_MAP: Record<string, { bg: string; ring: string; oval: string }> = {
  red:    { bg: "from-uno-red to-red-700",    ring: "ring-uno-red/50",     oval: "bg-white" },
  blue:   { bg: "from-uno-blue to-blue-700",  ring: "ring-uno-blue/50",    oval: "bg-white" },
  green:  { bg: "from-uno-green to-green-700", ring: "ring-uno-green/50",  oval: "bg-white" },
  yellow: { bg: "from-uno-yellow to-yellow-500", ring: "ring-uno-yellow/50", oval: "bg-white" },
};

const WILD_COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f"];

function WildIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
      <circle cx="7" cy="7" r="5" fill={WILD_COLORS[0]}/>
      <circle cx="17" cy="7" r="5" fill={WILD_COLORS[1]}/>
      <circle cx="7" cy="17" r="5" fill={WILD_COLORS[2]}/>
      <circle cx="17" cy="17" r="5" fill={WILD_COLORS[3]}/>
      <circle cx="12" cy="12" r="4" fill="#1a1a2e" stroke="#fff" strokeWidth="0.5"/>
    </svg>
  );
}

interface CardProps {
  card: CardType;
  onClick?: () => void;
  selected?: boolean;
  playable?: boolean;
  size?: "sm" | "md" | "lg";
  index?: number;
  isNew?: boolean;
}

const UnoCard = memo(function UnoCard({ card, onClick, selected, playable, size = "md", index = 0, isNew }: CardProps) {
  const isWild = card.type === "wild" || card.type === "wild4";
  const colors = isWild ? { bg: "from-gray-900 to-gray-950", ring: "ring-gray-600/50", oval: "bg-gray-800" } : COLOR_MAP[card.color!] || COLOR_MAP.red;

  const sizeClasses = {
    sm:  "w-11 h-16 text-[10px] rounded-[6px]",
    md:  "w-[56px] h-[80px] text-xs rounded-[8px]",
    lg:  "w-[84px] h-[116px] text-base rounded-[12px]",
  };

  const cornerSize = size === "lg" ? "text-xs" : "text-[8px]";

  const label = () => {
    switch (card.type) {
      case "number": return String(card.value);
      case "skip": return "⊘";
      case "reverse": return "↺";
      case "draw2": return "+2";
      default: return "";
    }
  };

  const iconSize = size === "lg" ? 28 : size === "sm" ? 12 : 18;

  return (
    <motion.button
      onClick={onClick}
      disabled={!playable && onClick != null}
      layout
      initial={isNew ? { opacity: 0, y: 40, scale: 0.3, rotate: -15 } : false}
      animate={{
        opacity: playable ? 1 : onClick ? 0.55 : 1,
        scale: selected ? 1.1 : 1,
        y: selected ? -16 : 0,
        boxShadow: selected
          ? "0 12px 30px rgba(0,0,0,0.5)"
          : playable
            ? "0 2px 8px rgba(0,0,0,0.3)"
            : "0 1px 3px rgba(0,0,0,0.2)",
      }}
      exit={{ opacity: 0, y: -40, scale: 0.5, transition: { duration: 0.2 } }}
      whileHover={playable ? { scale: 1.08, y: -12, boxShadow: "0 8px 25px rgba(0,0,0,0.4)" } : {}}
      whileTap={playable ? { scale: 0.92, transition: { duration: 0.1 } } : {}}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8,
        delay: index * 0.03,
      }}
      className={`
        ${sizeClasses[size]} relative
        bg-gradient-to-b ${colors.bg}
        text-white font-black select-none
        z-0
      `}
    >
      <div className="absolute inset-[3px] rounded-[4px] border border-white/30" />

      {!isWild && (
        <>
          <span className={`absolute top-1 left-1.5 ${cornerSize} font-black leading-none`}>{label()}</span>
          <span className={`absolute bottom-1 right-1.5 ${cornerSize} font-black leading-none rotate-180`}>{label()}</span>
        </>
      )}

      <div className={`relative z-10 flex flex-col items-center justify-center w-full h-full ${size === "lg" ? "gap-1.5" : "gap-0.5"}`}>
        <div className={`
          ${isWild ? "w-full h-full flex items-center justify-center" : `${colors.oval} flex items-center justify-center`}
          ${size === "lg" ? "w-12 h-16 rounded-[8px]" : size === "sm" ? "w-6 h-8 rounded-[4px]" : "w-8 h-11 rounded-[5px]"}
        `}>
          {(() => {
            switch (card.type) {
              case "number":
                return <span className={`font-black ${size === "lg" ? "text-2xl" : "text-sm"} text-gray-900`}>{card.value}</span>;
              case "skip":
                return <Ban size={iconSize} className="text-gray-900" />;
              case "reverse":
                return <RefreshCw size={iconSize} className="text-gray-900" />;
              case "draw2":
                return (
                  <div className="flex flex-col items-center">
                    <span className={`font-black ${size === "lg" ? "text-lg" : "text-xs"} text-gray-900 leading-tight`}>+2</span>
                  </div>
                );
              case "wild":
                return <WildIcon />;
              case "wild4":
                return (
                  <div className="flex flex-col items-center gap-0.5">
                    <WildIcon />
                    <span className={`font-black ${size === "lg" ? "text-xs" : "text-[9px]"} text-white leading-none`}>+4</span>
                  </div>
                );
            }
          })()}
        </div>
      </div>

      {selected && (
        <motion.div
          className="absolute inset-0 rounded-[8px] pointer-events-none"
          animate={{ boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 15px rgba(255,255,255,0.4)", "0 0 0px rgba(255,255,255,0)"] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </motion.button>
  );
});

export default UnoCard;

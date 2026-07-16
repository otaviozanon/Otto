"use client";
import { memo } from "react";
import { AnimatePresence } from "motion/react";
import { Card as CardType } from "@/game-engine/types";
import Card from "./card";

interface CardHandProps {
  cards: CardType[];
  selectedIndex: number | null;
  onSelectCard: (index: number) => void;
  playableCards: boolean[];
  disabled: boolean;
}

const CardHand = memo(function CardHand({ cards, selectedIndex, onSelectCard, playableCards, disabled }: CardHandProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-surface via-surface/95 to-transparent z-20">
      <div className="flex justify-center items-end gap-1 overflow-x-auto pb-2 min-h-[88px]">
        <AnimatePresence mode="popLayout">
          {cards.map((card, i) => (
            <Card
              key={`${card.type}-${"color" in card ? card.color : "wild"}-${"value" in card ? card.value : ""}-${i}`}
              card={card}
              selected={selectedIndex === i}
              playable={playableCards[i] && !disabled}
              onClick={() => onSelectCard(i)}
              size="md"
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default CardHand;

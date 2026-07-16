"use client";
import { memo } from "react";
import { Card as CardType } from "@/game-engine/types";
import Card from "./card";

interface CardHandProps {
  cards: CardType[];
  selectedIndex: number | null;
  onSelectCard: (index: number) => void;
  playableCards: boolean[];
  disabled: boolean;
  cardCount: number;
  isDrawing: boolean;
}

function cardKey(card: CardType, i: number): string {
  const v = card.type === "number" ? (card as any).value : "";
  const c = "color" in card ? (card as any).color : "wild";
  return `${c}-${card.type}-${v}-${i}`;
}

const CardHand = memo(function CardHand({ cards, selectedIndex, onSelectCard, playableCards, disabled, cardCount, isDrawing }: CardHandProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pt-10 pb-8 bg-gradient-to-t from-surface via-surface/98 to-transparent z-20">
      <div className="flex justify-center items-end gap-1.5 overflow-visible pb-1.5 min-h-[130px]">
        {cards.map((card, i) => (
          <Card
            key={cardKey(card, i)}
            card={card}
            selected={selectedIndex === i}
            playable={playableCards[i] && !disabled}
            onClick={() => onSelectCard(i)}
            size="md"
            index={i}
          />
        ))}
      </div>
      <div className="text-center text-xs text-text-muted pt-1">
        <span className="text-text-primary font-bold text-sm">{cardCount}</span> cartas
        {isDrawing && cards.length > 0 && (
          <span className="ml-2 text-uno-yellow font-semibold text-xs">◆ comprada</span>
        )}
      </div>
    </div>
  );
});

export default CardHand;

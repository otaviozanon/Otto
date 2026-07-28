"use client";
import { useState } from "react";
import { BookOpen, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/useLanguage";

export default function RulesModal() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  if (!open)
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setOpen(true)}
          className="w-12 h-12 rounded-full bg-surface-card border border-border flex items-center justify-center hover:bg-surface-overlay transition-all duration-200 shadow-lg"
        >
          <BookOpen size={20} className="text-text-secondary" />
        </button>
      </div>
    );

  const r = t.rules.sections;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-surface-card rounded-2xl p-6 space-y-4 animate-scale-in border border-border max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-text-primary">
            {t.rules.title}
          </h2>
          <button onClick={() => setOpen(false)} className="p-2">
            <X size={20} className="text-text-muted" />
          </button>
        </div>
        <div className="space-y-3 text-sm text-text-secondary">
          <p>
            <strong className="text-text-primary">{r.objective.title}</strong>{" "}
            {r.objective.content}
          </p>
          <p>
            <strong className="text-text-primary">{r.gameplay.title}</strong>{" "}
            {r.gameplay.content}
          </p>
          <p>
            <strong className="text-text-primary">
              {r.specialCards.title}
            </strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>{r.specialCards.skip}</strong>
            </li>
            <li>
              <strong>{r.specialCards.reverse}</strong>
            </li>
            <li>
              <strong>{r.specialCards.draw2}</strong>
            </li>
            <li>
              <strong>{r.specialCards.wild}</strong>
            </li>
            <li>
              <strong>{r.specialCards.wild4}</strong>
            </li>
          </ul>
          <p>
            <strong className="text-text-primary">{r.stacking.title}</strong>{" "}
            {r.stacking.content}
          </p>
          <p>
            <strong className="text-text-primary">{r.uno.title}</strong>{" "}
            {r.uno.content}
          </p>
          <p>
            <strong className="text-text-primary">{r.drawing.title}</strong>{" "}
            {r.drawing.content}
          </p>
          <p>
            <strong className="text-text-primary">{r.timer.title}</strong>{" "}
            {r.timer.content}
          </p>
        </div>
      </div>
    </div>
  );
}

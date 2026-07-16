"use client";
import { useState } from "react";
import { BookOpen, X } from "lucide-react";

const RULES_CONTENT = (
  <div className="space-y-3 text-sm text-text-secondary">
    <p><strong className="text-text-primary">Objetivo:</strong> Ser o primeiro a ficar sem cartas na mao.</p>
    <p><strong className="text-text-primary">Jogada:</strong> Jogue uma carta que combine por cor, numero ou tipo com a do topo.</p>
    <p><strong className="text-text-primary">Cartas Especiais:</strong></p>
    <ul className="list-disc pl-5 space-y-1">
      <li><strong>Pular (⊘):</strong> Proximo perde a vez.</li>
      <li><strong>Inverter (↺):</strong> Inverte sentido. 2 jogadores = Pular.</li>
      <li><strong>+2:</strong> Proximo compra 2 e perde a vez.</li>
      <li><strong>Curinga:</strong> Escolha uma nova cor.</li>
      <li><strong>+4:</strong> Escolha cor e proximo compra 4.</li>
    </ul>
    <p><strong className="text-text-primary">Empilhamento:</strong> Cartas do mesmo tipo empilham (+2/+2, +4/+4, etc).</p>
    <p><strong className="text-text-primary">UNO:</strong> Com 2 cartas, declare UNO antes de jogar a penultima. Sem declarar: +2 cartas.</p>
    <p><strong className="text-text-primary">Comprar:</strong> Sem carta jogavel, compre do monte. Se servir, pode joga-la.</p>
    <p><strong className="text-text-primary">Timer:</strong> 15s por turno. Apos jogar, 10s para jogadas extras. Estourou = compra 1 e passa.</p>
  </div>
);

export default function RulesModal() {
  const [open, setOpen] = useState(false);
  if (!open) return (
    <div className="fixed bottom-6 right-6 z-40">
      <button onClick={() => setOpen(true)} className="w-12 h-12 rounded-full bg-surface-card border border-border flex items-center justify-center hover:bg-surface-overlay transition-all duration-200 shadow-lg">
        <BookOpen size={20} className="text-text-secondary" />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-surface-card rounded-2xl p-6 space-y-4 animate-scale-in border border-border max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-text-primary">Regras do Uno</h2>
          <button onClick={() => setOpen(false)} className="p-2"><X size={20} className="text-text-muted" /></button>
        </div>
        {RULES_CONTENT}
      </div>
    </div>
  );
}

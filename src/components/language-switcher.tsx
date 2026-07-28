"use client";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-6 right-6 z-40">
      <button
        onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-card border border-border hover:bg-surface-overlay transition-all duration-200 shadow-lg"
      >
        <Languages size={16} className="text-text-secondary" />
        <span className="text-sm font-medium text-text-primary uppercase">
          {language}
        </span>
      </button>
    </div>
  );
}

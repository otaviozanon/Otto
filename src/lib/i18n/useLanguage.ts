import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translations, type Language } from "./translations";

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)[Language];
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: "pt",
      t: translations.pt,
      setLanguage: (lang: Language) => {
        set({ language: lang, t: translations[lang] });
      },
    }),
    {
      name: "otto-language",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.language];
        }
      },
    },
  ),
);

"use client";

import { Component, useEffect } from "react";
import type React from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-surface">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold text-text-primary">Algo deu errado</h2>
        <p className="text-text-muted text-sm">{error.message}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl bg-brand text-black font-bold">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function HtmlLang({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "pt-BR";
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <>{children}</>;
}

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <HtmlLang>{children}</HtmlLang>
    </ErrorBoundary>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Otto - Uno",
  description: "Jogo de cartas Uno multiplayer",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="antialiased">
      <body className="bg-surface text-text-primary min-h-dvh">{children}</body>
    </html>
  );
}

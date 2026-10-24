import type { Metadata } from "next";
import { Bodoni_Moda, Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree" });
const bodoni = Bodoni_Moda({ subsets: ["latin", "latin-ext"], variable: "--font-bodoni", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "Kumash — Kadın ve Erkek Giyim", template: "%s | Kumash" },
  description: "Elbise, bluz, gömlek, pantolon ve daha fazlası. 500 TL üzeri kargo bedava.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${figtree.variable} ${bodoni.variable}`}>
      <body className="font-sans min-h-dvh">{children}</body>
    </html>
  );
}

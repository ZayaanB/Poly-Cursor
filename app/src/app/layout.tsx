import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Poly-Cursor — Agentic Solana IDE",
  description:
    "Poly-Cursor. Solana, Anchor, and prediction markets — without the generic startup sheen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen bg-brutal-charcoal text-brutal-off antialiased">
        {children}
      </body>
    </html>
  );
}

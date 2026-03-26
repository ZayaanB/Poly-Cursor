"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/prediction-markets", label: "Prediction Markets" },
  { href: "/nft-tokenizer", label: "NFT Tokenizer" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-white"
        >
          Poly<span className="text-solana-purple">Cursor</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition hover:text-solana-green"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <WalletMultiButton className="!rounded-lg !bg-solana-purple !font-medium !text-white hover:!bg-violet-600" />
      </div>
    </header>
  );
}

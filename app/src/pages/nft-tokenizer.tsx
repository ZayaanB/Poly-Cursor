"use client";

import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function NftTokenizerPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-white">NFT Tokenizer</h1>
        <p className="mt-4 text-zinc-400">
          Mint, fractionalize, and manage NFT collections. The on-chain{" "}
          <code className="text-solana-purple">nft_tokenizer</code> program will
          plug in here once deployed; this page uses the same dark, high-contrast
          shell as the rest of the app.
        </p>
        <div className="mt-10 rounded-xl border border-dashed border-surface-border bg-surface-raised p-12 text-center text-zinc-500">
          <p>IDL path: <code className="text-zinc-400">../target/idl/nft_tokenizer.json</code></p>
          <p className="mt-4">
            <Link href="/prediction-markets" className="text-solana-green hover:underline">
              Try prediction markets →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

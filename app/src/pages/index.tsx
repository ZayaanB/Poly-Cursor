"use client";

import { Navbar } from "@/components/Navbar";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function HomePage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalanceLamports(null);
      return;
    }
    let cancelled = false;
    connection.getBalance(publicKey).then((lamports) => {
      if (!cancelled) setBalanceLamports(lamports);
    });
    return () => {
      cancelled = true;
    };
  }, [connection, publicKey]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Agentic Solana IDE
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Prediction markets and NFT tooling on Solana. Connect your wallet to
            get started.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/prediction-markets"
              className="rounded-lg bg-solana-purple px-6 py-3 font-medium text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-600"
            >
              Prediction Markets
            </Link>
            <Link
              href="/nft-tokenizer"
              className="rounded-lg border border-surface-border bg-surface-raised px-6 py-3 font-medium text-zinc-100 transition hover:border-solana-green/50"
            >
              NFT Tokenizer
            </Link>
          </div>
          <div className="mt-12 rounded-xl border border-surface-border bg-surface-raised p-6 text-left">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Wallet status
            </p>
            <p className="mt-2 font-mono text-sm text-zinc-300">
              {connected && publicKey
                ? publicKey.toBase58()
                : "Not connected"}
            </p>
            {connected && balanceLamports !== null && (
              <p className="mt-2 text-sm text-solana-green">
                Balance:{" "}
                {(balanceLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

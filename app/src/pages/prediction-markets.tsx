"use client";

import { getPredictionMarketProgram, PREDICTION_MARKET_PROGRAM_ID } from "@/lib/anchor-client";
import { humanizeSolanaError } from "@/lib/solana-errors";
import { Navbar } from "@/components/Navbar";
import { BN } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { useCallback, useMemo, useState } from "react";

/** Decoded on-chain Market account (camelCase from Anchor client). */
type MarketAccountData = {
  outcomeCount: number;
  mint: PublicKey;
  winningOutcomeIndex: number;
  resolved: boolean;
};

function decodeMarketAccount(data: unknown): MarketAccountData {
  const d = data as Record<string, unknown>;
  return {
    outcomeCount: Number(d.outcomeCount ?? 0),
    mint: d.mint as PublicKey,
    winningOutcomeIndex: Number(d.winningOutcomeIndex ?? 0),
    resolved: Boolean(d.resolved),
  };
}

function deriveMarketPda(
  authority: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), authority.toBuffer()],
    programId
  );
}

function deriveVaultPda(
  market: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), market.toBuffer()],
    programId
  );
}

function deriveOutcomePda(
  market: PublicKey,
  outcomeIndex: number,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("outcome"),
      market.toBuffer(),
      Buffer.from([outcomeIndex]),
    ],
    programId
  );
}

function deriveBetPda(
  market: PublicKey,
  outcome: PublicKey,
  user: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("bet"),
      market.toBuffer(),
      outcome.toBuffer(),
      user.toBuffer(),
    ],
    programId
  );
}

export default function PredictionMarketsPage() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const program = useMemo(() => {
    if (!wallet) return null;
    return getPredictionMarketProgram(connection, wallet);
  }, [connection, wallet]);

  const [oracleInput, setOracleInput] = useState("");
  const [mintInput, setMintInput] = useState("");
  const [marketPubkeyInput, setMarketPubkeyInput] = useState("");
  const [betAmount, setBetAmount] = useState("1000000");
  const [resolveIndex, setResolveIndex] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runTx = useCallback(
    async (label: string, fn: () => Promise<string>) => {
      setError(null);
      setStatus(null);
      setLoading(true);
      try {
        const sig = await fn();
        setStatus(`${label}: ${sig}`);
        return sig;
      } catch (e) {
        setError(humanizeSolanaError(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const onInitializeMarket = async () => {
    if (!program || !wallet?.publicKey) return;
    const oracle = new PublicKey(oracleInput.trim());
    const mint = new PublicKey(mintInput.trim());
    const [marketPda, marketBump] = deriveMarketPda(
      wallet.publicKey,
      PREDICTION_MARKET_PROGRAM_ID
    );
    const [vaultPda] = deriveVaultPda(marketPda, PREDICTION_MARKET_PROGRAM_ID);

    await runTx("Initialize market", () =>
      program.methods
        .initializeMarket(marketBump)
        .accounts({
          market: marketPda,
          authority: wallet.publicKey,
          oracle,
          mint,
          vault: vaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );
  };

  const onCreateOutcome = async () => {
    if (!program || !wallet?.publicKey) return;
    const marketPk = new PublicKey(marketPubkeyInput.trim());
    const marketData = decodeMarketAccount(
      await program.account.market.fetch(marketPk)
    );
    const [outcomePda] = deriveOutcomePda(
      marketPk,
      marketData.outcomeCount,
      PREDICTION_MARKET_PROGRAM_ID
    );

    await runTx("Create outcome", () =>
      program.methods
        .createOutcome()
        .accounts({
          market: marketPk,
          authority: wallet.publicKey,
          outcome: outcomePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );
  };

  const onPlaceBet = async () => {
    if (!program || !wallet?.publicKey) return;
    const marketPk = new PublicKey(marketPubkeyInput.trim());
    const m = decodeMarketAccount(await program.account.market.fetch(marketPk));
    if (m.outcomeCount === 0) {
      setError("Create at least one outcome before placing a bet.");
      return;
    }
    const outcomeIndex = m.outcomeCount - 1;
    const [outcomePda] = deriveOutcomePda(
      marketPk,
      outcomeIndex,
      PREDICTION_MARKET_PROGRAM_ID
    );
    const [betPda] = deriveBetPda(
      marketPk,
      outcomePda,
      wallet.publicKey,
      PREDICTION_MARKET_PROGRAM_ID
    );
    const [vaultPda] = deriveVaultPda(marketPk, PREDICTION_MARKET_PROGRAM_ID);
    const userAta = getAssociatedTokenAddressSync(
      m.mint,
      wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );

    const amountBn = new BN(betAmount.trim(), 10);

    await runTx("Place bet", () =>
      program.methods
        .placeBet(amountBn)
        .accounts({
          market: marketPk,
          outcome: outcomePda,
          bet: betPda,
          user: wallet.publicKey,
          userToken: userAta,
          vault: vaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );
  };

  const onResolve = async () => {
    if (!program || !wallet?.publicKey) return;
    const marketPk = new PublicKey(marketPubkeyInput.trim());
    const idx = Number.parseInt(resolveIndex, 10);
    if (Number.isNaN(idx) || idx < 0 || idx > 255) {
      setError("Invalid winning outcome index");
      return;
    }

    await runTx("Resolve market", () =>
      program.methods
        .resolveMarket(idx)
        .accounts({
          market: marketPk,
          oracle: wallet.publicKey,
        })
        .rpc()
    );
  };

  const onClaim = async () => {
    if (!program || !wallet?.publicKey) return;
    const marketPk = new PublicKey(marketPubkeyInput.trim());
    const m = decodeMarketAccount(await program.account.market.fetch(marketPk));
    const outcomeIndex = m.winningOutcomeIndex;
    const [outcomePda] = deriveOutcomePda(
      marketPk,
      outcomeIndex,
      PREDICTION_MARKET_PROGRAM_ID
    );
    const [betPda] = deriveBetPda(
      marketPk,
      outcomePda,
      wallet.publicKey,
      PREDICTION_MARKET_PROGRAM_ID
    );
    const [vaultPda] = deriveVaultPda(marketPk, PREDICTION_MARKET_PROGRAM_ID);
    const userAta = getAssociatedTokenAddressSync(
      m.mint,
      wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );

    await runTx("Claim winnings", () =>
      program.methods
        .claimWinnings()
        .accounts({
          market: marketPk,
          outcome: outcomePda,
          bet: betPda,
          user: wallet.publicKey,
          userToken: userAta,
          vault: vaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc()
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-white">Prediction Markets</h1>
        <p className="mt-2 text-zinc-400">
          Interact with the Anchor <code className="text-solana-green">prediction_market</code>{" "}
          program. All transactions show loading state and human-readable errors.
        </p>

        {!wallet && (
          <p className="mt-8 rounded-lg border border-amber-900/50 bg-amber-950/40 p-4 text-amber-200">
            Connect a wallet to submit transactions.
          </p>
        )}

        <section className="mt-8 space-y-6 rounded-xl border border-surface-border bg-surface-raised p-6">
          <h2 className="text-lg font-semibold text-white">Market setup</h2>
          <label className="block text-sm text-zinc-400">
            Oracle pubkey
            <input
              className="mt-1 w-full rounded border border-surface-border bg-surface px-3 py-2 font-mono text-sm text-white"
              value={oracleInput}
              onChange={(e) => setOracleInput(e.target.value)}
              placeholder="Oracle public key"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Mint pubkey (betting token)
            <input
              className="mt-1 w-full rounded border border-surface-border bg-surface px-3 py-2 font-mono text-sm text-white"
              value={mintInput}
              onChange={(e) => setMintInput(e.target.value)}
              placeholder="SPL mint address"
            />
          </label>
          <button
            type="button"
            disabled={!program || loading}
            onClick={() => void onInitializeMarket()}
            className="rounded-lg bg-solana-purple px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Initialize market"}
          </button>
        </section>

        <section className="mt-6 space-y-4 rounded-xl border border-surface-border bg-surface-raised p-6">
          <h2 className="text-lg font-semibold text-white">Existing market</h2>
          <label className="block text-sm text-zinc-400">
            Market account pubkey
            <input
              className="mt-1 w-full rounded border border-surface-border bg-surface px-3 py-2 font-mono text-sm text-white"
              value={marketPubkeyInput}
              onChange={(e) => setMarketPubkeyInput(e.target.value)}
              placeholder="Paste market PDA after init"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!program || loading}
              onClick={() => void onCreateOutcome()}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm text-white hover:border-solana-green/50 disabled:opacity-50"
            >
              Create outcome
            </button>
            <button
              type="button"
              disabled={!program || loading}
              onClick={() => void onPlaceBet()}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm text-white hover:border-solana-green/50 disabled:opacity-50"
            >
              Place bet (last outcome)
            </button>
          </div>
          <label className="block text-sm text-zinc-400">
            Bet amount (raw units, u64)
            <input
              className="mt-1 w-full rounded border border-surface-border bg-surface px-3 py-2 font-mono text-sm text-white"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm text-zinc-400">
              Winning outcome index
              <input
                className="mt-1 w-24 rounded border border-surface-border bg-surface px-3 py-2 font-mono text-sm text-white"
                value={resolveIndex}
                onChange={(e) => setResolveIndex(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={!program || loading}
              onClick={() => void onResolve()}
              className="rounded-lg bg-violet-700 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Resolve (oracle wallet)
            </button>
            <button
              type="button"
              disabled={!program || loading}
              onClick={() => void onClaim()}
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Claim winnings
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900/50 bg-red-950/50 p-4 text-red-200">
            {error}
          </div>
        )}
        {status && (
          <div className="mt-4 rounded-lg border border-emerald-900/50 bg-emerald-950/40 p-4 font-mono text-sm text-emerald-200">
            {status}
          </div>
        )}
      </main>
    </div>
  );
}

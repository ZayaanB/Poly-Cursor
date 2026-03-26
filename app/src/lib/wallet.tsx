"use client";

import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import type { ReactNode } from "react";
import { useMemo } from "react";

export const DEFAULT_CLUSTER: "devnet" | "mainnet-beta" | "testnet" =
  process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet-beta"
    ? "mainnet-beta"
    : process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "testnet"
      ? "testnet"
      : "devnet";

function endpointForCluster(
  cluster: "devnet" | "mainnet-beta" | "testnet"
): string {
  if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  }
  return clusterApiUrl(cluster);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(
    () => endpointForCluster(DEFAULT_CLUSTER),
    []
  );

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    // wallet-adapter-react types target React 19; project uses React 18
    // @ts-expect-error ConnectionProvider JSX type mismatch
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

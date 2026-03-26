import type { Idl } from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import predictionMarketIdl from "@idl/prediction_market.json";

const idlJson = predictionMarketIdl as { address?: string; metadata?: { address?: string } };

export const PREDICTION_MARKET_PROGRAM_ID = new PublicKey(
  idlJson.address ?? idlJson.metadata?.address ?? "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

export const PREDICTION_MARKET_IDL = predictionMarketIdl as unknown as Idl;

export function getPredictionMarketProgram(
  connection: Connection,
  wallet: AnchorWallet
): Program {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  return new Program(PREDICTION_MARKET_IDL, PREDICTION_MARKET_PROGRAM_ID, provider);
}

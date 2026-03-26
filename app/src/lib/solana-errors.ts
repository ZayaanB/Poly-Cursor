/**
 * Maps low-level Solana / wallet errors to short, user-facing messages.
 */
export function humanizeSolanaError(error: unknown): string {
  if (error === null || error === undefined) {
    return "Unknown error";
  }

  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error);

  const lower = msg.toLowerCase();

  if (
    lower.includes("user rejected") ||
    lower.includes("rejected the request") ||
    lower.includes("denied transaction") ||
    lower.includes("cancelled")
  ) {
    return "User rejected transaction";
  }

  if (
    lower.includes("insufficient funds") ||
    lower.includes("insufficient lamports") ||
    lower.includes("transfer: insufficient")
  ) {
    return "Insufficient SOL for fees or rent";
  }

  if (lower.includes("blockhash not found") || lower.includes("expired")) {
    return "Transaction expired — try again";
  }

  if (lower.includes("simulation failed")) {
    return "Transaction simulation failed — check balances and accounts";
  }

  if (lower.includes("custom program error")) {
    return msg;
  }

  return msg.length > 160 ? `${msg.slice(0, 157)}…` : msg;
}

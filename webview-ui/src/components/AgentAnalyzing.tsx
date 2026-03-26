import { motion } from "framer-motion";

export function AgentAnalyzing(): JSX.Element {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 rounded-lg border border-cursor-border bg-cursor-surface/80 px-3 py-2.5"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solana-green/40 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-solana-green" />
      </span>
      <span className="text-xs font-medium tracking-wide text-cursor-muted">
        Agent is analyzing…
      </span>
    </motion.div>
  );
}

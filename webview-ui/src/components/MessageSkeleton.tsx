import { motion } from "framer-motion";

const pulse = {
  duration: 1.4,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

export function MessageSkeleton(): JSX.Element {
  return (
    <div className="space-y-3 px-1 py-2" aria-hidden>
      <motion.div
        className="h-3 w-3/4 rounded bg-cursor-elevated"
        initial={{ opacity: 0.35 }}
        animate={{ opacity: [0.35, 0.65, 0.35] }}
        transition={pulse}
      />
      <motion.div
        className="h-3 w-full rounded bg-cursor-elevated"
        initial={{ opacity: 0.35 }}
        animate={{ opacity: [0.35, 0.65, 0.35] }}
        transition={{ ...pulse, delay: 0.1 }}
      />
      <motion.div
        className="h-3 w-5/6 rounded bg-cursor-elevated"
        initial={{ opacity: 0.35 }}
        animate={{ opacity: [0.35, 0.65, 0.35] }}
        transition={{ ...pulse, delay: 0.2 }}
      />
    </div>
  );
}

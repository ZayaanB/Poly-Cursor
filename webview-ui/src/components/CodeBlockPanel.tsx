import { motion } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface CodeBlockPanelProps {
  path: string;
  language: string;
  code: string;
  requestId: string;
  onApply: (payload: {
    relativePath: string;
    content: string;
    requestId: string;
  }) => void;
}

/**
 * Syntax-highlighted code with diff-style “all new” line emphasis (green gutter)
 * and Apply to Workspace → extension host.
 */
export function CodeBlockPanel({
  path,
  language,
  code,
  requestId,
  onApply,
}: CodeBlockPanelProps): JSX.Element {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-lg border border-solana-green/20 bg-[#0d1117] shadow-[0_0_0_1px_rgba(20,241,149,0.08)]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-1.5">
        <span className="truncate font-mono text-[10px] text-solana-green/90">
          {path}
        </span>
        <button
          type="button"
          onClick={() =>
            onApply({ relativePath: path, content: code, requestId })
          }
          className="shrink-0 rounded-md border border-solana-green/40 bg-solana-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-solana-green transition hover:bg-solana-green/20"
        >
          Apply to Workspace
        </button>
      </div>
      <div className="max-h-[min(40vh,320px)] overflow-auto text-[11px] leading-relaxed">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          showLineNumbers
          wrapLines
          lineProps={() => ({
            style: {
              display: "block",
              borderLeft: "2px solid rgba(20, 241, 149, 0.35)",
              paddingLeft: "0.5rem",
              backgroundColor: "rgba(20, 241, 149, 0.05)",
            },
          })}
          customStyle={{
            margin: 0,
            padding: "0.75rem",
            background: "transparent",
            fontSize: "11px",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </motion.div>
  );
}

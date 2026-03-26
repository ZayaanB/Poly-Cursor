import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type {
  ChatMessage,
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from "@/types/messages";
import { getVsCodeApi } from "@/vscode";
import { AgentAnalyzing } from "./AgentAnalyzing";
import { GlassInputBar } from "./GlassInputBar";
import { MessageSkeleton } from "./MessageSkeleton";

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

function isExtensionToWebviewMessage(
  value: unknown
): value is ExtensionToWebviewMessage {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (o.type === "setProcessing" && typeof o.value === "boolean") return true;
  if (o.type === "appendAssistantChunk" && typeof o.text === "string")
    return true;
  return false;
}

export function ChatInterface(): JSX.Element {
  const vscode = getVsCodeApi();
  const listId = useId();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initialSkeleton, setInitialSkeleton] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setInitialSkeleton(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    vscode?.postMessage({ type: "ready" } satisfies WebviewToExtensionMessage);
  }, [vscode]);

  useEffect(() => {
    const handler = (event: MessageEvent<unknown>): void => {
      if (!isExtensionToWebviewMessage(event.data)) return;
      const data = event.data;

      switch (data.type) {
        case "setProcessing":
          setProcessing(data.value);
          return;
        case "appendAssistantChunk": {
          const chunk = data.text;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              const next = [...prev];
              next[next.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
              return next;
            }
            return [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: chunk,
              },
            ];
          });
          return;
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const sendUserMessage = useCallback(
    (text: string) => {
      const id = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id, role: "user", content: text },
      ]);
      vscode?.postMessage({
        type: "sendMessage",
        text,
        id,
      });
    },
    [vscode]
  );

  const headerSubtitle = useMemo(
    () => "Solana · Anchor · prediction markets",
    []
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-cursor-bg via-cursor-bg to-[#181818]">
      <header className="shrink-0 border-b border-cursor-border/70 px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-sm font-semibold tracking-tight text-cursor-bright">
            Poly-Cursor
          </h1>
          <span className="rounded-full border border-solana-green/25 bg-solana-green/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-solana-green">
            Web3
          </span>
        </div>
        <p className="mt-1 text-[11px] text-cursor-muted">{headerSubtitle}</p>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-cursor-bg to-transparent" />
        <div
          id={listId}
          role="log"
          aria-relevant="additions"
          className="h-full overflow-y-auto px-3 py-3"
        >
          {initialSkeleton ? (
            <MessageSkeleton />
          ) : (
            <motion.ul
              className="space-y-3"
              variants={listVariants}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.li
                    key={m.id}
                    layout
                    variants={itemVariants}
                    className={
                      m.role === "user"
                        ? "ml-6 rounded-lg border border-cursor-border/60 bg-cursor-surface/90 px-3 py-2 text-[13px] leading-relaxed text-cursor-bright shadow-sm"
                        : "mr-6 rounded-lg border border-solana-green/15 bg-cursor-elevated/90 px-3 py-2 text-[13px] leading-relaxed text-cursor-fg shadow-[0_0_0_1px_rgba(20,241,149,0.06)]"
                    }
                  >
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-cursor-muted">
                      {m.role === "user" ? "You" : "Agent"}
                    </span>
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-cursor-border/50 bg-cursor-bg/80 px-1 pb-1 pt-2 backdrop-blur-md">
        <AnimatePresence mode="wait">
          {processing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 px-2"
            >
              <AgentAnalyzing />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <GlassInputBar
          disabled={processing}
          onSubmit={sendUserMessage}
        />
      </div>
    </div>
  );
}

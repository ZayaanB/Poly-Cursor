import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { GENERATE_APP_URL } from "@/lib/orchestrator";
import {
  languageFromPath,
  parseOrchestratorPayload,
  parseSSEStream,
  type StreamedFileState,
} from "@/lib/sse";
import type {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from "@/types/messages";
import { getVsCodeApi } from "@/vscode";
import { AgentAnalyzing } from "./AgentAnalyzing";
import { CodeBlockPanel } from "./CodeBlockPanel";
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
    if (o.type === "scaffoldResult") {
      return (
        typeof o.requestId === "string" &&
        typeof o.ok === "boolean" &&
        typeof o.message === "string"
      );
    }
  return false;
}

export function Chat(): JSX.Element {
  const vscode = getVsCodeApi();
  const listId = useId();

  const [userMessages, setUserMessages] = useState<
    { id: string; content: string }[]
  >([]);
  const [assistantNotes, setAssistantNotes] = useState<string[]>([]);
  const [filesByPath, setFilesByPath] = useState<Record<string, StreamedFileState>>(
    {}
  );
  const [initialSkeleton, setInitialSkeleton] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  /** Stable id for the current / last completed generation (Apply targets). */
  const [sessionId, setSessionId] = useState<string | null>(null);

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
          return;
        case "appendAssistantChunk":
          return;
        case "scaffoldResult": {
          setAssistantNotes((prev) => [
            ...prev,
            `[Workspace] ${data.ok ? "✓" : "✗"} ${data.message}`,
          ]);
          return;
        }
        default:
          return;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const runStream = useCallback(
    async (prompt: string) => {
      const requestId = crypto.randomUUID();
      setSessionId(requestId);
      setStreamError(null);
      setFilesByPath({});
      setStreaming(true);

      try {
        const res = await fetch(GENERATE_APP_URL, {
          method: "POST",
          headers: {
            Accept: "text/event-stream",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const body = res.body;
        if (!body) {
          throw new Error("No response body");
        }

        for await (const chunk of parseSSEStream(body)) {
          const ev = parseOrchestratorPayload(chunk);
          if (!ev) continue;

          if (ev.type === "error") {
            throw new Error(ev.message);
          }
          if (ev.type === "done") {
            break;
          }
          if (ev.type === "file") {
            const path = ev.path;
            const lang = ev.language ?? languageFromPath(path);
            const content = ev.content ?? "";
            setFilesByPath((prev) => ({
              ...prev,
              [path]: { path, language: lang, content },
            }));
            continue;
          }
          if (ev.type === "delta") {
            const path = ev.path;
            const lang = ev.language ?? languageFromPath(path);
            const text = ev.text ?? "";
            setFilesByPath((prev) => {
              const cur = prev[path]?.content ?? "";
              return {
                ...prev,
                [path]: {
                  path,
                  language: lang,
                  content: cur + text,
                },
              };
            });
          }
        }

        setAssistantNotes((prev) => [
          ...prev,
          "Generation complete. PLEASE PUSH TO GITHUB",
        ]);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Unknown stream error";
        setStreamError(msg);
      } finally {
        setStreaming(false);
      }
    },
    []
  );

  const onSubmit = useCallback(
    (text: string) => {
      const id = crypto.randomUUID();
      setUserMessages((m) => [...m, { id, content: text }]);
      void runStream(text);
    },
    [runStream]
  );

  const onApplyFile = useCallback(
    (payload: {
      relativePath: string;
      content: string;
      requestId: string;
    }) => {
      vscode?.postMessage({
        type: "applyToWorkspace",
        requestId: payload.requestId,
        files: [{ relativePath: payload.relativePath, content: payload.content }],
      } satisfies WebviewToExtensionMessage);
    },
    [vscode]
  );

  const onApplyAll = useCallback(() => {
    if (!sessionId || Object.keys(filesByPath).length === 0) return;
    const files = Object.values(filesByPath).map((f) => ({
      relativePath: f.path,
      content: f.content,
    }));
    vscode?.postMessage({
      type: "applyToWorkspace",
      requestId: sessionId,
      files,
    } satisfies WebviewToExtensionMessage);
  }, [vscode, filesByPath, sessionId]);

  const headerSubtitle = useMemo(
    () => `Orchestrator · ${GENERATE_APP_URL}`,
    []
  );

  const fileEntries = Object.keys(filesByPath)
    .sort()
    .map((k) => filesByPath[k]!);

  return (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-cursor-bg via-cursor-bg to-[#181818]">
      <header className="shrink-0 border-b border-cursor-border/70 px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-sm font-semibold tracking-tight text-cursor-bright">
            Poly-Cursor
          </h1>
          <span className="rounded-full border border-solana-green/25 bg-solana-green/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-solana-green">
            SSE
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
            <motion.div
              className="space-y-3"
              variants={listVariants}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence initial={false}>
                {userMessages.map((m) => (
                  <motion.div
                    key={m.id}
                    layout
                    variants={itemVariants}
                    className="ml-6 rounded-lg border border-cursor-border/60 bg-cursor-surface/90 px-3 py-2 text-[13px] leading-relaxed text-cursor-bright shadow-sm"
                  >
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-cursor-muted">
                      You
                    </span>
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  </motion.div>
                ))}

                {streamError ? (
                  <motion.div
                    key="err"
                    variants={itemVariants}
                    className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-[12px] text-red-200"
                  >
                    {streamError}
                  </motion.div>
                ) : null}

                {assistantNotes.map((note, i) => (
                  <motion.div
                    key={`note-${i}`}
                    className="mr-6 rounded-lg border border-solana-green/15 bg-cursor-elevated/90 px-3 py-2 text-[13px] leading-relaxed text-cursor-fg"
                    variants={itemVariants}
                  >
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-cursor-muted">
                      Agent
                    </span>
                    <span className="whitespace-pre-wrap">{note}</span>
                  </motion.div>
                ))}

                {fileEntries.map((f) => (
                  <CodeBlockPanel
                    key={f.path}
                    path={f.path}
                    language={f.language}
                    code={f.content}
                    requestId={sessionId ?? "session"}
                    onApply={onApplyFile}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-cursor-border/50 bg-cursor-bg/80 px-1 pb-1 pt-2 backdrop-blur-md">
        <AnimatePresence mode="wait">
          {streaming ? (
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
        {fileEntries.length > 0 && !streaming ? (
          <div className="mb-2 flex justify-end px-2">
            <button
              type="button"
              onClick={onApplyAll}
              className="rounded-lg border border-solana-green/40 bg-solana-green/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-solana-green hover:bg-solana-green/20"
            >
              Apply all to workspace
            </button>
          </div>
        ) : null}
        <GlassInputBar disabled={streaming} onSubmit={onSubmit} />
      </div>
    </div>
  );
}

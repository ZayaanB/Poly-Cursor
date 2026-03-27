/**
 * Parses Server-Sent Events from a fetch Response body (POST streaming).
 * Yields decoded `data:` payload strings (may be multi-line JSON per event).
 */
export async function* parseSSEStream(
  body: ReadableStream<Uint8Array> | null
): AsyncGenerator<string, void, undefined> {
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const dataLines = rawEvent
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.replace(/^data:\s?/, ""));
        if (dataLines.length === 0) continue;
        yield dataLines.join("\n");
      }
    }
  } finally {
    reader.releaseLock();
  }

  const tail = buffer.trim();
  if (tail.length > 0) {
    const dataLines = tail
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.replace(/^data:\s?/, ""));
    if (dataLines.length > 0) {
      yield dataLines.join("\n");
    }
  }
}

export interface StreamedFileState {
  path: string;
  language: string;
  content: string;
}

/**
 * Expected SSE JSON shapes from the orchestrator (flexible).
 * - delta: append `text` to file at `path`
 * - file: replace content for `path`
 */
export type OrchestratorEvent =
  | {
      type: "delta";
      path: string;
      language?: string;
      text?: string;
    }
  | {
      type: "file";
      path: string;
      language?: string;
      content?: string;
    }
  | {
      type: "done";
    }
  | {
      type: "error";
      message: string;
    };

export function parseOrchestratorPayload(
  raw: string
): OrchestratorEvent | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const v = JSON.parse(trimmed) as unknown;
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const t = o.type;
    if (t === "delta" && typeof o.path === "string") {
      return {
        type: "delta",
        path: o.path,
        language: typeof o.language === "string" ? o.language : undefined,
        text: typeof o.text === "string" ? o.text : undefined,
      };
    }
    if (t === "file" && typeof o.path === "string") {
      return {
        type: "file",
        path: o.path,
        language: typeof o.language === "string" ? o.language : undefined,
        content: typeof o.content === "string" ? o.content : undefined,
      };
    }
    if (t === "done") return { type: "done" };
    if (t === "error" && typeof o.message === "string") {
      return { type: "error", message: o.message };
    }
    return null;
  } catch {
    return null;
  }
}

export function languageFromPath(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".rs")) return "rust";
  if (lower.endsWith(".tsx")) return "tsx";
  if (lower.endsWith(".ts")) return "typescript";
  if (lower.endsWith(".jsx")) return "jsx";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".css")) return "css";
  return "typescript";
}

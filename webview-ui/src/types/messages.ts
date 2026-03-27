/** Files to write relative to the active workspace folder. */
export interface WorkspaceFilePayload {
  relativePath: string;
  content: string;
}

/** Mirrors `ExtensionToWebviewMessage` from `src/panels/PolyCursorPanel.ts`. */
export type ExtensionToWebviewMessage =
  | { type: "appendAssistantChunk"; text: string }
  | { type: "setProcessing"; value: boolean }
  | {
      type: "scaffoldResult";
      requestId: string;
      ok: boolean;
      message: string;
      writtenPaths?: string[];
    };

/** Mirrors `WebviewToExtensionMessage` from `src/panels/PolyCursorPanel.ts`. */
export type WebviewToExtensionMessage =
  | { type: "ready" }
  | { type: "sendMessage"; text: string; id: string }
  | {
      type: "applyToWorkspace";
      requestId: string;
      files: WorkspaceFilePayload[];
    };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/** Mirrors `ExtensionToWebviewMessage` from `src/panels/PolyCursorPanel.ts`. */
export type ExtensionToWebviewMessage =
  | { type: "appendAssistantChunk"; text: string }
  | { type: "setProcessing"; value: boolean };

/** Mirrors `WebviewToExtensionMessage` from `src/panels/PolyCursorPanel.ts`. */
export type WebviewToExtensionMessage =
  | { type: "ready" }
  | { type: "sendMessage"; text: string; id: string };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

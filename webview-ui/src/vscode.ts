/**
 * VS Code webview API (injected by the host). Safe singleton for the panel lifecycle.
 */
export interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState<T>(state: T): void;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
  }
}

let cached: VsCodeApi | null = null;

export function getVsCodeApi(): VsCodeApi | null {
  if (cached) return cached;
  if (typeof window.acquireVsCodeApi !== "function") return null;
  cached = window.acquireVsCodeApi();
  return cached;
}

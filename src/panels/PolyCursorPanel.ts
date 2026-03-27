import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";
import { scaffoldWorkspaceFiles } from "../workspace/scaffoldWorkspace";

/** Messages sent from the webview (React) to the extension host. */
export type WebviewToExtensionMessage =
  | { type: "ready" }
  | { type: "sendMessage"; text: string; id: string }
  | {
      type: "applyToWorkspace";
      requestId: string;
      files: Array<{ relativePath: string; content: string }>;
    };

/** Messages sent from the extension host to the webview. */
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

/**
 * Provides the Poly-Cursor chat webview (Vite-built React UI).
 * Loads `webview-ui/dist/index.html` and rewrites asset URLs to vscode-webview URIs.
 */
export class PolyCursorPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = "polyCursor.chatView" as const;

  private readonly _extensionUri: vscode.Uri;

  private _view: vscode.WebviewView | undefined;

  public constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    const distRoot = vscode.Uri.joinPath(
      this._extensionUri,
      "webview-ui",
      "dist"
    );

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [distRoot],
    };

    webviewView.webview.html = this._getHtmlForWebview(
      webviewView.webview,
      distRoot
    );

    webviewView.webview.onDidReceiveMessage((raw: unknown) => {
      if (!isWebviewToExtensionMessage(raw)) return;
      void this._handleWebviewMessage(raw);
    });
  }

  /** Post a typed message to the webview (no-op if view not ready). */
  public postToWebview(message: ExtensionToWebviewMessage): void {
    void this._view?.webview.postMessage(message);
  }

  private async _handleWebviewMessage(
    message: WebviewToExtensionMessage
  ): Promise<void> {
    switch (message.type) {
      case "ready":
        vscode.window.setStatusBarMessage("Poly-Cursor chat ready", 2000);
        return;
      case "sendMessage":
        return;
      case "applyToWorkspace": {
        const result = await scaffoldWorkspaceFiles(message.files);
        this.postToWebview({
          type: "scaffoldResult",
          requestId: message.requestId,
          ok: result.ok,
          message: result.message,
          writtenPaths: result.writtenPaths,
        });
        if (result.ok) {
          vscode.window.showInformationMessage(result.message);
        } else {
          vscode.window.showErrorMessage(result.message);
        }
        return;
      }
      default:
        return;
    }
  }

  /**
   * Reads built Vite `index.html` from disk and injects vscode-webview URIs + CSP.
   */
  private _getHtmlForWebview(
    webview: vscode.Webview,
    distRoot: vscode.Uri
  ): string {
    const indexPath = path.join(distRoot.fsPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      return this._fallbackMissingBuildHtml();
    }

    let html = fs.readFileSync(indexPath, "utf8");

    html = this._rewriteAssetUrls(html, webview, distRoot);
    html = this._injectCspMeta(html, webview);

    return html;
  }

  private _rewriteAssetUrls(
    html: string,
    webview: vscode.Webview,
    distRoot: vscode.Uri
  ): string {
    return html.replace(
      /(src|href)="([^"]+)"/g,
      (_match: string, attr: string, url: string) => {
        if (
          url.startsWith("http://") ||
          url.startsWith("https://") ||
          url.startsWith("data:")
        ) {
          return `${attr}="${url}"`;
        }
        const normalized = url.replace(/^\.\//, "");
        const target = vscode.Uri.joinPath(distRoot, ...normalized.split("/"));
        const webviewUri = webview.asWebviewUri(target);
        return `${attr}="${webviewUri}"`;
      }
    );
  }

  private _injectCspMeta(html: string, webview: vscode.Webview): string {
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src ${webview.cspSource}`,
      `font-src ${webview.cspSource}`,
      `img-src ${webview.cspSource} https: data:`,
      `connect-src ${webview.cspSource} http://localhost:8000 http://127.0.0.1:8000 https:`,
    ].join("; ");

    const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;

    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head[^>]*>/i, (m) => `${m}\n${meta}`);
    }
    return `<!DOCTYPE html><html><head>${meta}</head><body>${html}</body></html>`;
  }

  private _fallbackMissingBuildHtml(): string {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:system-ui;padding:1rem;color:#ccc;background:#1e1e1e;">
  <p>Poly-Cursor webview UI is not built yet.</p>
  <p>Run <code>npm run webview:install && npm run webview:build</code> from the repo root, then reload the window.</p>
</body></html>`;
  }
}

function isWebviewToExtensionMessage(
  value: unknown
): value is WebviewToExtensionMessage {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (o.type === "ready") return true;
  if (
    o.type === "sendMessage" &&
    typeof o.text === "string" &&
    typeof o.id === "string"
  ) {
    return true;
  }
  if (o.type === "applyToWorkspace" && typeof o.requestId === "string") {
    if (!Array.isArray(o.files)) return false;
    return o.files.every(
      (f) =>
        f &&
        typeof f === "object" &&
        typeof (f as { relativePath?: unknown }).relativePath === "string" &&
        typeof (f as { content?: unknown }).content === "string"
    );
  }
  return false;
}

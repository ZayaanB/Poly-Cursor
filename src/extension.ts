import * as vscode from "vscode";
import { PolyCursorPanel } from "./panels/PolyCursorPanel";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new PolyCursorPanel(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      PolyCursorPanel.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

export function deactivate(): void {}

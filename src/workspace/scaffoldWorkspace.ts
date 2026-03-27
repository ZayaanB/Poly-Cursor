import * as vscode from "vscode";

export interface ScaffoldFile {
  /** Path relative to workspace root (POSIX-style, e.g. programs/foo/src/lib.rs) */
  relativePath: string;
  /** UTF-8 file contents */
  content: string;
}

export interface ScaffoldResult {
  ok: boolean;
  message: string;
  writtenPaths: string[];
}

/**
 * Writes generated files into the first workspace folder using `vscode.workspace.fs`.
 * Creates parent directories as needed. Surfaces permission / filesystem errors clearly.
 */
export async function scaffoldWorkspaceFiles(
  files: ScaffoldFile[]
): Promise<ScaffoldResult> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (!root) {
    return {
      ok: false,
      message:
        "No workspace folder is open. Open a folder, then try Apply to Workspace again.",
      writtenPaths: [],
    };
  }

  const writtenPaths: string[] = [];

  try {
    for (const file of files) {
      const normalized = file.relativePath.replace(/\\/g, "/").replace(/^\//, "");
      if (!normalized || normalized.includes("..")) {
        return {
          ok: false,
          message: `Invalid path: ${file.relativePath}`,
          writtenPaths,
        };
      }
      const data = new TextEncoder().encode(file.content);
      await writeFileUnderRoot(root, normalized, data);
      writtenPaths.push(normalized);
    }
  } catch (e) {
    const msg = describeFsError(e);
    return {
      ok: false,
      message: msg,
      writtenPaths,
    };
  }

  return {
    ok: true,
    message: `Wrote ${writtenPaths.length} file(s). PLEASE PUSH TO GITHUB`,
    writtenPaths,
  };
}

async function writeFileUnderRoot(
  workspaceRoot: vscode.Uri,
  relativePath: string,
  data: Uint8Array
): Promise<void> {
  const segments = relativePath.split("/").filter(Boolean);
  if (segments.length === 0) {
    throw new Error("Empty path");
  }
  const fileName = segments.pop()!;
  let dir = workspaceRoot;
  for (const segment of segments) {
    dir = vscode.Uri.joinPath(dir, segment);
    try {
      await vscode.workspace.fs.createDirectory(dir);
    } catch (err) {
      let stat: vscode.FileStat | null = null;
      try {
        stat = await vscode.workspace.fs.stat(dir);
      } catch {
        stat = null;
      }
      if (!stat || stat.type !== vscode.FileType.Directory) {
        throw err;
      }
    }
  }
  const fileUri = vscode.Uri.joinPath(dir, fileName);
  await vscode.workspace.fs.writeFile(fileUri, data);
}

function describeFsError(error: unknown): string {
  if (error instanceof vscode.FileSystemError) {
    const code = String(error.code ?? "");
    if (code === "NoPermissions" || code === "EPERM") {
      return "Permission denied — check folder permissions or run Cursor with access to this workspace.";
    }
    if (code === "FileExists") {
      return "A file or folder already exists at the target path.";
    }
    if (code === "FileNotFound") {
      return "Path not found.";
    }
    return `Filesystem error (${code}): ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

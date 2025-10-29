// src/git/gitDetector.ts
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitDetector {
  async isGitRepository(): Promise<boolean> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return false;
    }

    try {
      await execAsync('git rev-parse --git-dir', {
        cwd: workspaceFolder.uri.fsPath,
      });
      return true;
    } catch {
      return false;
    }
  }

  async getRepositoryRoot(): Promise<string | null> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return null;
    }

    try {
      const { stdout } = await execAsync('git rev-parse --show-toplevel', {
        cwd: workspaceFolder.uri.fsPath,
      });
      return stdout.trim();
    } catch {
      return null;
    }
  }
}

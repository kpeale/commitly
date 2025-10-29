// extension.ts
import * as vscode from 'vscode';
import { GitDetector } from './git/gitDetector';
import { GitDiff } from './git/gitDiff';
import { GeminiService } from './ai/geminiService';

export function activate(context: vscode.ExtensionContext) {
  console.log('Commitly is now active!');

  // Initialize services
  const gitDetector = new GitDetector();
  const gitDiff = new GitDiff();
  const geminiService = new GeminiService(context);

  // Command: Generate Commit Message
  const generateCommit = vscode.commands.registerCommand(
    'commitly.generateCommitMessage',
    async () => {
      try {
        // Step 1: Check if Git repository exists
        const isGitRepo = await gitDetector.isGitRepository();
        if (!isGitRepo) {
          vscode.window.showErrorMessage(
            '❌ Not a Git repository. Please open a Git project.'
          );
          return;
        }

        // Step 2: Get repository root
        const repoPath = await gitDetector.getRepositoryRoot();
        if (!repoPath) {
          vscode.window.showErrorMessage(
            '❌ Could not find Git repository root.'
          );
          return;
        }

        // Step 3: Get staged changes
        vscode.window.showInformationMessage('📋 Collecting staged changes...');
        const diffResult = await gitDiff.getStagedDiff(repoPath);

        if (!diffResult.diff || diffResult.diff.trim() === '') {
          vscode.window.showWarningMessage(
            '⚠️ No staged changes found. Stage your changes first using `git add`.'
          );
          return;
        }

        // Show diff stats to user
        vscode.window.showInformationMessage(
          `📊 Found ${diffResult.stats.filesChanged} file(s): +${diffResult.stats.additions} -${diffResult.stats.deletions}`
        );

        // Step 4: Generate commit message using Gemini
        const commitMessage = await geminiService.generateCommitMessage(
          diffResult.diff
        );

        if (!commitMessage) {
          vscode.window.showErrorMessage(
            '❌ Failed to generate commit message.'
          );
          return;
        }

        // Step 5: Display commit message with options
        await showCommitMessageOptions(commitMessage);
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `❌ Error: ${error.message || 'Unknown error occurred'}`
        );
        console.error('Commitly Error:', error);
      }
    }
  );

  // Command: Reset API Key
  const resetApiKey = vscode.commands.registerCommand(
    'commitly.resetApiKey',
    async () => {
      await geminiService.resetApiKey();
    }
  );

  context.subscriptions.push(generateCommit, resetApiKey);
}

/**
 * Shows the generated commit message with copy and use options
 */
async function showCommitMessageOptions(commitMessage: string) {
  const action = await vscode.window.showInformationMessage(
    `✨ Generated: "${commitMessage}"`,
    'Copy to Clipboard',
    'Use in Source Control',
    'Edit Message'
  );

  if (action === 'Copy to Clipboard') {
    await vscode.env.clipboard.writeText(commitMessage);
    vscode.window.showInformationMessage('📋 Commit message copied!');
  } else if (action === 'Use in Source Control') {
    // Fill VS Code's Source Control input box
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (gitExtension) {
      const git = gitExtension.exports.getAPI(1);
      const repo = git.repositories[0];
      if (repo) {
        repo.inputBox.value = commitMessage;
        vscode.window.showInformationMessage(
          '✅ Commit message added to Source Control!'
        );
        // Open Source Control view
        vscode.commands.executeCommand('workbench.view.scm');
      }
    }
  } else if (action === 'Edit Message') {
    // Let user edit the message
    const editedMessage = await vscode.window.showInputBox({
      prompt: 'Edit your commit message',
      value: commitMessage,
      placeHolder: 'Enter commit message...',
    });

    if (editedMessage) {
      // Show options again with edited message
      await showCommitMessageOptions(editedMessage);
    }
  }
}

export function deactivate() {}

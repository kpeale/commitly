import * as vscode from 'vscode';
import { GitDetector } from './git/gitDetector';
import { GitDiff } from './git/gitDiff';
import { GeminiService } from './ai/geminiService';

export function activate(context: vscode.ExtensionContext) {
  console.log('Commitly is now active!');

  const gitDetector = new GitDetector();
  const gitDiff = new GitDiff();
  const geminiService = new GeminiService(context);

  const generateCommit = vscode.commands.registerCommand(
    'commitly.generateCommitMessage',
    async () => {
      try {
        // Step 1: Check if Git repository exists
        const isGitRepo = await gitDetector.isGitRepository();
        if (!isGitRepo) {
          vscode.window.showErrorMessage(
            ' Not a Git repository. Please open a Git project.'
          );
          return;
        }

        // Step 2: Get repository root
        const repoPath = await gitDetector.getRepositoryRoot();
        if (!repoPath) {
          vscode.window.showErrorMessage(
            ' Could not find Git repository root.'
          );
          return;
        }

        // Step 3: Get staged changes
        const diffResult = await gitDiff.getStagedDiff(repoPath);

        // Check if there are staged changes
        if (!diffResult.diff || diffResult.diff.trim() === '') {
          vscode.window.showWarningMessage(
            ' No staged changes found. Please stage your changes first:\n• VS Code: Click "+" next to files in Source Control\n• Terminal: Run `git add <files>`'
          );
          return;
        }

        // ENFORCE 1 FILE LIMIT - Critical check before proceeding
        if (diffResult.stats.filesChanged > 1) {
          vscode.window.showWarningMessage(
            ` Please stage only ONE file at a time.\n\nYou currently have ${diffResult.stats.filesChanged} files staged.\n\n✅ To fix this:\n1. Unstage all files (Source Control → "−" icon)\n2. Stage only ONE file you want to commit\n3. Run this command again\n\nThis ensures accurate commit messages and avoids API errors.`,
            { modal: true }
          );
          return;
        }

        // Show progress - we have exactly 1 file
        vscode.window.showInformationMessage(
          ` Analyzing: ${diffResult.files[0]} (+${diffResult.stats.additions} -${diffResult.stats.deletions})`
        );

        // Step 4: Generate commit message using Gemini
        const commitMessage = await geminiService.generateCommitMessage(
          diffResult.diff,
          diffResult.files,
          diffResult.stats
        );

        if (!commitMessage) {
          vscode.window.showErrorMessage(' Failed to generate commit message.');
          return;
        }

        // Step 5: Display commit message with options
        await showCommitMessageOptions(commitMessage);
      } catch (error: any) {
        vscode.window.showErrorMessage(
          ` Error: ${error.message || 'Unknown error occurred'}`
        );
        console.error('Commitly Error:', error);
      }
    }
  );

  const resetApiKey = vscode.commands.registerCommand(
    'commitly.resetApiKey',
    async () => {
      await geminiService.resetApiKey();
    }
  );

  context.subscriptions.push(generateCommit, resetApiKey);
}

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
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (gitExtension) {
      const git = gitExtension.exports.getAPI(1);
      const repo = git.repositories[0];
      if (repo) {
        repo.inputBox.value = commitMessage;
        vscode.window.showInformationMessage(
          ' Commit message added to Source Control!'
        );

        vscode.commands.executeCommand('workbench.view.scm');
      }
    }
  } else if (action === 'Edit Message') {
    const editedMessage = await vscode.window.showInputBox({
      prompt: 'Edit your commit message',
      value: commitMessage,
      placeHolder: 'Enter commit message...',
    });

    if (editedMessage) {
      await showCommitMessageOptions(editedMessage);
    }
  }
}

export function deactivate() {}

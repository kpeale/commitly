import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private async getApiKey(): Promise<string | null> {
    let geminiApiKey = await this.context.secrets.get('geminiApiKey');

    if (!geminiApiKey) {
      geminiApiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Gemini API key from Google AI Studio',
        password: true,
        ignoreFocusOut: true,
      });

      if (geminiApiKey) {
        await this.context.secrets.store('geminiApiKey', geminiApiKey);
        vscode.window.showInformationMessage('✅ Gemini API key saved securely!');
      } else {
        vscode.window.showErrorMessage(
          ' Gemini API key is required to use Commitly.'
        );
        return null;
      }
    }

    return geminiApiKey;
  }

  public async generateCommitMessage(
    diff: string,
    files: string[] = [],
    stats: any = { additions: 0, deletions: 0, filesChanged: 0 }
  ): Promise<string | null> {
    const geminiApiKey = await this.getApiKey();
    if (!geminiApiKey) {
      return null;
    }

    try {
      const client = new GoogleGenerativeAI(geminiApiKey);
      
      
      const model = client.getGenerativeModel({
        model: 'gemini-2.5-pro',
      });

      vscode.window.showInformationMessage(
        ' Generating commit message. Please hold on ...'
      );

      
      const fileName = files[0] || 'unknown file';
      
      const prompt = `You are a professional developer writing commit messages following the Conventional Commits specification.

Based on the following git diff for "${fileName}", generate a commit message following these rules:
1. Start with a type: feat, fix, chore, docs, style, refactor, test, or perf
2. Follow with a colon and space
3. Write a clear, concise description (max 50 characters)
4. Use imperative mood ("add" not "added")
5. Don't end with a period

File: ${fileName}
Changes: +${stats.additions} additions, -${stats.deletions} deletions

Git diff:
${diff}

Return ONLY the commit message (one line), nothing else.`;

      const result = await model.generateContent(prompt);
      console.log('Gemini raw result:', result);
      const commitMessage = result.response?.text?.()?.trim() || '';

      return commitMessage || 'No response from Gemini.';
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      
      
      if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        const action = await vscode.window.showErrorMessage(
          ' Gemini API is temporarily overloaded. Please wait a moment and try again.',
          'Retry',
          'Reset API Key',
          'Cancel'
        );
        
        if (action === 'Retry') {
          await new Promise(resolve => setTimeout(resolve, 3000));
          return this.generateCommitMessage(diff, files, stats);
        } else if (action === 'Reset API Key') {
          await this.resetApiKey();
        }
      } else if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401') || error.message?.includes('403')) {
        const action = await vscode.window.showErrorMessage(
          ' Invalid API key. Get a valid key from https://aistudio.google.com/apikey',
          'Reset API Key',
          'Cancel'
        );
        
        if (action === 'Reset API Key') {
          await this.resetApiKey();
        }
      } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        vscode.window.showErrorMessage(
          ' API quota exceeded. Your free tier limit may be reached. Check https://aistudio.google.com/'
        );
      } else {
        vscode.window.showErrorMessage(` Gemini API Error: ${error.message}`);
      }
      
      return null;
    }
  }

  public async resetApiKey(): Promise<void> {
    await this.context.secrets.delete('geminiApiKey');
    vscode.window.showInformationMessage(
      " Gemini API key has been reset. You'll be asked to enter it next time."
    );
  }
}
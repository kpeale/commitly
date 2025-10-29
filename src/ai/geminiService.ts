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
        vscode.window.showInformationMessage(' Gemini API key saved securely!');
      } else {
        vscode.window.showErrorMessage(
          ' Gemini API key is required to use Commitly.'
        );
        return null;
      }
    }

    return geminiApiKey;
  }

  public async generateCommitMessage(diff: string): Promise<string | null> {
    const geminiApiKey = await this.getApiKey();
    if (!geminiApiKey) {
      return null;
    }

    try {
      // Fixed: Pass API key as string directly, not as object
      const client = new GoogleGenerativeAI(geminiApiKey);

      const model = client.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
      });

      vscode.window.showInformationMessage(
        ' Generating commit message. Please hold on ...'
      );

      const prompt = `You are a professional developer writing concise and clear commit messages.
Based on the following git diff, generate a short, conventional commit message (one line, max 72 characters):

${diff}

Return only the commit message, nothing else.`;

      const result = await model.generateContent(prompt);
      const commitMessage = result.response.text().trim();

      return commitMessage || 'No response from Gemini.';
    } catch (error: any) {
      vscode.window.showErrorMessage(`Gemini API Error: ${error.message}`);
      console.error('Gemini API Error:', error);
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

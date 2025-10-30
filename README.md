# Commitly — AI-Powered Commit Message Generator

Commitly helps developers write clear, consistent, and conventional Git commit messages — powered by Google Gemini AI.
Whether you forget your commit conventions or just want to save time, Commitly makes your commits smarter, faster, and better.

## Features

AI-Generated Commit Messages — Analyzes your staged Git diff and generates a concise commit message that follows Conventional Commits which most developer do not follow. 

 * Gemini-Powered Intelligence — Uses Google’s latest Gemini 2.5 Pro model for context-aware suggestions.

 * Secure API Key Storage — Your Gemini API key is safely encrypted using VS Code’s built-in Secrets API.

 * Interactive Options — Copy, edit, or instantly use the message in the Source Control panel.

 * File Safety Check — Prevents errors by enforcing one staged file per generation for higher accuracy.

 * Retry, Reset & Recover — Gracefully handles invalid keys, rate limits, and overloaded requests.

![Commitly demo\] (images/feature-x.gif)


## Requirements

* Commitly requires a Gemini API key from Google AI Studio.
* When you run Commitly for the first time, it will prompt you to enter your key and store it securely.

To reset your API key later, run the command:
“Commitly: Reset Gemini API Key” or press Ctrl+5 (Cmd+5 on macOS).

## Extension Settings

This extension contributes the following commands and keybindings:
| Command                          | Description                                                    |
| -------------------------------- | -------------------------------------------------------------- |
| `commitly.generateCommitMessage` | Generate a Gemini-powered commit message for your staged file. |
| `commitly.resetApiKey`           | Reset your stored Gemini API key.                              |

Keybinding:

Ctrl+5 (Windows/Linux) or Cmd+5 (macOS) — Reset Gemini API Key

## Known Issues

* Currently supports generating messages for only one staged file at a time (for accuracy). 

* API rate limits may apply based on your Google AI Studio account plan.

## Release Notes

* Users appreciate release notes as you update your extension.

### 1.0.0

* Initial release of Commitly

* AI-powered commit message generation

* Secure API key storage

* Command Palette integration

### Author

Built with ❤️ by Kpeale Legbara. She is a frontend Developer, technical writer & AI Enthusiast

### 1.0.1

Fixed issue #.

### 1.1.0

No feature added yet

---



## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)
 
### Enjoy using Commitly! ✨
Make every commit meaningful — the smart way

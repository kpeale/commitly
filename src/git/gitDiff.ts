import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitDiffResult {
  diff: string;
  files: string[];
  stats: {
    additions: number;
    deletions: number;
    filesChanged: number;
  };
}

export class GitDiff {
  async getStagedDiff(repoPath: string): Promise<GitDiffResult> {
    try {
      const { stdout: diff } = await execAsync('git diff --cached', {
        cwd: repoPath,
        maxBuffer: 1024 * 1024 * 10,
      });

      const { stdout: filesOutput } = await execAsync(
        'git diff --cached --name-only',
        { cwd: repoPath }
      );
      const files = filesOutput
        .trim()
        .split('\n')
        .filter((f) => f);

      const { stdout: statsOutput } = await execAsync(
        'git diff --cached --numstat',
        { cwd: repoPath }
      );

      const stats = this.parseStats(statsOutput);

      return { diff, files, stats };
    } catch (error) {
      throw new Error(`Failed to get git diff: ${error}`);
    }
  }

  async getUnstagedDiff(repoPath: string): Promise<GitDiffResult> {
    const { stdout: diff } = await execAsync('git diff', {
      cwd: repoPath,
      maxBuffer: 1024 * 1024 * 10,
    });

    const { stdout: filesOutput } = await execAsync('git diff --name-only', {
      cwd: repoPath,
    });
    const files = filesOutput
      .trim()
      .split('\n')
      .filter((f) => f);

    const { stdout: statsOutput } = await execAsync('git diff --numstat', {
      cwd: repoPath,
    });

    const stats = this.parseStats(statsOutput);

    return { diff, files, stats };
  }

  private parseStats(statsOutput: string) {
    const lines = statsOutput
      .trim()
      .split('\n')
      .filter((l) => l);
    let additions = 0;
    let deletions = 0;

    lines.forEach((line) => {
      const [add, del] = line.split('\t');
      additions += parseInt(add) || 0;
      deletions += parseInt(del) || 0;
    });

    return {
      additions,
      deletions,
      filesChanged: lines.length,
    };
  }
}

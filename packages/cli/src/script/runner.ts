/**
 * Script Runner — sandboxed child process executor.
 *
 * Sandbox model (v0.1):
 *   - Child process (spawn), not container/VM (deferred to v0.5)
 *   - 30s default timeout, configurable via ScriptRunOptions
 *   - Pattern blocklist prevents known-destructive commands
 *   - stdout/stderr capped at 50KB each (prevents log flooding)
 *   - CWD set to ONXZA_WORKSPACE (not root, not user home)
 *   - Dry-run mode: prints the command that would run, no execution
 *
 * The sandbox is intentional about its limitations. v0.1 prioritises
 * usability over isolation — agent-written scripts are trusted by default.
 * Container isolation is the v0.5 upgrade path.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { spawn }  from 'child_process';
import fs         from 'fs';
import path       from 'path';
import os         from 'os';
import {
  ScriptEntry, ScriptRunResult, ScriptRunOptions,
  LANGUAGE_RUNNERS,
} from './schema.js';
import { getScriptsDir } from './registry.js';

// ---------------------------------------------------------------------------
// Safety rules — patterns that trigger a block
// ---------------------------------------------------------------------------

const BLOCKED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /rm\s+-rf\s+\/(?!\w)/,         reason: 'Destructive: rm -rf /' },
  { pattern: /rm\s+-rf\s+~(?:\s|$)/,         reason: 'Destructive: rm -rf ~' },
  { pattern: /sudo\s+rm/,                    reason: 'Destructive: sudo rm' },
  { pattern: /dd\s+if=\/dev\/zero/,         reason: 'Destructive: dd if=/dev/zero' },
  { pattern: /mkfs\b/,                       reason: 'Destructive: mkfs' },
  { pattern: />\s*\/dev\/sda/,              reason: 'Destructive: write to raw device' },
  { pattern: /chmod\s+.*777\s+\//,          reason: 'Dangerous: chmod 777 on root paths' },
];

const MAX_OUTPUT_BYTES = 50 * 1024; // 50KB per stream

/**
 * Check a script file's content against the safety pattern blocklist.
 * Returns null if safe, or a reason string if blocked.
 */
export function checkSafety(scriptPath: string): string | null {
  let content: string;
  try {
    content = fs.readFileSync(scriptPath, 'utf8');
  } catch {
    return 'Cannot read script file';
  }
  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(content)) return reason;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Derive runner command
// ---------------------------------------------------------------------------

function getRunnerCommand(entry: ScriptEntry): [string, string[]] {
  const runner = LANGUAGE_RUNNERS[entry.language] ?? 'bash';
  return [runner, [entry.path]];
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

const DEFAULT_OPTS: ScriptRunOptions = {
  dryRun:         false,
  timeoutSeconds: 30,
  extraArgs:      [],
};

/**
 * Run a script in a sandboxed child process.
 * Records run history via the registry after execution.
 * @param entry   The registered ScriptEntry to execute
 * @param opts    Run options (dry-run, timeout, extra args)
 */
export function runScript(
  entry:   ScriptEntry,
  opts:    Partial<ScriptRunOptions> = {},
): Promise<ScriptRunResult> {
  const options: ScriptRunOptions = { ...DEFAULT_OPTS, ...opts };
  const ts = new Date().toISOString();

  // ── Dry-run ──────────────────────────────────────────────────────────────
  if (options.dryRun) {
    const [runner, args] = getRunnerCommand(entry);
    const cmd = [runner, ...args, ...options.extraArgs].join(' ');
    return Promise.resolve({
      name: entry.name, exitCode: 0, stdout: '', stderr: '',
      durationMs: 0, ts, success: true, timedOut: false,
      dryRun: true, blocked: false, blockReason: null,
      cmd,
    } as ScriptRunResult & { cmd: string });
  }

  // ── Safety check ─────────────────────────────────────────────────────────
  const blockReason = checkSafety(entry.path);
  if (blockReason) {
    return Promise.resolve({
      name: entry.name, exitCode: 1, stdout: '', stderr: `Blocked: ${blockReason}`,
      durationMs: 0, ts, success: false, timedOut: false,
      dryRun: false, blocked: true, blockReason,
    });
  }

  // ── File existence ────────────────────────────────────────────────────────
  if (!fs.existsSync(entry.path)) {
    return Promise.resolve({
      name: entry.name, exitCode: 1, stdout: '',
      stderr: `Script file not found: ${entry.path}`,
      durationMs: 0, ts, success: false, timedOut: false,
      dryRun: false, blocked: false, blockReason: null,
    });
  }

  // ── Execution ─────────────────────────────────────────────────────────────
  const workspace = process.env['ONXZA_WORKSPACE']
    ?? path.join(os.homedir(), '.openclaw', 'workspace');
  const cwd = fs.existsSync(workspace) ? workspace : os.homedir();

  const [runner, baseArgs] = getRunnerCommand(entry);
  const allArgs = [...baseArgs, ...options.extraArgs];

  return new Promise<ScriptRunResult>((resolve) => {
    const t0     = Date.now();
    let stdout   = '';
    let stderr   = '';
    let timedOut = false;

    const child = spawn(runner, allArgs, {
      cwd,
      env: { ...process.env, ONXZA_WORKSPACE: workspace },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (chunk: Buffer) => {
      const remaining = MAX_OUTPUT_BYTES - stdout.length;
      if (remaining > 0) stdout += chunk.toString('utf8', 0, remaining);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const remaining = MAX_OUTPUT_BYTES - stderr.length;
      if (remaining > 0) stderr += chunk.toString('utf8', 0, remaining);
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, options.timeoutSeconds * 1000);

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      const durationMs = Date.now() - t0;
      const success    = !timedOut && (exitCode ?? 1) === 0;
      resolve({
        name: entry.name,
        exitCode: exitCode ?? (timedOut ? 124 : 1),
        stdout, stderr, durationMs, ts, success,
        timedOut, dryRun: false, blocked: false, blockReason: null,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        name: entry.name, exitCode: 1, stdout,
        stderr: stderr + `\nSpawn error: ${err.message}`,
        durationMs: Date.now() - t0, ts, success: false,
        timedOut: false, dryRun: false, blocked: false, blockReason: null,
      });
    });
  });
}

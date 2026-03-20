'use strict';

/**
 * onxza checkpoint — Checkpoint management for the ONXZA safety foundation.
 *
 * Subcommands:
 *   onxza checkpoint create <slug>        — create a checkpoint snapshot
 *   onxza checkpoint list                 — list all checkpoints
 *   onxza checkpoint verify <id>          — verify vision hashes
 *   onxza checkpoint restore <id>         — print restore guide
 *   onxza checkpoint diff <id1> <id2>     — diff agents between two checkpoints
 *
 * Delegates to create-checkpoint.py (Tier 3, zero LLM).
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command } = require('commander');
const { execFileSync } = require('child_process');
const path = require('path');
const os = require('os');
const { outputJson, isJsonMode } = require('../util');

const SCRIPT = path.join(
  os.homedir(),
  '.openclaw', 'workspace', 'scripts', 'create-checkpoint.py'
);

/**
 * Run the checkpoint Python script with given args.
 * Streams output to stdout/stderr. Returns exit code.
 */
function runScript(args, { json = false, quiet = false } = {}) {
  const fullArgs = [...args];
  if (json)   fullArgs.push('--json');
  if (quiet)  fullArgs.push('--quiet');

  try {
    const output = execFileSync('python3', [SCRIPT, ...fullArgs], {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    return { output, exitCode: 0 };
  } catch (err) {
    return {
      output: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.status || 1,
    };
  }
}

// ─── parent command ───────────────────────────────────────────────────────────

const checkpointCmd = new Command('checkpoint')
  .description('Manage ONXZA safety checkpoints')
  .addHelpText('after', `
Examples:
  onxza checkpoint create before-delete-agents
  onxza checkpoint create session-start
  onxza checkpoint list
  onxza checkpoint verify 20260318-191213-dtp-021-checkpoint-system-build
  onxza checkpoint restore 20260318-191213-dtp-021-checkpoint-system-build
  onxza checkpoint diff 20260317-180323-onxza-foundation-complete 20260318-144057-onxza-full-build-2026-03-18
`);

// ─── checkpoint create ────────────────────────────────────────────────────────

const createCmd = new Command('create')
  .description('Create a checkpoint snapshot before an irreversible action')
  .argument('<slug>', 'Short slug describing the event (e.g. before-delete-agents)')
  .option('-q, --quiet', 'Suppress verbose output, only print checkpoint ID')
  .action((slug, options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    if (!slug || !slug.trim()) {
      const err = { error: 'A slug is required (e.g. before-delete-agents)' };
      if (jsonMode) { outputJson(err); } else { console.error(`Error: ${err.error}`); }
      process.exit(1);
    }

    const { output, stderr, exitCode } = runScript([slug], {
      quiet: options.quiet || jsonMode,
    });

    if (exitCode !== 0) {
      const msg = { error: 'Checkpoint creation failed', detail: stderr || output };
      if (jsonMode) { outputJson(msg); } else { console.error(output); if (stderr) console.error(stderr); }
      process.exit(1);
    }

    if (jsonMode) {
      // Extract checkpoint_id from "checkpoint created: <id>" line
      const match = output.match(/checkpoint created: (\S+)/);
      outputJson({
        status: 'ok',
        checkpoint_id: match ? match[1] : null,
        message: output.trim(),
      });
    } else {
      process.stdout.write(output);
    }
  });

// ─── checkpoint list ──────────────────────────────────────────────────────────

const listCmd = new Command('list')
  .description('List all checkpoints with timestamp and event slug')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const { output, stderr, exitCode } = runScript(['--list'], { json: jsonMode });

    if (exitCode !== 0) {
      const msg = { error: 'Failed to list checkpoints', detail: stderr || output };
      if (jsonMode) { outputJson(msg); } else { console.error(output); }
      process.exit(1);
    }

    process.stdout.write(output);
  });

// ─── checkpoint verify ────────────────────────────────────────────────────────

const verifyCmd = new Command('verify')
  .description('Verify vision document hashes against a stored checkpoint')
  .argument('<checkpoint-id>', 'The checkpoint ID to verify against')
  .action((checkpointId, options, cmd) => {
    const { output, stderr, exitCode } = runScript(['--verify', checkpointId]);

    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);

    if (exitCode !== 0) {
      process.exit(1);
    }
  });

// ─── checkpoint restore ───────────────────────────────────────────────────────

const restoreCmd = new Command('restore')
  .description('Print step-by-step restore instructions for a checkpoint')
  .argument('<checkpoint-id>', 'The checkpoint ID to restore from')
  .action((checkpointId) => {
    const { output, stderr, exitCode } = runScript(['--restore', checkpointId]);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ─── checkpoint diff ──────────────────────────────────────────────────────────

const diffCmd = new Command('diff')
  .description('Show agent additions/removals between two checkpoints')
  .argument('<checkpoint-id-1>', 'Earlier checkpoint')
  .argument('<checkpoint-id-2>', 'Later checkpoint')
  .action((cp1, cp2) => {
    const { output, stderr, exitCode } = runScript(['--diff', cp1, cp2]);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// Wire sub-commands
checkpointCmd.addCommand(createCmd);
checkpointCmd.addCommand(listCmd);
checkpointCmd.addCommand(verifyCmd);
checkpointCmd.addCommand(restoreCmd);
checkpointCmd.addCommand(diffCmd);

module.exports = checkpointCmd;

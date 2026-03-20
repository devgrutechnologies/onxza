'use strict';

/**
 * onxza audit — Append-only audit trail management.
 *
 * Subcommands:
 *   onxza audit log   --agent X --action X --outcome X [--confirmed-by X] [--reversible yes|no] [--checkpoint-id X]
 *   onxza audit list  [--agent X] [--action X] [--date X]
 *   onxza audit verify
 *
 * Delegates to log-audit-entry.py (Tier 3 pure-script, zero LLM).
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command } = require('commander');
const { execFileSync, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const { outputJson, isJsonMode } = require('../util');

// Path to the Python audit script (relative to workspace scripts/)
const SCRIPT = path.join(
  os.homedir(),
  '.openclaw', 'workspace', 'scripts', 'log-audit-entry.py'
);

/**
 * Run the audit Python script with given args.
 * Returns stdout string, throws on non-zero exit.
 */
function runScript(args) {
  return execFileSync('python3', [SCRIPT, ...args], {
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });
}

// ─── onxza audit (parent) ─────────────────────────────────────────────────────

const auditCmd = new Command('audit')
  .description('Manage the ONXZA append-only audit trail')
  .addHelpText('after', `
Examples:
  onxza audit log --agent wdc-coo --action "Deleted 200 stale pages" --outcome ok --reversible no
  onxza audit list
  onxza audit list --agent wdc-coo --date 2026-03-18
  onxza audit verify
`);

// ─── onxza audit log ──────────────────────────────────────────────────────────

const auditLogCmd = new Command('log')
  .description('Append an irreversible action entry to the audit trail')
  .requiredOption('--agent <id>', 'Agent ID that performed the action')
  .requiredOption('--action <desc>', 'Description of the action taken')
  .requiredOption('--outcome <result>', 'Outcome: ok | fail | cancelled')
  .option('--confirmed-by <name>', 'Human who confirmed, or "none"', 'none')
  .option('--reversible <bool>', 'Was the action reversible: yes | no', 'no')
  .option('--checkpoint-id <id>', 'Checkpoint ID taken before action, or "none"', 'none')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    // Validate --outcome
    const validOutcomes = ['ok', 'fail', 'cancelled'];
    if (!validOutcomes.includes(options.outcome)) {
      const err = { error: `--outcome must be one of: ${validOutcomes.join(', ')}` };
      if (jsonMode) { outputJson(err); } else { console.error(`Error: ${err.error}`); }
      process.exit(1);
    }

    // Validate --reversible
    const validReversible = ['yes', 'no'];
    if (!validReversible.includes(options.reversible)) {
      const err = { error: `--reversible must be one of: ${validReversible.join(', ')}` };
      if (jsonMode) { outputJson(err); } else { console.error(`Error: ${err.error}`); }
      process.exit(1);
    }

    try {
      const scriptArgs = [
        '--agent',         options.agent,
        '--action',        options.action,
        '--outcome',       options.outcome,
        '--confirmed-by',  options.confirmedBy,
        '--reversible',    options.reversible,
        '--checkpoint-id', options.checkpointId,
      ];

      const output = runScript(scriptArgs);

      if (jsonMode) {
        // Parse "logged: timestamp | agent | action..." from script output
        outputJson({ status: 'ok', message: output.trim() });
      } else {
        process.stdout.write(output);
      }
    } catch (err) {
      const msg = { error: 'Failed to write audit entry', detail: err.stderr || err.message };
      if (jsonMode) { outputJson(msg); } else { console.error(`Error: ${msg.detail}`); }
      process.exit(1);
    }
  });

// ─── onxza audit list ─────────────────────────────────────────────────────────

const auditListCmd = new Command('list')
  .description('List audit trail entries with optional filters')
  .option('--agent <id>', 'Filter by agent ID (substring match)')
  .option('--action <text>', 'Filter by action description (substring match)')
  .option('--date <yyyy-mm-dd>', 'Filter by date prefix (e.g. 2026-03-18)')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    try {
      const scriptArgs = ['--list'];
      if (options.agent)  scriptArgs.push('--filter-agent',  options.agent);
      if (options.action) scriptArgs.push('--filter-action', options.action);
      if (options.date)   scriptArgs.push('--filter-date',   options.date);
      if (jsonMode)       scriptArgs.push('--json');

      const output = runScript(scriptArgs);
      process.stdout.write(output);
    } catch (err) {
      const msg = { error: 'Failed to read audit trail', detail: err.stderr || err.message };
      if (jsonMode) { outputJson(msg); } else { console.error(`Error: ${msg.detail}`); }
      process.exit(1);
    }
  });

// ─── onxza audit verify ───────────────────────────────────────────────────────

const auditVerifyCmd = new Command('verify')
  .description('Verify SHA256 checksums on all audit trail entries')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    try {
      const output = runScript(['--verify']);
      process.stdout.write(output);
    } catch (err) {
      // Script exits with code 1 if verification fails — that's intentional
      const output = err.stdout || '';
      const detail = err.stderr || err.message;
      process.stdout.write(output);
      if (detail && detail.trim()) {
        console.error(detail);
      }
      process.exit(1);
    }
  });

// Wire sub-commands
auditCmd.addCommand(auditLogCmd);
auditCmd.addCommand(auditListCmd);
auditCmd.addCommand(auditVerifyCmd);

module.exports = auditCmd;

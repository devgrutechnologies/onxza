'use strict';

/**
 * onxza dispatcher — Central ONXZA ticket dispatch system.
 *
 * Sub-commands:
 *   status    Show last run, pending deliveries, queue depth, cadence config
 *   run       Trigger dispatcher immediately (one-shot)
 *   dry-run   Scan tickets without sending notifications
 *   logs      Tail dispatcher log
 *
 * The dispatcher runs automatically via OpenClaw cron every 5 minutes.
 * This command provides the health-check surface (ARCHITECTURE.md §6.5).
 *
 * TICKET-20260318-DTP-024 — onxza dispatcher cron automation
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command }    = require('commander');
const { outputJson, isJsonMode } = require('../util');
const fs             = require('fs');
const path           = require('path');
const { execSync, spawnSync } = require('child_process');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const HOME            = process.env.HOME || os().homedir();
const WORKSPACE       = path.join(HOME, '.openclaw', 'workspace');
const DISPATCHER_DIR  = path.join(WORKSPACE, 'projects', 'onxza', 'dispatcher');
const STATUS_FILE     = path.join(DISPATCHER_DIR, 'status.json');
const LOG_FILE        = path.join(DISPATCHER_DIR, 'dispatcher.log');
const DISPATCHER_PY   = path.join(DISPATCHER_DIR, 'dispatcher.py');

function os() {
  return require('os');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function formatTs(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', { timeZoneName: 'short' });
  } catch {
    return isoStr;
  }
}

function runPython(args) {
  const result = spawnSync('python3', [DISPATCHER_PY, ...args], {
    encoding: 'utf8',
    timeout: 30000,
  });
  return result;
}

// ---------------------------------------------------------------------------
// status sub-command
// ---------------------------------------------------------------------------

function statusAction(options, cmd) {
  const jsonMode = isJsonMode(cmd);

  const status = readJson(STATUS_FILE);

  if (!status) {
    if (jsonMode) {
      outputJson({ status: 'not_run', message: 'Dispatcher has not run yet. Use `onxza dispatcher run` to trigger.' });
    } else {
      console.log('');
      console.log('  ONXZA Dispatcher — Status');
      console.log('  ──────────────────────────────────────────────');
      console.log('  ⚠  No status available. Dispatcher has not run yet.');
      console.log('  Run `onxza dispatcher run` to execute immediately.');
      console.log('');
    }
    return;
  }

  const s = status.last_run_summary || {};

  if (jsonMode) {
    outputJson({
      status:           'ok',
      dispatcher:       status,
    });
    return;
  }

  console.log('');
  console.log('  ONXZA Dispatcher — Health Status');
  console.log('  ──────────────────────────────────────────────────────');
  console.log(`  Version:        ${status.dispatcher_version || '—'}`);
  console.log(`  Last Run:       ${formatTs(status.last_run)}`);
  console.log(`  Total Runs:     ${status.run_count || '—'}`);
  console.log('');
  console.log('  Last Run Summary:');
  console.log(`    Tickets Scanned:   ${s.tickets_scanned ?? '—'}`);
  console.log(`    Tickets Assigned:  ${s.tickets_assigned ?? '—'}`);
  console.log(`    Delivered:         ${s.delivered ?? '—'}`);
  console.log(`    Skipped (cadence): ${s.skipped_cadence ?? '—'}`);
  console.log(`    Errors:            ${s.errors ?? '—'}`);
  console.log(`    Unassigned:        ${s.unassigned ?? '—'}`);
  console.log('');
  console.log(`  Queue Depth:    ${status.queue_depth ?? '—'} pending`);
  console.log(`  Total Sent:     ${status.total_notifications ?? '—'}`);
  console.log('');
  console.log('  Agent Cadences:');
  const cadences = status.agent_cadences || {};
  for (const [role, cadence] of Object.entries(cadences)) {
    console.log(`    ${role.padEnd(20)} ${cadence}`);
  }
  if (status.errors_recent && status.errors_recent.length > 0) {
    console.log('');
    console.log('  Recent Errors:');
    for (const e of status.errors_recent) {
      console.log(`    ⚠  ${e}`);
    }
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// run sub-command
// ---------------------------------------------------------------------------

function runAction(options, cmd) {
  const jsonMode = isJsonMode(cmd);

  if (!fs.existsSync(DISPATCHER_PY)) {
    const msg = `Dispatcher script not found at: ${DISPATCHER_PY}`;
    if (jsonMode) { outputJson({ status: 'error', message: msg }); }
    else { console.log(`\n  ✗ ${msg}\n`); }
    process.exitCode = 1;
    return;
  }

  if (!jsonMode) {
    console.log('');
    console.log('  ONXZA Dispatcher — Running…');
  }

  const result = runPython([]);

  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  const code   = result.status ?? 1;

  if (jsonMode) {
    outputJson({
      status:   code === 0 ? 'ok' : 'error',
      exit_code: code,
      output:   stdout,
      errors:   stderr || null,
    });
    return;
  }

  if (stdout) {
    for (const line of stdout.split('\n')) {
      console.log(`  ${line}`);
    }
  }
  if (stderr) {
    console.log('');
    console.log('  Stderr:');
    for (const line of stderr.split('\n')) {
      console.log(`  ⚠  ${line}`);
    }
  }
  console.log('');
  if (code === 0) {
    console.log('  ✓ Dispatcher run complete.');
  } else {
    console.log(`  ✗ Dispatcher exited with code ${code}`);
    process.exitCode = 1;
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// dry-run sub-command
// ---------------------------------------------------------------------------

function dryRunAction(options, cmd) {
  const jsonMode = isJsonMode(cmd);

  if (!fs.existsSync(DISPATCHER_PY)) {
    const msg = `Dispatcher script not found at: ${DISPATCHER_PY}`;
    if (jsonMode) { outputJson({ status: 'error', message: msg }); }
    else { console.log(`\n  ✗ ${msg}\n`); }
    process.exitCode = 1;
    return;
  }

  const result = runPython(['--dry-run']);
  const stdout = (result.stdout || '').trim();
  const code   = result.status ?? 1;

  if (jsonMode) {
    try {
      // dispatcher --dry-run outputs JSON
      const parsed = JSON.parse(stdout);
      outputJson({ status: 'ok', dry_run: parsed });
    } catch {
      outputJson({ status: code === 0 ? 'ok' : 'error', output: stdout });
    }
    return;
  }

  console.log('');
  console.log('  ONXZA Dispatcher — Dry Run (no notifications sent)');
  console.log('  ──────────────────────────────────────────────────────');

  try {
    const data = JSON.parse(stdout);
    console.log(`  Tickets scanned:  ${data.tickets_scanned}`);
    console.log(`  Tickets assigned: ${data.tickets_assigned}`);
    console.log('');
    if (data.tickets && data.tickets.length > 0) {
      console.log('  Pending dispatch:');
      for (const t of data.tickets) {
        const pri = (t.priority || 'medium').padEnd(8);
        console.log(`    [${pri}] ${t.id}  →  ${t.assigned_to}`);
        if (t.summary) {
          console.log(`             ${t.summary}`);
        }
      }
    } else {
      console.log('  No tickets with assigned agents found.');
    }
  } catch {
    for (const line of stdout.split('\n')) {
      console.log(`  ${line}`);
    }
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// logs sub-command
// ---------------------------------------------------------------------------

function logsAction(options, cmd) {
  const jsonMode = isJsonMode(cmd);
  const lines = options.lines || 50;

  if (!fs.existsSync(LOG_FILE)) {
    if (jsonMode) {
      outputJson({ status: 'not_found', message: 'No dispatcher log yet.' });
    } else {
      console.log('\n  No dispatcher log yet. Run `onxza dispatcher run` first.\n');
    }
    return;
  }

  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const allLines = content.split('\n').filter(Boolean);
    const tail = allLines.slice(-lines);

    if (jsonMode) {
      outputJson({ status: 'ok', lines: tail });
      return;
    }

    console.log('');
    console.log(`  ONXZA Dispatcher — Last ${lines} log lines`);
    console.log('  ──────────────────────────────────────────────');
    for (const l of tail) {
      console.log(`  ${l}`);
    }
    console.log('');
  } catch (e) {
    if (jsonMode) {
      outputJson({ status: 'error', message: e.message });
    } else {
      console.log(`\n  ✗ Cannot read log: ${e.message}\n`);
    }
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// Command definitions
// ---------------------------------------------------------------------------

const dispatcherCmd = new Command('dispatcher')
  .description('ONXZA central dispatcher — ticket scanning and agent notification');

dispatcherCmd
  .command('status')
  .description('Show dispatcher health: last run, queue depth, cadence config')
  .action(statusAction);

dispatcherCmd
  .command('run')
  .description('Trigger dispatcher immediately (scan tickets and send notifications)')
  .action(runAction);

dispatcherCmd
  .command('dry-run')
  .description('Scan open tickets and preview dispatch targets without sending')
  .action(dryRunAction);

dispatcherCmd
  .command('logs')
  .description('Show recent dispatcher log output')
  .option('-n, --lines <count>', 'Number of lines to show', '50')
  .action(logsAction);

module.exports = dispatcherCmd;

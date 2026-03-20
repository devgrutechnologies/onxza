'use strict';

/**
 * onxza session — Session lifecycle management.
 *
 * Subcommands:
 *   onxza session start --agent <id>
 *       Run session-start protocol:
 *       1. Auto-consolidate pending daily memory logs → MEMORY.md
 *       2. Print memory status
 *       3. Check for open tickets assigned to agent
 *
 *   onxza session end --agent <id> [--what X] [--learned X] ...
 *       Run session-end protocol:
 *       1. Write session log entry to daily memory/YYYY-MM-DD.md
 *       2. Run consolidation (extract learnings immediately)
 *
 * ARCHITECTURE.md §9.3 · TICKET-20260318-DTP-039
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command } = require('commander');
const { execFileSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { outputJson, isJsonMode } = require('../util');

const LOG_SCRIPT = path.join(os.homedir(), '.openclaw', 'workspace', 'scripts', 'session-memory-log.py');
const OPENCLAW_JSON = path.join(os.homedir(), '.openclaw', 'openclaw.json');
const TICKETS_OPEN  = path.join(os.homedir(), '.openclaw', 'workspace', 'tickets', 'open');

function runScript(args) {
  try {
    const out = execFileSync('python3', [LOG_SCRIPT, ...args], {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    return { output: out, exitCode: 0 };
  } catch (err) {
    return { output: err.stdout || '', stderr: err.stderr || '', exitCode: err.status || 1 };
  }
}

function getOpenTicketsForAgent(agentId) {
  try {
    const files = fs.readdirSync(TICKETS_OPEN);
    return files.filter(f => {
      if (!f.endsWith('.md')) return false;
      try {
        const content = fs.readFileSync(path.join(TICKETS_OPEN, f), 'utf-8');
        return new RegExp(`^assigned_to:\\s*${agentId}\\s*$`, 'm').test(content);
      } catch { return false; }
    });
  } catch { return []; }
}

// ─── parent ───────────────────────────────────────────────────────────────────

const sessionCmd = new Command('session')
  .description('Session lifecycle management — start protocol, end logging, memory consolidation')
  .addHelpText('after', `
Examples:
  onxza session start --agent wdc-coo
  onxza session end --agent wdc-coo \\
    --ticket TICKET-20260318-001 \\
    --what "Built blog affiliate optimization" \\
    --learned "GYG API rate limit is 100 req/min" \\
    --decision "Use caching layer for GYG calls"
`);

// ─── session start ────────────────────────────────────────────────────────────

sessionCmd
  .command('start')
  .description('Run session-start protocol: consolidate memory, show status, check open tickets')
  .requiredOption('--agent <id>', 'Agent ID starting the session')
  .option('--workspace <dir>', 'Workspace directory override')
  .option('--quiet', 'Suppress detail output')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    if (!jsonMode) console.log(`\n⚡ Session Start: ${options.agent}\n`);

    // 1. Auto-consolidate pending daily logs
    if (!options.quiet && !jsonMode) console.log('  Checking memory consolidation...');
    const consolidateArgs = ['--consolidate', '--agent', options.agent];
    if (options.workspace) consolidateArgs.push('--workspace', options.workspace);
    if (jsonMode) consolidateArgs.push('--json');
    const { output: conOut } = runScript(consolidateArgs);

    // 2. Memory status
    const statusArgs = ['--status', '--agent', options.agent];
    if (options.workspace) statusArgs.push('--workspace', options.workspace);
    if (jsonMode) statusArgs.push('--json');
    const { output: statusOut } = runScript(statusArgs);

    // 3. Open tickets
    const openTickets = getOpenTicketsForAgent(options.agent);

    if (jsonMode) {
      // Parse JSON outputs
      let consolidateData = {};
      let statusData = {};
      try { consolidateData = JSON.parse(conOut); } catch { /* ok */ }
      try { statusData = JSON.parse(statusOut); } catch { /* ok */ }
      outputJson({
        agent: options.agent,
        consolidation: consolidateData,
        memory_status: statusData,
        open_tickets: openTickets.length,
        ticket_list: openTickets.slice(0, 5),
      });
      return;
    }

    process.stdout.write(conOut);
    process.stdout.write(statusOut);

    if (openTickets.length > 0) {
      console.log(`  📋 Open tickets assigned: ${openTickets.length}`);
      openTickets.slice(0, 5).forEach(t => console.log(`     - ${t}`));
      if (openTickets.length > 5) console.log(`     ...and ${openTickets.length - 5} more`);
      console.log();
    } else {
      console.log('  ✓ No open tickets assigned');
      console.log();
    }
  });

// ─── session end ──────────────────────────────────────────────────────────────

sessionCmd
  .command('end')
  .description('Run session-end protocol: write session log entry and consolidate learnings')
  .requiredOption('--agent <id>', 'Agent ID ending the session')
  .option('--workspace <dir>', 'Workspace directory override')
  .option('--ticket <id>', 'Related ticket ID', 'none')
  .option('--what <text>', 'What happened this session', '(not specified)')
  .option('--decision <text>', 'Decision made', '(not specified)')
  .option('--why <text>', 'Why this decision', '(not specified)')
  .option('--learned <text>', 'What was learned', '(not specified)')
  .option('--differently <text>', 'What to do differently next time', '(nothing — handled correctly)')
  .option('--no-consolidate', 'Skip auto-consolidation after logging')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    if (!jsonMode) console.log(`\n✓ Session End: ${options.agent}\n`);

    // 1. Write session log entry
    const logArgs = ['--log', '--agent', options.agent];
    if (options.workspace)   logArgs.push('--workspace', options.workspace);
    if (options.ticket)      logArgs.push('--ticket', options.ticket);
    if (options.what)        logArgs.push('--what', options.what);
    if (options.decision)    logArgs.push('--decision', options.decision);
    if (options.why)         logArgs.push('--why', options.why);
    if (options.learned)     logArgs.push('--learned', options.learned);
    if (options.differently) logArgs.push('--differently', options.differently);
    if (jsonMode)            logArgs.push('--json');

    const { output: logOut, exitCode: logExit } = runScript(logArgs);
    process.stdout.write(logOut);
    if (logExit !== 0) { process.exit(logExit); }

    // 2. Auto-consolidate (unless --no-consolidate)
    if (options.consolidate !== false) {
      const conArgs = ['--consolidate', '--agent', options.agent];
      if (options.workspace) conArgs.push('--workspace', options.workspace);
      if (jsonMode) conArgs.push('--json');
      const { output: conOut } = runScript(conArgs);
      if (!jsonMode) process.stdout.write(conOut);
    }
  });

module.exports = sessionCmd;

'use strict';

/**
 * onxza memory — Memory Isolation + Session Memory Log automation.
 *
 * Isolation subcommands (TICKET-DTP-028):
 *   onxza memory check <path> --agent <id>          Check if agent can access path
 *   onxza memory classify <path> [--as <CLASS>]     Set or display path classification
 *   onxza memory audit [--agent <id>] [--date X]    Show access log
 *   onxza memory grant --from-company X --to-agent Y  Grant cross-company access
 *   onxza memory revoke --from-company X --to-agent Y Revoke grant
 *   onxza memory grants                              List active grants
 *   onxza memory scan                                Scan for isolation violations
 *
 * Session log subcommands (TICKET-DTP-039):
 *   onxza memory log --agent <id> [--what X] [--learned X] ...
 *   onxza memory consolidate --agent <id> [--dry-run]
 *   onxza memory search <query> --agent <id>
 *   onxza memory status --agent <id>
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

const SCRIPT     = path.join(os.homedir(), '.openclaw', 'workspace', 'scripts', 'validate-memory-access.py');
const LOG_SCRIPT = path.join(os.homedir(), '.openclaw', 'workspace', 'scripts', 'session-memory-log.py');

function runScript(args) {
  try {
    const out = execFileSync('python3', [SCRIPT, ...args], {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    return { output: out, exitCode: 0 };
  } catch (err) {
    return { output: err.stdout || '', stderr: err.stderr || '', exitCode: err.status || 1 };
  }
}

// ─── parent ───────────────────────────────────────────────────────────────────

const memoryCmd = new Command('memory')
  .description('Memory Isolation enforcement — access control, classification, audit')
  .addHelpText('after', `
Classifications:
  PRIVATE  — stays in owning agent workspace only (MEMORY.md, SOUL.md, IDENTITY.md)
  SHARED   — company-tier shared learnings (readable by same company only)
  GLOBAL   — global shared learnings (readable by all agents)
  VISION   — vision documents (readable by all, writable only by Marcus + Aaron)
  PUBLIC   — explicitly readable by anyone (AGENTS.md, HEARTBEAT.md, TOOLS.md)

Rules:
  • MEMORY.md is always PRIVATE — cannot be reclassified
  • mg-parent-* agents may read any MEMORY.md (Marcus oversight override)
  • Cross-company shared-learnings require an explicit --grant
  • All denials are logged to logs/audit/memory-access.log + audit trail

Examples:
  onxza memory check ~/.openclaw/workspace-wdc-coo/MEMORY.md --agent dtp-backend
  onxza memory classify shared-learnings/WDC/patterns/my-pattern.md
  onxza memory classify shared-learnings/WDC/patterns/my-pattern.md --as SHARED
  onxza memory audit
  onxza memory audit --agent wdc-coo
  onxza memory grant --from-company DTP --to-agent wdc-coo
  onxza memory grants
  onxza memory scan
`);

// ─── memory check ─────────────────────────────────────────────────────────────

memoryCmd
  .command('check <path>')
  .description('Check if an agent is allowed to access a filesystem path')
  .requiredOption('--agent <id>', 'Requesting agent ID')
  .action((filePath, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    const args = ['--check', fullPath, '--agent', options.agent];
    if (jsonMode) args.push('--json');
    const { output, stderr, exitCode } = runScript(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ─── memory classify ──────────────────────────────────────────────────────────

memoryCmd
  .command('classify <path>')
  .description('Set or display the memory classification of a path')
  .option('--as <classification>', 'New classification: PRIVATE | SHARED | GLOBAL | VISION | PUBLIC')
  .action((filePath, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    const args = ['--classify', fullPath];
    if (options.as) args.push('--classification', options.as.toUpperCase());
    if (jsonMode) args.push('--json');
    const { output, stderr, exitCode } = runScript(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ─── memory audit ─────────────────────────────────────────────────────────────

memoryCmd
  .command('audit')
  .description('Show memory access log — all denials and cross-boundary access events')
  .option('--agent <id>', 'Filter by agent ID')
  .option('--date <yyyy-mm-dd>', 'Filter by date')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--audit'];
    if (options.agent) args.push('--agent', options.agent);
    if (options.date)  args.push('--date', options.date);
    if (jsonMode)      args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── memory grant ─────────────────────────────────────────────────────────────

memoryCmd
  .command('grant')
  .description('Create an explicit cross-company read grant')
  .requiredOption('--from-company <name>', 'Company whose learnings are being granted (e.g. DTP)')
  .requiredOption('--to-agent <id>', 'Agent being granted access')
  .option('--paths <glob>', 'Path glob to grant (defaults to all shared-learnings for that company)')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--grant', '--from-company', options.fromCompany, '--to-agent', options.toAgent];
    if (options.paths) args.push('--paths', options.paths);
    if (jsonMode) args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── memory revoke ────────────────────────────────────────────────────────────

memoryCmd
  .command('revoke')
  .description('Revoke a cross-company read grant')
  .requiredOption('--from-company <name>', 'Company whose grant to revoke')
  .requiredOption('--to-agent <id>', 'Agent whose access to revoke')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--revoke', '--from-company', options.fromCompany, '--to-agent', options.toAgent];
    if (jsonMode) args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── memory grants ────────────────────────────────────────────────────────────

memoryCmd
  .command('grants')
  .description('List all active cross-company read grants')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--list-grants'];
    if (jsonMode) args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── memory scan ──────────────────────────────────────────────────────────────

memoryCmd
  .command('scan')
  .description('Scan workspace for memory isolation violations (PRIVATE files in wrong location, potential secrets)')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--scan'];
    if (jsonMode) args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── helper for log-script ────────────────────────────────────────────────────

function runLogScript(args) {
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

// ─── memory log ───────────────────────────────────────────────────────────────

memoryCmd
  .command('log')
  .description('Append a structured session entry to the agent\'s daily memory/YYYY-MM-DD.md')
  .requiredOption('--agent <id>', 'Agent ID writing the log entry')
  .option('--workspace <dir>', 'Workspace directory (auto-detected if omitted)')
  .option('--session-id <id>', 'Session ID (auto-generated if omitted)')
  .option('--what <text>', 'What happened this session', '(not specified)')
  .option('--decision <text>', 'Decision made', '(not specified)')
  .option('--why <text>', 'Why this decision', '(not specified)')
  .option('--learned <text>', 'What was learned', '(not specified)')
  .option('--differently <text>', 'What to do differently next time', '(nothing — handled correctly)')
  .option('--ticket <id>', 'Related ticket ID', 'none')
  .addHelpText('after', `
Entry format (ARCHITECTURE.md §9.3):
  ## YYYY-MM-DD — SESSION-ID
  ### What happened
  ### Decision made
  ### Why
  ### What I learned
  ### What I'd do differently

Run consolidate after a session to extract learnings into MEMORY.md.
`)
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--log', '--agent', options.agent];
    if (options.workspace) args.push('--workspace', options.workspace);
    if (options.sessionId) args.push('--session-id', options.sessionId);
    if (options.what)        args.push('--what', options.what);
    if (options.decision)    args.push('--decision', options.decision);
    if (options.why)         args.push('--why', options.why);
    if (options.learned)     args.push('--learned', options.learned);
    if (options.differently) args.push('--differently', options.differently);
    if (options.ticket)      args.push('--ticket', options.ticket);
    if (jsonMode)            args.push('--json');
    const { output, stderr, exitCode } = runLogScript(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ─── memory consolidate ───────────────────────────────────────────────────────

memoryCmd
  .command('consolidate')
  .description('Consolidate daily memory logs into MEMORY.md — extract key learnings, remove noise')
  .requiredOption('--agent <id>', 'Agent ID to consolidate')
  .option('--workspace <dir>', 'Workspace directory (auto-detected if omitted)')
  .option('--dry-run', 'Show what would be consolidated without writing')
  .addHelpText('after', `
Reads all pending memory/YYYY-MM-DD.md files.
Extracts "What I learned" and key "Decision made" entries.
Appends unique learnings to MEMORY.md ## Key Learnings section.
Marks daily files as consolidated: true.

Run automatically at session start when pending daily logs exist.
`)
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--consolidate', '--agent', options.agent];
    if (options.workspace) args.push('--workspace', options.workspace);
    if (options.dryRun)    args.push('--dry-run');
    if (jsonMode)          args.push('--json');
    const { output, stderr, exitCode } = runLogScript(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ─── memory search ────────────────────────────────────────────────────────────

memoryCmd
  .command('search <query>')
  .description('Search across all memory files for an agent (MEMORY.md + daily logs)')
  .requiredOption('--agent <id>', 'Agent ID to search')
  .option('--workspace <dir>', 'Workspace directory (auto-detected if omitted)')
  .action((query, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--search', query, '--agent', options.agent];
    if (options.workspace) args.push('--workspace', options.workspace);
    if (jsonMode)          args.push('--json');
    const { output, exitCode } = runLogScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── memory status ────────────────────────────────────────────────────────────

memoryCmd
  .command('status')
  .description('Show memory health summary — daily log count, consolidation status, MEMORY.md size')
  .requiredOption('--agent <id>', 'Agent ID')
  .option('--workspace <dir>', 'Workspace directory (auto-detected if omitted)')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--status', '--agent', options.agent];
    if (options.workspace) args.push('--workspace', options.workspace);
    if (jsonMode)          args.push('--json');
    const { output, exitCode } = runLogScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

module.exports = memoryCmd;

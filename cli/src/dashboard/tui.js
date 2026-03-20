'use strict';

/**
 * ONXZA Mission Control TUI
 *
 * Framework decision: Raw ANSI escape sequences + Node.js readline + fs.watch
 *
 * Alternatives considered:
 *   - Ink (React for CLI): adds React + reconciler (~800KB). Overkill for a
 *     status dashboard. Requires JSX compilation step. Good for complex forms.
 *   - Blessed: unmaintained (last release 2017). Known stability issues on macOS.
 *   - Textual (Python): wrong runtime for our Node.js CLI.
 *   - Bubbletea (Go): wrong runtime.
 *
 * Decision: Raw ANSI gives us full control, zero extra dependencies, instant
 * startup (<50ms), and works on every terminal that supports ANSI (macOS/Linux/
 * Windows Terminal). The dashboard is a read-only display — it doesn't need
 * form widgets or complex input handling. Raw ANSI is the right tool.
 *
 * ARCHITECTURE.md §13 · mission-control-spec.md · TICKET-20260318-DTP-008
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const readline = require('readline');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');
const { getSystemHealth } = require('../system/health');

// ---------------------------------------------------------------------------
// ANSI primitives
// ---------------------------------------------------------------------------

const ESC = '\x1b';
const A   = {
  clear:       ESC + '[2J',
  home:        ESC + '[H',
  hideCursor:  ESC + '[?25l',
  showCursor:  ESC + '[?25h',
  altScreen:   ESC + '[?1049h',
  normalScreen:ESC + '[?1049l',
  bold:        ESC + '[1m',
  dim:         ESC + '[2m',
  reset:       ESC + '[0m',
  green:       ESC + '[32m',
  yellow:      ESC + '[33m',
  red:         ESC + '[31m',
  cyan:        ESC + '[36m',
  blue:        ESC + '[34m',
  magenta:     ESC + '[35m',
  white:       ESC + '[37m',
  gray:        ESC + '[90m',
  bgBlue:      ESC + '[44m',
  bgDark:      ESC + '[48;5;235m',
  move:        (r, c) => ESC + `[${r};${c}H`,
  clearLine:   ESC + '[2K',
};

function write(str) { process.stdout.write(str); }
function writeln(str = '') { process.stdout.write(str + '\n'); }

function pad(str, len, align = 'left') {
  const s = String(str == null ? '' : str);
  if (s.length >= len) return s.slice(0, len);
  const sp = ' '.repeat(len - s.length);
  return align === 'right' ? sp + s : s + sp;
}

function truncate(str, len) {
  if (!str) return '';
  return String(str).length > len ? String(str).slice(0, len - 1) + '…' : String(str);
}

function scoreBar(score, width = 16) {
  const filled = Math.round((score / 100) * width);
  const empty  = width - filled;
  const color  = score >= 85 ? A.green : score >= 60 ? A.yellow : A.red;
  return color + '█'.repeat(filled) + A.gray + '░'.repeat(empty) + A.reset;
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const REFRESH_MS     = 5000;   // Auto-refresh interval
const LOG_LINES      = 8;      // Lines in the log tail panel
const MAX_AGENT_ROWS = 25;     // Max agents shown in agent board

// ---------------------------------------------------------------------------
// Log buffer (in-process ring buffer — real log file watcher in v0.2)
// ---------------------------------------------------------------------------

const logBuffer = [];
const MAX_LOG = 100;

function appendLog(line) {
  logBuffer.push(`${new Date().toLocaleTimeString()}  ${line}`);
  if (logBuffer.length > MAX_LOG) logBuffer.shift();
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

let termWidth  = process.stdout.columns  || 120;
let termHeight = process.stdout.rows     || 40;

function divider(char = '─', color = A.gray) {
  return color + char.repeat(Math.min(termWidth - 2, 100)) + A.reset;
}

function sectionHeader(title, color = A.cyan) {
  const bar = '─'.repeat(Math.max(0, Math.min(termWidth - 4 - title.length, 60)));
  return `  ${color}${A.bold}${title}${A.reset}  ${A.gray}${bar}${A.reset}`;
}

function renderAgentBoard(agents, activeTab) {
  const rows = agents.slice(0, MAX_AGENT_ROWS);
  writeln(sectionHeader('AGENT STATUS BOARD', A.cyan));
  writeln(`  ${A.gray}${pad('ID', 36)}${pad('CO', 6)}${pad('MODEL', 18)}${pad('STATE', 9)}TASK${A.reset}`);
  writeln(`  ${A.gray}${'─'.repeat(Math.min(termWidth - 4, 90))}${A.reset}`);
  for (const a of rows) {
    const stateColor = a.taskState === 'ACTIVE' ? A.green : a.taskState === 'UNKNOWN' ? A.yellow : A.gray;
    const stateIcon  = a.taskState === 'ACTIVE' ? '●' : a.taskState === 'UNKNOWN' ? '?' : '○';
    const task       = a.taskId ? truncate(a.taskId, 30) : '—';
    writeln(
      `  ${stateColor}${stateIcon}${A.reset} ${pad(truncate(a.id, 33), 34)}${pad(a.company, 6)}${pad(a.model, 18)}${stateColor}${pad(a.taskState, 8)}${A.reset} ${A.dim}${task}${A.reset}`
    );
  }
  if (agents.length > MAX_AGENT_ROWS) {
    writeln(`  ${A.dim}  … ${agents.length - MAX_AGENT_ROWS} more agents (use \`onxza status --company <co>\`)${A.reset}`);
  }
  writeln('');
}

function renderTicketKanban(tickets) {
  writeln(sectionHeader('TICKET KANBAN', A.magenta));
  const cols = [
    { label: 'OPEN',             count: tickets.open,            color: A.white  },
    { label: 'IN-PROGRESS',      count: tickets.inProgress,      color: A.cyan   },
    { label: 'PENDING-APPROVAL', count: tickets.pendingApproval, color: A.yellow },
    { label: 'BLOCKED',          count: tickets.blocked,         color: A.red    },
    { label: 'CLOSED',           count: tickets.closed,          color: A.green  },
  ];
  const colW = Math.floor((Math.min(termWidth - 4, 100)) / cols.length);

  // Header row
  let headerLine = '  ';
  for (const col of cols) {
    headerLine += col.color + A.bold + pad(col.label, colW) + A.reset;
  }
  writeln(headerLine);

  // Count row
  let countLine = '  ';
  for (const col of cols) {
    const numStr = String(col.count);
    const bar    = col.count > 0
      ? col.color + '█'.repeat(Math.min(col.count, colW - numStr.length - 2)) + A.reset
      : A.gray + '—' + A.reset;
    countLine += col.color + A.bold + pad(numStr, 6) + A.reset + bar + ' '.repeat(Math.max(0, colW - 6 - Math.min(col.count, colW - numStr.length - 2)));
  }
  writeln(countLine);

  // Priority breakdown for open
  writeln('');
  writeln(`  ${A.gray}Open by priority:  ${
    A.red}!!! ${tickets.openByPriority.critical}${A.reset}  ${
    A.yellow}!!  ${tickets.openByPriority.high}${A.reset}  ${
    A.white}!   ${tickets.openByPriority.medium}${A.reset}  ${
    A.gray}·   ${tickets.openByPriority.low}${A.reset}`);
  writeln('');
}

function renderHealthBar(health, agents) {
  const hc = health.label === 'HEALTHY' ? A.green : health.label === 'DEGRADED' ? A.yellow : A.red;
  const agentActive = `${A.green}${agents.active} active${A.reset}`;
  const agentIdle   = `${A.gray}${agents.idle} idle${A.reset}`;
  writeln(
    `  ${hc}${A.bold}${health.label}${A.reset}  ${scoreBar(health.score, 20)}  ${health.score}/100    ` +
    `Agents: ${A.cyan}${agents.total}${A.reset} (${agentActive}, ${agentIdle})    ` +
    `${A.dim}${new Date().toLocaleTimeString()}${A.reset}`
  );
}

function renderLogPanel() {
  writeln(sectionHeader('LOG TAIL', A.gray));
  const lines = logBuffer.slice(-LOG_LINES);
  if (lines.length === 0) {
    writeln(`  ${A.dim}No activity yet. Log entries appear here as agents run tasks.${A.reset}`);
  } else {
    for (const l of lines) {
      writeln(`  ${A.dim}${truncate(l, termWidth - 4)}${A.reset}`);
    }
  }
  writeln('');
}

function renderHelp() {
  writeln(`  ${A.gray}[q] quit  [r] refresh  [a] agents  [t] tickets  [l] logs  [↑↓] scroll${A.reset}`);
}

/**
 * Main render pass — draws the full dashboard to stdout.
 */
function render(snap, activePanel = 'all') {
  // Update terminal size
  termWidth  = process.stdout.columns  || 120;
  termHeight = process.stdout.rows     || 40;

  write(A.home + A.clear);

  // Title bar
  writeln(`  ${A.bgDark}${A.bold}${A.cyan} ONXZA Mission Control${A.reset}${A.bgDark}  v0.1.0${A.reset}  ${A.dim}Press [q] to quit, [r] to refresh${A.reset}`);
  writeln(divider('═'));
  writeln('');

  // Health bar
  renderHealthBar(snap.health, snap.agents);
  writeln('');
  writeln(divider());

  const panels = activePanel === 'all'
    ? ['agents', 'tickets', 'logs']
    : [activePanel];

  for (const panel of panels) {
    if (panel === 'agents')  renderAgentBoard(snap.agentList, activePanel);
    if (panel === 'tickets') renderTicketKanban(snap.tickets);
    if (panel === 'logs')    renderLogPanel();
  }

  writeln(divider());
  renderHelp();
}

// ---------------------------------------------------------------------------
// File watcher — watches the tickets directory for changes
// ---------------------------------------------------------------------------

function setupFileWatcher(ticketsRoot, onUpdate) {
  if (!fs.existsSync(ticketsRoot)) return null;
  try {
    const watcher = fs.watch(ticketsRoot, { recursive: true }, (event, filename) => {
      if (filename && filename.endsWith('.md')) {
        appendLog(`File changed: ${filename}`);
        onUpdate();
      }
    });
    return watcher;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Keyboard input
// ---------------------------------------------------------------------------

function setupInput(onKey) {
  if (!process.stdin.isTTY) return null;
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (str, key) => {
    if (key) onKey(key);
  });
  return process.stdin;
}

// ---------------------------------------------------------------------------
// Public: launch the TUI
// ---------------------------------------------------------------------------

/**
 * Launch the interactive TUI dashboard. Blocking — takes over the terminal.
 * Returns when the user quits with 'q'.
 * @param {object} options
 * @param {boolean} options.noColor
 * @param {boolean} options.noWatch
 */
function launch(options = {}) {
  if (!process.stdout.isTTY) {
    console.error('onxza dashboard requires an interactive terminal (TTY). Use `onxza status` for non-TTY output.');
    process.exitCode = 1;
    return;
  }

  const ONXZA_WORKSPACE = process.env.ONXZA_WORKSPACE
    || path.join(os.homedir(), '.openclaw', 'workspace');
  const ticketsRoot = path.join(ONXZA_WORKSPACE, 'tickets');

  let activePanel  = 'all';
  let snap         = null;
  let refreshTimer = null;
  let watcher      = null;

  function refresh() {
    try {
      snap = getSystemHealth();
      render(snap, activePanel);
    } catch (err) {
      // Render error gracefully inside TUI
      write(A.home);
      writeln(`  ${A.red}Dashboard render error: ${err.message}${A.reset}`);
    }
  }

  function cleanup() {
    if (refreshTimer) clearInterval(refreshTimer);
    if (watcher) watcher.close();
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    write(A.showCursor + A.normalScreen);
    process.stdout.write('\n');
  }

  // Enter alt screen, hide cursor
  write(A.altScreen + A.hideCursor);
  appendLog('ONXZA Mission Control started');

  // Initial render
  refresh();

  // Auto-refresh timer
  refreshTimer = setInterval(refresh, REFRESH_MS);

  // File watcher
  if (!options.noWatch) {
    watcher = setupFileWatcher(ticketsRoot, () => {
      clearInterval(refreshTimer);
      setTimeout(() => {
        refresh();
        refreshTimer = setInterval(refresh, REFRESH_MS);
      }, 300); // debounce
    });
  }

  // Resize handler
  process.stdout.on('resize', () => {
    termWidth  = process.stdout.columns  || 120;
    termHeight = process.stdout.rows     || 40;
    if (snap) render(snap, activePanel);
  });

  // Keyboard input
  setupInput((key) => {
    const k = key.name || '';
    const sequence = key.sequence || '';

    if (k === 'q' || (key.ctrl && k === 'c')) {
      cleanup();
      process.exit(0);
    }

    if (k === 'r') {
      appendLog('Manual refresh triggered');
      refresh();
    }

    if (k === 'a') { activePanel = activePanel === 'agents'  ? 'all' : 'agents';  refresh(); }
    if (k === 't') { activePanel = activePanel === 'tickets' ? 'all' : 'tickets'; refresh(); }
    if (k === 'l') { activePanel = activePanel === 'logs'    ? 'all' : 'logs';    refresh(); }

    if (k === 'escape' || k === '0') { activePanel = 'all'; refresh(); }
  });

  // Ensure cleanup on exit
  process.on('exit',    cleanup);
  process.on('SIGINT',  () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
}

module.exports = { launch, appendLog };

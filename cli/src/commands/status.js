'use strict';

/**
 * onxza status — System health snapshot.
 *
 * Shows: agent counts by state, ticket counts by status/priority, health score.
 * Reads live data from openclaw.json + MEMORY.md files + ticket directories.
 *
 * ARCHITECTURE.md §12.3 · mission-control-spec.md · TICKET-20260318-DTP-008
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const { Command }  = require('commander');
const { outputJson, isJsonMode } = require('../util');
const { getSystemHealth } = require('../system/health');

// ---------------------------------------------------------------------------
// ANSI helpers (no deps)
// ---------------------------------------------------------------------------
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
  gray:   '\x1b[90m',
};

function healthColor(label) {
  if (label === 'HEALTHY')  return C.green;
  if (label === 'DEGRADED') return C.yellow;
  return C.red;
}

function scoreBar(score, width = 20) {
  const filled = Math.round((score / 100) * width);
  const empty  = width - filled;
  const color  = score >= 85 ? C.green : score >= 60 ? C.yellow : C.red;
  return color + '█'.repeat(filled) + C.gray + '░'.repeat(empty) + C.reset;
}

function pad(str, len) {
  const s = String(str || '');
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
}

// ---------------------------------------------------------------------------
// Status command
// ---------------------------------------------------------------------------

const statusCmd = new Command('status')
  .description('Show ONXZA system status: agents, tickets, health')
  .option('--agent <id>', 'Show details for a specific agent')
  .option('--company <name>', 'Filter agent view by company')
  .option('--no-color', 'Disable color output')
  .action((options, cmd) => {
    const jsonMode  = isJsonMode(cmd);
    const useColor  = process.stdout.isTTY && options.color !== false;
    const c         = useColor ? C : Object.fromEntries(Object.keys(C).map((k) => [k, '']));

    const snap = getSystemHealth();

    // --json mode
    if (jsonMode) {
      // Strip agentList from JSON (verbose — use onxza status --agent for detail)
      const { agentList, ...rest } = snap;
      outputJson({ ...rest, agentCount: agentList.length });
      return;
    }

    // --agent filter
    if (options.agent) {
      const found = snap.agentList.find((a) => a.id === options.agent);
      if (!found) {
        console.log(`\n  Agent "${options.agent}" not found.\n`);
        process.exitCode = 1;
        return;
      }
      console.log('');
      console.log(`  ${c.bold}Agent: ${found.id}${c.reset}`);
      console.log(`  ────────────────────────────────`);
      console.log(`  Company:    ${found.company}`);
      console.log(`  Model:      ${found.model}`);
      console.log(`  Task State: ${found.taskState === 'ACTIVE' ? c.green : c.gray}${found.taskState}${c.reset}`);
      if (found.taskId) console.log(`  Task ID:    ${found.taskId}`);
      console.log(`  Workspace:  ${found.workspace}`);
      console.log('');
      return;
    }

    const { health, agents, tickets } = snap;
    const hc = healthColor(health.label);

    console.log('');
    console.log(`  ${c.bold}ONXZA v0.1.0 — System Status${c.reset}   ${new Date(snap.timestamp).toLocaleTimeString()}`);
    console.log(`  ${'─'.repeat(58)}`);

    // Health bar
    console.log(`  Health   ${scoreBar(health.score, 24)}  ${hc}${c.bold}${health.label}${c.reset} (${health.score}/100)`);
    console.log('');

    // Agents panel
    console.log(`  ${c.bold}Agents${c.reset}   ${c.cyan}${agents.total}${c.reset} registered`);
    console.log(`  ${c.gray}${'─'.repeat(36)}${c.reset}`);
    console.log(`  ${c.green}● ACTIVE ${c.reset}  ${String(agents.active).padStart(4)}   ${c.dim}running a task${c.reset}`);
    console.log(`  ${c.gray}○ IDLE   ${c.reset}  ${String(agents.idle).padStart(4)}   ${c.dim}waiting${c.reset}`);
    if (agents.unknown > 0) {
      console.log(`  ${c.yellow}? UNKNOWN${c.reset}  ${String(agents.unknown).padStart(4)}   ${c.dim}no MEMORY.md or unreadable${c.reset}`);
    }

    // Company breakdown
    const companies = Object.entries(agents.byCompany).sort((a, b) => b[1].total - a[1].total);
    if (companies.length > 0) {
      console.log('');
      console.log(`  ${c.gray}By company:${c.reset}`);
      for (const [co, s] of companies) {
        const activeStr = s.active > 0 ? ` ${c.green}${s.active} active${c.reset}` : '';
        console.log(`  ${c.gray}│${c.reset} ${pad(co, 6)} ${c.cyan}${String(s.total).padStart(3)}${c.reset}${activeStr}`);
      }
    }

    // Filter by company if requested
    if (options.company) {
      const filtered = snap.agentList.filter((a) => a.company.toLowerCase() === options.company.toLowerCase());
      if (filtered.length > 0) {
        console.log('');
        console.log(`  ${c.bold}${options.company} agents (${filtered.length}):${c.reset}`);
        for (const a of filtered.slice(0, 20)) {
          const stateIcon = a.taskState === 'ACTIVE' ? `${c.green}●${c.reset}` : `${c.gray}○${c.reset}`;
          const task      = a.taskId ? ` ${c.dim}${a.taskId.slice(0, 32)}${c.reset}` : '';
          console.log(`  ${stateIcon} ${pad(a.id, 32)} ${c.dim}${a.model}${c.reset}${task}`);
        }
        if (filtered.length > 20) console.log(`  ${c.dim}  … and ${filtered.length - 20} more${c.reset}`);
      }
    }

    console.log('');

    // Tickets panel
    console.log(`  ${c.bold}Tickets${c.reset}`);
    console.log(`  ${c.gray}${'─'.repeat(36)}${c.reset}`);

    const { open, inProgress, pendingApproval, blocked, closed, openByPriority } = tickets;
    console.log(`  ${c.white}○ Open            ${c.reset}${String(open).padStart(4)}`);
    console.log(`  ${c.cyan}◉ In-Progress     ${c.reset}${String(inProgress).padStart(4)}`);
    console.log(`  ${c.yellow}◈ Pending-Approval${c.reset}${String(pendingApproval).padStart(4)}`);
    console.log(`  ${c.red}✖ Blocked         ${c.reset}${String(blocked).padStart(4)}`);
    console.log(`  ${c.green}✓ Closed          ${c.reset}${String(closed).padStart(4)}`);

    if (open > 0) {
      console.log('');
      console.log(`  ${c.gray}Open by priority:${c.reset}`);
      if (openByPriority.critical > 0) console.log(`  ${c.red}  !!! Critical  ${String(openByPriority.critical).padStart(4)}${c.reset}`);
      if (openByPriority.high > 0)     console.log(`  ${c.yellow}  !!  High      ${String(openByPriority.high).padStart(4)}${c.reset}`);
      if (openByPriority.medium > 0)   console.log(`  ${c.white}  !   Medium    ${String(openByPriority.medium).padStart(4)}${c.reset}`);
      if (openByPriority.low > 0)      console.log(`  ${c.gray}      Low       ${String(openByPriority.low).padStart(4)}${c.reset}`);
    }

    if (blocked > 0) {
      console.log('');
      console.log(`  ${c.red}${c.bold}⚠  ${blocked} ticket${blocked !== 1 ? 's' : ''} blocked — run \`onxza tickets --status blocked\` to review.${c.reset}`);
    }

    console.log('');
    console.log(`  ${c.dim}Run \`onxza dashboard\` for the live TUI view.${c.reset}`);
    console.log('');
  });

module.exports = statusCmd;

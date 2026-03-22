'use strict';

/**
 * onxza tickets — Full ticket lifecycle CLI.
 *
 * Sub-commands:
 *   (default)               List tickets with filters
 *   create                  Scaffold a new ticket with correct frontmatter
 *   show <ticket-id>        Display full ticket detail
 *   move <ticket-id> <status>  Move ticket between lifecycle directories
 *
 * All 5 lifecycle statuses supported:
 *   open | in-progress | pending-approval | blocked | closed
 *
 * Naming convention enforced: TICKET-[YYYYMMDD]-[NNN]-[slug].md
 *
 * ARCHITECTURE.md §6 · §12.3 · TICKET-20260318-DTP-005
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const { Command }  = require('commander');
const { outputJson, isJsonMode } = require('../util');
const store        = require('../tickets/store');

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const STATUS_COLOR = {
  'open':             '○',
  'in-progress':      '◉',
  'pending-approval': '◈',
  'blocked':          '✖',
  'closed':           '✓',
};

const PRIORITY_BADGE = {
  critical: '!!!',
  high:     '!! ',
  medium:   '!  ',
  low:      '   ',
};

function priorityBadge(p) {
  return PRIORITY_BADGE[(p || '').toLowerCase()] || '   ';
}

function statusIcon(s) {
  return STATUS_COLOR[s] || '·';
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

function formatDate(iso) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Default action: list tickets
// ---------------------------------------------------------------------------

function listAction(options, cmd) {
  const jsonMode = isJsonMode(cmd);

  // Determine which statuses to load
  let tickets;
  if (options.all) {
    tickets = store.loadAll();
  } else {
    const statusFilter = options.status || 'open';
    tickets = store.loadByStatus(statusFilter);
  }

  // Apply additional filters
  tickets = store.applyFilters(tickets, {
    company:    options.company,
    assignedTo: options.assignedTo,
    priority:   options.priority,
    project:    options.project,
    type:       options.type,
  });

  // Sort: priority order then by id
  const PRIO_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  tickets.sort((a, b) => {
    const pa = PRIO_ORDER[(a.meta.priority || 'medium').toLowerCase()] ?? 2;
    const pb = PRIO_ORDER[(b.meta.priority || 'medium').toLowerCase()] ?? 2;
    if (pa !== pb) return pa - pb;
    return (a.id || '').localeCompare(b.id || '');
  });

  if (jsonMode) {
    outputJson({
      status: 'ok',
      count: tickets.length,
      filters: {
        status: options.all ? 'all' : (options.status || 'open'),
        company: options.company,
        assignedTo: options.assignedTo,
        priority: options.priority,
        project: options.project,
        type: options.type,
      },
      tickets: tickets.map((t) => ({
        id:          t.id,
        status:      t.status,
        priority:    t.meta.priority,
        type:        t.meta.type,
        company:     t.meta.company,
        project:     t.meta.project,
        assigned_to: t.meta.assigned_to,
        created_at:  t.meta.created_at,
        created_by:  t.meta.created_by,
        summary:     extractSummary(t.body),
        filename:    t.filename,
      })),
    });
    return;
  }

  if (tickets.length === 0) {
    const f = options.all ? 'all statuses' : (options.status || 'open');
    console.log(`\n  No tickets found (${f}).\n`);
    return;
  }

  const statusLabel = options.all ? 'All' : titleCase(options.status || 'open');
  console.log('');
  console.log(`  Tickets — ${statusLabel} (${tickets.length})`);
  console.log('  ─────────────────────────────────────────────────────────────────────');

  const idW  = 36;
  const priW = 5;
  const coW  = 6;
  const asW  = 22;

  console.log(
    `  ${''.padEnd(2)}${priorityBadge('!  ')}${'ID'.padEnd(idW)}${'PRI'.padEnd(priW)}${'CO'.padEnd(coW)}${'ASSIGNED'.padEnd(asW)}SUMMARY`
  );
  console.log('  ' + '─'.repeat(idW + priW + coW + asW + 24));

  for (const t of tickets) {
    const icon    = statusIcon(t.status);
    const pri     = priorityBadge(t.meta.priority);
    const co      = truncate(t.meta.company || '', coW - 1).padEnd(coW);
    const assigned = truncate(t.meta.assigned_to || '—', asW - 1).padEnd(asW);
    const summary = truncate(extractSummary(t.body) || t.id, 55);
    const id      = truncate(t.id, idW - 1).padEnd(idW);
    console.log(`  ${icon} ${pri}${id}${(t.meta.priority || '').slice(0, priW - 1).padEnd(priW)}${co}${assigned}${summary}`);
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// show
// ---------------------------------------------------------------------------

function showAction(ticketId, options, cmd) {
  const jsonMode = isJsonMode(cmd);

  const ticket = store.findById(ticketId);
  if (!ticket) {
    const err = { status: 'not_found', id: ticketId, message: `Ticket "${ticketId}" not found.` };
    if (jsonMode) { outputJson(err); } else { console.log(`\n  ✗ ${err.message}\n`); }
    process.exitCode = 1;
    return;
  }

  if (jsonMode) {
    outputJson({
      status: 'ok',
      id:          ticket.id,
      status_val:  ticket.status,
      filename:    ticket.filename,
      filePath:    ticket.filePath,
      meta:        ticket.meta,
      body:        ticket.body,
      summary:     extractSummary(ticket.body),
    });
    return;
  }

  const m = ticket.meta;
  console.log('');
  console.log(`  ┌─ ${ticket.id}`);
  console.log(`  │  Status:    ${statusIcon(ticket.status)} ${ticket.status}`);
  console.log(`  │  Type:      ${m.type || '—'}`);
  console.log(`  │  Priority:  ${m.priority || '—'}`);
  console.log(`  │  Company:   ${m.company || '—'}`);
  console.log(`  │  Project:   ${m.project || '—'}`);
  console.log(`  │  Assigned:  ${m.assigned_to || '—'}`);
  console.log(`  │  Created:   ${formatDate(m.created_at)} by ${m.created_by || '—'}`);
  if (m.parent_ticket && m.parent_ticket !== 'null') {
    console.log(`  │  Parent:    ${m.parent_ticket}`);
  }
  console.log(`  │  File:      ${ticket.filePath}`);
  console.log(`  └─────────────────────────────────────────────────────`);
  console.log('');

  // Print body sections
  const sections = ticket.body.split(/\n(?=## )/);
  for (const section of sections) {
    const lines = section.trim().split('\n');
    if (!lines[0]) continue;
    console.log(`  ${lines[0]}`);
    for (const l of lines.slice(1)) {
      if (l.trim()) console.log(`    ${l}`);
    }
    console.log('');
  }
}

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

function createAction(options, cmd) {
  const jsonMode = isJsonMode(cmd);

  // Use cmd.opts() to get this subcommand's own resolved options.
  // (ticketsCmd uses passThroughOptions so parent options don't shadow children.)
  const opts = cmd && cmd.opts ? cmd.opts() : options;

  // Require summary as minimum
  if (!opts.summary) {
    const err = {
      status: 'validation_error',
      message: 'Summary is required. Use --summary "What this ticket is about"',
    };
    if (jsonMode) { outputJson(err); } else { console.log(`\n  ✗ ${err.message}\n`); }
    process.exitCode = 1;
    return;
  }

  try {
    const { ticket, filePath } = store.createTicket({
      summary:            opts.summary,
      slug:               opts.slug || opts.summary,
      type:               opts.type || 'task',
      assigned_to:        opts.assignedTo || '',
      project:            opts.project || '',
      company:            opts.company || '',
      priority:           opts.priority || 'medium',
      requires_aaron:     opts.requiresAaron ? 'true' : 'false',
      parent_ticket:      opts.parent || 'null',
      related_vision:     opts.vision || '',
      context:            opts.context || '',
      action:             opts.action || '',
      vision_alignment:   opts.visionAlignment || '',
      dependencies:       opts.dependencies || '',
      acceptance_criteria: opts.acceptanceCriteria || '',
    });

    if (jsonMode) {
      outputJson({
        status: 'created',
        id:       ticket.id,
        filename: ticket.filename,
        filePath,
        meta:     ticket.meta,
      });
    } else {
      console.log('');
      console.log(`  ✓ Ticket created: ${ticket.id}`);
      console.log(`    File: ${filePath}`);
      console.log(`    Status: open | Priority: ${options.priority || 'medium'}`);
      console.log('');
    }
  } catch (err) {
    if (jsonMode) {
      outputJson({ status: 'error', message: err.message });
    } else {
      console.log(`\n  ✗ ${err.message}\n`);
    }
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// move
// ---------------------------------------------------------------------------

function moveAction(ticketId, newStatus, options, cmd) {
  const jsonMode = isJsonMode(cmd);

  const ticket = store.findById(ticketId);
  if (!ticket) {
    const err = { status: 'not_found', id: ticketId, message: `Ticket "${ticketId}" not found.` };
    if (jsonMode) { outputJson(err); } else { console.log(`\n  ✗ ${err.message}\n`); }
    process.exitCode = 1;
    return;
  }

  if (ticket.status === newStatus) {
    const msg = `Ticket "${ticketId}" is already ${newStatus}.`;
    if (jsonMode) {
      outputJson({ status: 'no_change', id: ticketId, message: msg });
    } else {
      console.log(`\n  ⚠  ${msg}\n`);
    }
    return;
  }

  try {
    const result = store.moveTicket(ticket, newStatus);
    if (jsonMode) {
      outputJson({
        status: 'moved',
        id:      ticketId,
        from:    ticket.status,
        to:      newStatus,
        newPath: result.newPath,
        oldPath: result.oldPath,
      });
    } else {
      console.log('');
      console.log(`  ✓ Moved: ${ticketId}`);
      console.log(`    ${ticket.status} → ${newStatus}`);
      console.log(`    ${result.newPath}`);
      console.log('');
    }
  } catch (err) {
    if (jsonMode) {
      outputJson({ status: 'error', message: err.message });
    } else {
      console.log(`\n  ✗ ${err.message}\n`);
    }
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function extractSummary(body) {
  if (!body) return '';
  const m = body.match(/^## Summary\s*\n+([\s\S]*?)(?:\n## |\n*$)/m);
  if (m) return m[1].trim().replace(/\n/g, ' ');
  return body.split('\n').find((l) => l.trim() && !l.startsWith('#')) || '';
}

function titleCase(s) {
  return s.replace(/(^|\s|-)\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Command definitions
// ---------------------------------------------------------------------------

const ticketsCmd = new Command('tickets')
  .description('List and manage ONXZA tickets')
  // passThroughOptions ensures subcommand options are not consumed by this parent command.
  .passThroughOptions()
  // Default action: list
  .option('--status <status>', 'Filter by status: open | in-progress | pending-approval | blocked | closed', 'open')
  .option('--all', 'Show tickets across all statuses')
  .option('--company <name>', 'Filter by company (e.g. DTP, WDC, MGA)')
  .option('--assigned-to <agent-id>', 'Filter by assigned agent')
  .option('--priority <level>', 'Filter by priority: critical | high | medium | low')
  .option('--project <slug>', 'Filter by project slug')
  .option('--type <type>', 'Filter by ticket type (task, escalation, etc.)')
  .action(listAction);

ticketsCmd
  .command('show <ticket-id>')
  .description('Display full ticket detail')
  .action(showAction);

ticketsCmd
  .command('create')
  .description('Scaffold a new ticket with correct frontmatter and naming convention')
  .requiredOption('--summary <text>', 'Ticket summary (one sentence)')
  .option('--slug <slug>', 'Filename slug (derived from summary if omitted)')
  .option('--type <type>', 'Ticket type (default: task)', 'task')
  .option('--assigned-to <agent-id>', 'Agent to assign the ticket to')
  .option('--priority <level>', 'Priority: critical | high | medium | low (default: medium)', 'medium')
  .option('--company <name>', 'Company (DTP | WDC | MGA | ...)')
  .option('--project <slug>', 'Project slug')
  .option('--parent <ticket-id>', 'Parent ticket ID')
  .option('--vision <path>', 'Related vision.md path')
  .option('--requires-aaron', 'Flag ticket as requiring Aaron approval')
  .option('--context <text>', 'Context section content')
  .option('--action <text>', 'Requested action section content')
  .option('--vision-alignment <text>', 'Vision alignment note')
  .option('--dependencies <text>', 'Dependencies list')
  .option('--acceptance-criteria <text>', 'Acceptance criteria')
  .action(createAction);

ticketsCmd
  .command('move <ticket-id> <status>')
  .description('Move a ticket to a new status directory (updates frontmatter)')
  .addHelpText('after', `\nValid statuses: ${store.VALID_STATUSES.join(' | ')}`)
  .action(moveAction);

ticketsCmd
  .command('close <ticket-id>')
  .description('Close a ticket (moves to tickets/closed/ with completion note)')
  .option('--note <text>', 'Completion note to append to the ticket')
  .action((ticketId, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const ticket   = store.findById(ticketId);
    if (!ticket) {
      const err = { status: 'not_found', id: ticketId };
      if (jsonMode) { outputJson(err); } else { console.log(`\n  ✗ Ticket "${ticketId}" not found.\n`); }
      process.exitCode = 1;
      return;
    }
    if (options.note) {
      // Append completion note before moving
      const fs     = require('fs');
      const append = `\n## Completion Note\nClosed ${new Date().toISOString().slice(0,10)} by CLI.\n${options.note}\n`;
      fs.appendFileSync(ticket.filePath, append, 'utf8');
    }
    const result = store.moveTicket(ticket, 'closed');
    if (jsonMode) {
      outputJson({ status: 'closed', id: ticket.id, newPath: result.newPath });
      return;
    }
    console.log(`\n  ✓ Ticket closed: ${ticket.id}`);
    console.log(`    Moved to: tickets/closed/\n`);
  });

module.exports = ticketsCmd;

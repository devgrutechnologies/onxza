/**
 * onxza ticket — Ticket system sub-commands.
 *
 * Sub-commands:
 *   list   List tickets with status/company filters
 *   show   Display full ticket detail
 *
 * Spec: ARCHITECTURE-v0.1.md §6.3, §7.7, §7.8
 *
 * Valid statuses: open | in-progress | pending-approval | blocked | closed
 *
 * Core dependency: @onxza/core/ticket — NOT YET BUILT.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command } from 'commander';
import { setOutputContext, exitValidationError } from '../util/output.js';

const VALID_STATUSES = ['open', 'in-progress', 'pending-approval', 'blocked', 'closed', 'all'] as const;
type TicketStatus = typeof VALID_STATUSES[number];

// ---------------------------------------------------------------------------
// ticket list
// ---------------------------------------------------------------------------

function makeTicketListCommand(): Command {
  return new Command('list')
    .description('List tickets with optional filters')
    .option('--status <status>',
      `Filter by status: ${VALID_STATUSES.join(' | ')}`, 'open')
    .option('--company <slug>',
      'Filter by company slug')
    .option('--assigned-to <agent-id>',
      'Filter by assigned agent ID')
    .option('--priority <level>',
      'Filter by priority: low | medium | high | critical')
    .option('--json',
      'Output tickets array as JSON')
    .action(async (opts) => {
      setOutputContext({ json: !!opts.json });

      const status = opts.status as string;
      if (!VALID_STATUSES.includes(status as TicketStatus)) {
        exitValidationError(
          `Invalid status "${status}". Valid values: ${VALID_STATUSES.join(', ')}`
        );
      }

      // TODO: import { listTickets } from '@onxza/core';
      // const tickets = await listTickets({ status, company: opts.company, assignedTo: opts.assignedTo, priority: opts.priority });

      _notYetImplemented('ticket list', {
        filter: {
          status, company: opts.company ?? null,
          assignedTo: opts.assignedTo ?? null,
          priority: opts.priority ?? null,
        },
        outputShape: {
          json: '{ tickets: TicketMeta[], total: number }',
          table: 'ID | Status | Priority | Assigned To | Company',
        },
        note: 'Reads YAML frontmatter from all ticket .md files across all status directories',
      });
    });
}

// ---------------------------------------------------------------------------
// ticket show
// ---------------------------------------------------------------------------

function makeTicketShowCommand(): Command {
  return new Command('show')
    .description('Display full ticket detail')
    .argument('<ticket-id>',
      'Ticket ID (e.g. TICKET-20260318-DTP-027) or partial match')
    .option('--json', 'Machine-readable JSON output')
    .action(async (ticketId: string, opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { showTicket } from '@onxza/core';
      // const ticket = await showTicket({ ticketId });

      _notYetImplemented('ticket show', {
        ticketId,
        note: 'Renders full markdown body + syntax-highlighted YAML frontmatter',
        outputShape: '{ id, status, priority, assignedTo, company, meta: {}, body: string }',
      });
    });
}

// ---------------------------------------------------------------------------
// Root: onxza ticket
// ---------------------------------------------------------------------------

export function makeTicketCommand(): Command {
  const cmd = new Command('ticket')
    .description('Manage ONXZA tickets')
    // Also support bare `onxza tickets` (plural alias added in index.ts)
    .alias('tickets');

  cmd.addCommand(makeTicketListCommand());
  cmd.addCommand(makeTicketShowCommand());

  return cmd;
}

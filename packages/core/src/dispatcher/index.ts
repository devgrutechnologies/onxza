/**
 * @onxza/core — Dispatcher cron logic
 * Scans open tickets and routes them to assigned agents.
 * Per ARCHITECTURE-v0.1.md §8.4.
 *
 * The dispatcher is NOT a long-running daemon — it is a function that runs
 * on each cron tick (every N minutes via OpenClaw cron).
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { DispatchResult } from '../types.js';
import { getWorkspacePath, readConfig } from '../config/index.js';
import { listTickets } from '../ticket/index.js';

// ── Dispatch log ───────────────────────────────────────────────────────────────

function getDispatchLogPath(root?: string): string {
  return join(getWorkspacePath(root), 'logs', 'dispatch-log.jsonl');
}

function appendDispatchLog(entry: Record<string, unknown>, root?: string): void {
  const logPath = getDispatchLogPath(root);
  mkdirSync(join(logPath, '..'), { recursive: true });
  appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8');
}

// ── Dispatch one ticket ────────────────────────────────────────────────────────

export interface DispatchOptions {
  dryRun?: boolean;
  notifyFn?: (agentId: string, ticketId: string, ticketSummary: string) => Promise<void> | void;
  root?: string;
}

/**
 * Run one dispatcher cycle:
 * 1. Read all open tickets
 * 2. For each with assigned_to set: attempt delivery
 * 3. Return dispatch results
 *
 * In v0.1, "delivery" means writing a dispatch log entry.
 * Actual OpenClaw session notification is done by the cron wrapper script.
 */
export async function runDispatchCycle(options: DispatchOptions = {}): Promise<DispatchResult[]> {
  const { dryRun = false, notifyFn, root } = options;
  const config = readConfig(root);

  // Respect dispatcher.enabled flag
  if (config && config.dispatcher?.enabled === false) {
    return [];
  }

  const openTickets = listTickets({ status: 'open', root });
  const results: DispatchResult[] = [];
  const now = new Date().toISOString();

  for (const ticket of openTickets) {
    const assignedTo = ticket.frontmatter.assigned_to;

    if (!assignedTo) {
      results.push({
        ticketId: ticket.id,
        assignedTo: '',
        status: 'skipped',
        reason: 'No assigned_to field',
      });
      continue;
    }

    // Check if agent is registered
    const agentExists = config?.agents.list.some((a) => a.id === assignedTo) ?? false;
    if (!agentExists) {
      results.push({
        ticketId: ticket.id,
        assignedTo,
        status: 'error',
        reason: `Agent '${assignedTo}' not registered in openclaw.json`,
      });
      continue;
    }

    if (dryRun) {
      results.push({ ticketId: ticket.id, assignedTo, status: 'dispatched' });
      continue;
    }

    // Attempt notification
    try {
      if (notifyFn) {
        await notifyFn(
          assignedTo,
          ticket.id,
          ticket.frontmatter.summary ?? `Ticket ${ticket.id}`
        );
      }

      // Log to dispatch-log.jsonl
      appendDispatchLog({
        timestamp: now,
        ticket_id: ticket.id,
        assigned_to: assignedTo,
        dispatch_method: 'onxza-dispatcher',
        status: 'dispatched',
        summary: ticket.frontmatter.summary ?? '',
      }, root);

      results.push({ ticketId: ticket.id, assignedTo, status: 'dispatched' });
    } catch (err) {
      results.push({
        ticketId: ticket.id,
        assignedTo,
        status: 'error',
        reason: String(err),
      });
    }
  }

  return results;
}

// ── Dispatcher status ──────────────────────────────────────────────────────────

export interface DispatcherStatus {
  enabled: boolean;
  scanIntervalMinutes: number;
  pendingTickets: number;
  assignedTickets: number;
  unassignedTickets: number;
}

export function getDispatcherStatus(root?: string): DispatcherStatus {
  const config = readConfig(root);
  const openTickets = listTickets({ status: 'open', root });

  const assigned = openTickets.filter((t) => !!t.frontmatter.assigned_to);
  const unassigned = openTickets.filter((t) => !t.frontmatter.assigned_to);

  return {
    enabled: config?.dispatcher?.enabled ?? true,
    scanIntervalMinutes: config?.dispatcher?.scanIntervalMinutes ?? 5,
    pendingTickets: openTickets.length,
    assignedTickets: assigned.length,
    unassignedTickets: unassigned.length,
  };
}

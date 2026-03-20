/**
 * @onxza/core — Ticket CRUD operations
 * Reads, creates, moves, and queries tickets.
 * Tickets are YAML-frontmatter markdown files per ARCHITECTURE-v0.1.md §6.3.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  existsSync,
  mkdirSync,
} from 'fs';
import { join, basename, dirname } from 'path';
import type {
  ParsedTicket,
  TicketFrontmatter,
  TicketStatus,
  TicketPriority,
  TicketType,
} from '../types.js';
import { TICKET_STATUSES, CREDIT_LINE } from '../types.js';
import { getWorkspacePath } from '../config/index.js';

// ── Ticket base path ───────────────────────────────────────────────────────────

export function getTicketsDir(root?: string): string {
  return join(getWorkspacePath(root), 'tickets');
}

export function getTicketStatusDir(status: TicketStatus, root?: string): string {
  return join(getTicketsDir(root), status);
}

// ── Frontmatter parsing ────────────────────────────────────────────────────────

export function parseTicketFrontmatter(content: string): TicketFrontmatter | null {
  const lines = content.split('\n');
  let inFm = false;
  let fmLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFm) { inFm = true; continue; }
      else break;
    }
    if (inFm) fmLines.push(line);
  }

  if (fmLines.length === 0) return null;

  // Simple key: value parser (handles string, bool, null)
  const fm: Record<string, unknown> = {};
  for (const line of fmLines) {
    const m = line.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*):\s*(.*)$/);
    if (!m?.[1]) continue;
    const key = m[1];
    const raw = (m[2] ?? '').trim();

    if (raw === 'true') fm[key] = true;
    else if (raw === 'false') fm[key] = false;
    else if (raw === 'null' || raw === '') fm[key] = null;
    else fm[key] = raw;
  }

  // Validate required fields
  if (!fm['id'] || !fm['type'] || !fm['status']) return null;

  return fm as unknown as TicketFrontmatter;
}

export function extractTicketBody(content: string): string {
  // Skip the YAML frontmatter block
  const parts = content.split(/^---\s*$/m);
  if (parts.length >= 3) {
    return parts.slice(2).join('---\n').trim();
  }
  return content.trim();
}

// ── Read single ticket ─────────────────────────────────────────────────────────

export function readTicket(filePath: string): ParsedTicket | null {
  if (!existsSync(filePath)) return null;

  const content = readFileSync(filePath, 'utf-8');
  const frontmatter = parseTicketFrontmatter(content);
  if (!frontmatter) return null;

  // Determine status from directory name
  const dir = dirname(filePath);
  const dirName = basename(dir) as TicketStatus;
  const status = TICKET_STATUSES.includes(dirName) ? dirName : frontmatter.status;

  return {
    id: frontmatter.id,
    frontmatter: { ...frontmatter, status },
    body: extractTicketBody(content),
    filePath,
    directory: status,
  };
}

// ── List tickets ───────────────────────────────────────────────────────────────

export interface TicketListOptions {
  status?: TicketStatus | 'all';
  company?: string;
  assignedTo?: string;
  priority?: TicketPriority;
  type?: TicketType;
  requiresAaron?: boolean;
  root?: string;
}

export function listTickets(options: TicketListOptions = {}): ParsedTicket[] {
  const { status = 'all', company, assignedTo, priority, type, requiresAaron, root } = options;
  const ticketsDir = getTicketsDir(root);

  const statusDirs: TicketStatus[] = status === 'all' ? TICKET_STATUSES : [status as TicketStatus];
  const results: ParsedTicket[] = [];

  for (const statusDir of statusDirs) {
    const dir = join(ticketsDir, statusDir);
    if (!existsSync(dir)) continue;

    for (const fname of readdirSync(dir)) {
      if (!fname.endsWith('.md')) continue;
      const ticket = readTicket(join(dir, fname));
      if (!ticket) continue;

      // Apply filters
      if (company && ticket.frontmatter.company !== company) continue;
      if (assignedTo && ticket.frontmatter.assigned_to !== assignedTo) continue;
      if (priority && ticket.frontmatter.priority !== priority) continue;
      if (type && ticket.frontmatter.type !== type) continue;
      if (requiresAaron !== undefined && ticket.frontmatter.requires_aaron !== requiresAaron) continue;

      results.push(ticket);
    }
  }

  // Sort by created_at descending
  return results.sort((a, b) =>
    (b.frontmatter.created_at ?? '').localeCompare(a.frontmatter.created_at ?? '')
  );
}

// ── Find ticket by ID ──────────────────────────────────────────────────────────

export function findTicketById(ticketId: string, root?: string): ParsedTicket | null {
  const ticketsDir = getTicketsDir(root);

  for (const statusDir of TICKET_STATUSES) {
    const dir = join(ticketsDir, statusDir);
    if (!existsSync(dir)) continue;

    for (const fname of readdirSync(dir)) {
      if (!fname.startsWith(ticketId) && !fname.includes(ticketId)) continue;
      if (!fname.endsWith('.md')) continue;
      const ticket = readTicket(join(dir, fname));
      if (ticket?.id === ticketId) return ticket;
    }
  }
  return null;
}

// ── Ticket ID generation ───────────────────────────────────────────────────────

/**
 * Generate the next sequential ticket ID for today + company.
 * Format: TICKET-YYYYMMDD-COMPANY-NNN
 */
export function generateTicketId(company: string, root?: string): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `TICKET-${today}-${company}`;
  const ticketsDir = getTicketsDir(root);

  let maxSeq = 0;
  for (const statusDir of TICKET_STATUSES) {
    const dir = join(ticketsDir, statusDir);
    if (!existsSync(dir)) continue;

    for (const fname of readdirSync(dir)) {
      const m = fname.match(new RegExp(`^${prefix}-(\\d+)`));
      if (m?.[1]) {
        const seq = parseInt(m[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}-${nextSeq}`;
}

// ── Create ticket ──────────────────────────────────────────────────────────────

export interface CreateTicketOptions {
  type: TicketType;
  summary: string;
  context?: string;
  requestedAction?: string;
  createdBy: string;
  assignedTo: string;
  project?: string;
  company?: string;
  priority?: TicketPriority;
  requiresAaron?: boolean;
  parentTicket?: string;
  relatedVision?: string;
  additionalFrontmatter?: Record<string, unknown>;
  root?: string;
}

export function createTicket(options: CreateTicketOptions): ParsedTicket {
  const {
    type,
    summary,
    context = '',
    requestedAction = '',
    createdBy,
    assignedTo,
    project,
    company = '',
    priority = 'medium',
    requiresAaron = false,
    parentTicket,
    relatedVision,
    additionalFrontmatter = {},
    root,
  } = options;

  const ticketId = generateTicketId(company || 'GEN', root);
  const now = new Date().toISOString();
  const slug = summary
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);

  const frontmatter: TicketFrontmatter = {
    id: ticketId,
    type,
    created_by: createdBy,
    created_at: now,
    assigned_to: assignedTo,
    project,
    company,
    priority,
    status: 'open',
    requires_aaron: requiresAaron,
    parent_ticket: parentTicket ?? null,
    related_vision: relatedVision,
    ...additionalFrontmatter,
  };

  const fmLines = Object.entries(frontmatter)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      if (v === null) return `${k}: null`;
      if (typeof v === 'boolean') return `${k}: ${v}`;
      return `${k}: ${v}`;
    });

  const content = `---\n${fmLines.join('\n')}\n---\n\n## Summary\n${summary}\n\n## Context\n${context || '_(to be filled)_'}\n\n## Requested Action\n${requestedAction || '_(to be filled)_'}\n\n## Acceptance Criteria\n- [ ] _(define criteria)_\n\n## Vision Alignment\n_(describe vision alignment)_\n\n---\n*${CREDIT_LINE}*\n`;

  // Write to tickets/open/
  const ticketsDir = getTicketsDir(root);
  const openDir = join(ticketsDir, 'open');
  mkdirSync(openDir, { recursive: true });

  const filename = `${ticketId}-${slug}.md`;
  const filePath = join(openDir, filename);
  writeFileSync(filePath, content, 'utf-8');

  return {
    id: ticketId,
    frontmatter,
    body: content,
    filePath,
    directory: 'open',
  };
}

// ── Move ticket ────────────────────────────────────────────────────────────────

export interface MoveTicketResult {
  success: boolean;
  fromPath: string;
  toPath: string;
  error?: string;
}

export function moveTicket(
  ticketId: string,
  newStatus: TicketStatus,
  root?: string
): MoveTicketResult {
  const ticket = findTicketById(ticketId, root);
  if (!ticket) {
    return {
      success: false,
      fromPath: '',
      toPath: '',
      error: `Ticket '${ticketId}' not found.`,
    };
  }

  if (ticket.directory === newStatus) {
    return {
      success: true,
      fromPath: ticket.filePath,
      toPath: ticket.filePath,
    };
  }

  const ticketsDir = getTicketsDir(root);
  const destDir = join(ticketsDir, newStatus);
  mkdirSync(destDir, { recursive: true });

  const destPath = join(destDir, basename(ticket.filePath));
  renameSync(ticket.filePath, destPath);

  return {
    success: true,
    fromPath: ticket.filePath,
    toPath: destPath,
  };
}

// ── Ticket counts ──────────────────────────────────────────────────────────────

export interface TicketCounts {
  open: number;
  'in-progress': number;
  'pending-approval': number;
  blocked: number;
  closed: number;
  total: number;
}

export function countTickets(root?: string): TicketCounts {
  const counts: TicketCounts = {
    open: 0,
    'in-progress': 0,
    'pending-approval': 0,
    blocked: 0,
    closed: 0,
    total: 0,
  };

  const ticketsDir = getTicketsDir(root);
  for (const s of TICKET_STATUSES) {
    const dir = join(ticketsDir, s);
    if (!existsSync(dir)) continue;
    const count = readdirSync(dir).filter((f) => f.endsWith('.md')).length;
    counts[s] = count;
    counts.total += count;
  }

  return counts;
}

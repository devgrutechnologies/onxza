/**
 * @onxza/core — Ticket module tests
 * Tests: parseTicketFrontmatter, extractTicketBody, createTicket, moveTicket, listTickets, countTickets
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

import {
  parseTicketFrontmatter,
  extractTicketBody,
  createTicket,
  moveTicket,
  listTickets,
  countTickets,
  findTicketById,
  getTicketsDir,
} from '../ticket/index.js';

// ── Test fixture root ──────────────────────────────────────────────────────────

let testRoot: string;

function setupRoot(): string {
  const root = join(tmpdir(), `onxza-ticket-test-${randomUUID()}`);
  // Create ticket status directories
  for (const status of ['open', 'in-progress', 'pending-approval', 'blocked', 'closed']) {
    mkdirSync(join(root, 'workspace', 'tickets', status), { recursive: true });
  }
  return root;
}

beforeEach(() => {
  testRoot = setupRoot();
});

afterEach(() => {
  rmSync(testRoot, { recursive: true, force: true });
});

// ── parseTicketFrontmatter ─────────────────────────────────────────────────────

describe('parseTicketFrontmatter', () => {
  it('parses a valid frontmatter block', () => {
    const content = `---
id: TICKET-20260319-TEST-001
type: task
status: open
created_by: test-agent
assigned_to: dtp-onxza-backend
requires_aaron: false
---

## Summary
Test ticket body.
`;
    const fm = parseTicketFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm?.id).toBe('TICKET-20260319-TEST-001');
    expect(fm?.type).toBe('task');
    expect(fm?.status).toBe('open');
    expect(fm?.requires_aaron).toBe(false);
  });

  it('returns null when id is missing', () => {
    const content = `---
type: task
status: open
---
body`;
    expect(parseTicketFrontmatter(content)).toBeNull();
  });

  it('returns null when type is missing', () => {
    const content = `---
id: TICKET-20260319-TEST-001
status: open
---
body`;
    expect(parseTicketFrontmatter(content)).toBeNull();
  });

  it('returns null when status is missing', () => {
    const content = `---
id: TICKET-20260319-TEST-001
type: task
---
body`;
    expect(parseTicketFrontmatter(content)).toBeNull();
  });

  it('returns null for empty content', () => {
    expect(parseTicketFrontmatter('')).toBeNull();
  });

  it('correctly parses boolean true values', () => {
    const content = `---
id: TICKET-001
type: bug_report
status: open
requires_aaron: true
---
`;
    const fm = parseTicketFrontmatter(content);
    expect(fm?.requires_aaron).toBe(true);
  });

  it('correctly parses null values', () => {
    const content = `---
id: TICKET-001
type: task
status: open
parent_ticket: null
---
`;
    const fm = parseTicketFrontmatter(content);
    expect(fm?.parent_ticket).toBeNull();
  });
});

// ── extractTicketBody ──────────────────────────────────────────────────────────

describe('extractTicketBody', () => {
  it('extracts body from frontmatter-wrapped content', () => {
    const content = `---
id: TICKET-001
type: task
status: open
---

## Summary
This is the body.
`;
    const body = extractTicketBody(content);
    expect(body).toContain('## Summary');
    expect(body).toContain('This is the body.');
    expect(body).not.toContain('---');
  });

  it('returns full content when no frontmatter', () => {
    const content = 'Just a plain body.';
    expect(extractTicketBody(content)).toBe('Just a plain body.');
  });
});

// ── createTicket ──────────────────────────────────────────────────────────────

describe('createTicket', () => {
  it('creates a ticket file in tickets/open/', () => {
    const ticket = createTicket({
      type: 'task',
      summary: 'Write unit tests for core library',
      createdBy: 'dtp-onxza-backend',
      assignedTo: 'dtp-onxza-backend',
      company: 'DTP',
      project: 'onxza',
      priority: 'high',
      root: testRoot,
    });

    expect(ticket.id).toMatch(/^TICKET-\d{8}-DTP-\d+$/);
    expect(ticket.directory).toBe('open');
    expect(existsSync(ticket.filePath)).toBe(true);

    const content = readFileSync(ticket.filePath, 'utf-8');
    expect(content).toContain('Write unit tests for core library');
    expect(content).toContain('dtp-onxza-backend');
  });

  it('generates sequential IDs for multiple tickets', () => {
    const t1 = createTicket({ type: 'task', summary: 'First', createdBy: 'a', assignedTo: 'b', company: 'TST', root: testRoot });
    const t2 = createTicket({ type: 'task', summary: 'Second', createdBy: 'a', assignedTo: 'b', company: 'TST', root: testRoot });

    const seq1 = parseInt(t1.id.split('-').pop() ?? '0', 10);
    const seq2 = parseInt(t2.id.split('-').pop() ?? '0', 10);
    expect(seq2).toBe(seq1 + 1);
  });

  it('includes credit line in created ticket', () => {
    const ticket = createTicket({ type: 'task', summary: 'Test', createdBy: 'a', assignedTo: 'b', root: testRoot });
    const content = readFileSync(ticket.filePath, 'utf-8');
    expect(content).toContain('Imagined by Aaron Gear');
    expect(content).toContain('DevGru Technology Products');
  });

  it('writes correct priority to frontmatter', () => {
    const ticket = createTicket({ type: 'task', summary: 'Priority test', createdBy: 'a', assignedTo: 'b', priority: 'high', root: testRoot });
    const content = readFileSync(ticket.filePath, 'utf-8');
    expect(content).toContain('priority: high');
  });
});

// ── findTicketById ────────────────────────────────────────────────────────────

describe('findTicketById', () => {
  it('finds an existing ticket by ID', () => {
    const created = createTicket({ type: 'task', summary: 'Find me', createdBy: 'a', assignedTo: 'b', company: 'TST', root: testRoot });
    const found = findTicketById(created.id, testRoot);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
  });

  it('returns null for non-existent ticket', () => {
    const result = findTicketById('TICKET-99999999-FAKE-001', testRoot);
    expect(result).toBeNull();
  });
});

// ── listTickets ───────────────────────────────────────────────────────────────

describe('listTickets', () => {
  it('lists all open tickets', () => {
    createTicket({ type: 'task', summary: 'Alpha', createdBy: 'a', assignedTo: 'b', root: testRoot });
    createTicket({ type: 'task', summary: 'Beta', createdBy: 'a', assignedTo: 'b', root: testRoot });

    const tickets = listTickets({ status: 'open', root: testRoot });
    expect(tickets.length).toBe(2);
  });

  it('returns empty array when no tickets exist', () => {
    const tickets = listTickets({ status: 'open', root: testRoot });
    expect(tickets).toHaveLength(0);
  });

  it('filters by assignedTo', () => {
    createTicket({ type: 'task', summary: 'For Alice', createdBy: 'a', assignedTo: 'alice', company: 'TST', root: testRoot });
    createTicket({ type: 'task', summary: 'For Bob', createdBy: 'a', assignedTo: 'bob', company: 'TST', root: testRoot });

    const aliceTickets = listTickets({ assignedTo: 'alice', root: testRoot });
    expect(aliceTickets).toHaveLength(1);
    expect(aliceTickets[0]!.frontmatter.assigned_to).toBe('alice');
  });
});

// ── moveTicket ────────────────────────────────────────────────────────────────

describe('moveTicket', () => {
  it('moves a ticket from open to closed', () => {
    const ticket = createTicket({ type: 'task', summary: 'To close', createdBy: 'a', assignedTo: 'b', company: 'TST', root: testRoot });

    const result = moveTicket(ticket.id, 'closed', testRoot);
    expect(result.success).toBe(true);
    expect(result.toPath).toContain('/closed/');
    expect(existsSync(result.toPath)).toBe(true);
    expect(existsSync(result.fromPath)).toBe(false);
  });

  it('returns no-op success when already in target status', () => {
    const ticket = createTicket({ type: 'task', summary: 'Stay open', createdBy: 'a', assignedTo: 'b', root: testRoot });
    const result = moveTicket(ticket.id, 'open', testRoot);
    expect(result.success).toBe(true);
    expect(result.fromPath).toBe(result.toPath);
  });

  it('returns error for non-existent ticket', () => {
    const result = moveTicket('TICKET-99999999-FAKE-999', 'closed', testRoot);
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});

// ── countTickets ──────────────────────────────────────────────────────────────

describe('countTickets', () => {
  it('counts 0 when directory is empty', () => {
    const counts = countTickets(testRoot);
    expect(counts.open).toBe(0);
    expect(counts.total).toBe(0);
  });

  it('counts tickets correctly after creation', () => {
    createTicket({ type: 'task', summary: 'A', createdBy: 'a', assignedTo: 'b', root: testRoot });
    createTicket({ type: 'task', summary: 'B', createdBy: 'a', assignedTo: 'b', root: testRoot });

    const counts = countTickets(testRoot);
    expect(counts.open).toBe(2);
    expect(counts.total).toBe(2);
  });

  it('updates counts after moving a ticket', () => {
    const t = createTicket({ type: 'task', summary: 'C', createdBy: 'a', assignedTo: 'b', root: testRoot });
    moveTicket(t.id, 'closed', testRoot);

    const counts = countTickets(testRoot);
    expect(counts.open).toBe(0);
    expect(counts.closed).toBe(1);
    expect(counts.total).toBe(1);
  });
});

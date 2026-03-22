'use strict';

/**
 * ONXZA Ticket Store
 *
 * Reads and writes tickets from the on-disk ticket directory structure.
 * All ticket data lives in plain markdown files with YAML frontmatter —
 * no database required. Paths are resolved relative to ONXZA_WORKSPACE.
 *
 * Directory layout (ARCHITECTURE.md §6.1):
 *   tickets/open/
 *   tickets/in-progress/
 *   tickets/pending-approval/
 *   tickets/blocked/
 *   tickets/closed/
 *
 * File naming convention (§6.2):
 *   TICKET-[YYYYMMDD]-[NNN]-[slug].md
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WORKSPACE = process.env.ONXZA_WORKSPACE
  || path.join(os.homedir(), '.openclaw', 'workspace');

const TICKETS_ROOT = path.join(WORKSPACE, 'tickets');

const VALID_STATUSES = [
  'open',
  'in-progress',
  'pending-approval',
  'blocked',
  'closed',
];

// Also support aliases used in some ticket dirs (e.g. "pending")
const STATUS_ALIASES = {
  pending: 'pending-approval',
  'in_progress': 'in-progress',
};

// ---------------------------------------------------------------------------
// Frontmatter parser (no dependencies — stdlib only)
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter from a markdown string.
 * Returns { meta: object, body: string }
 */
function parseFrontmatter(content) {
  const meta = {};
  if (!content.startsWith('---')) {
    return { meta, body: content };
  }
  const end = content.indexOf('\n---', 3);
  if (end === -1) {
    return { meta, body: content };
  }
  const block = content.slice(3, end);
  const body  = content.slice(end + 4).trimStart();

  for (const line of block.split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (key) meta[key] = val;
  }
  return { meta, body };
}

/**
 * Serialize an object to YAML frontmatter block.
 */
function serializeFrontmatter(meta) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(meta)) {
    lines.push(`${k}: ${v}`);
  }
  lines.push('---');
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Ticket object shape
// ---------------------------------------------------------------------------
// {
//   id: string,
//   status: string,
//   filename: string,
//   filePath: string,
//   meta: object,   ← all frontmatter fields
//   body: string,   ← markdown body (after frontmatter)
// }

// ---------------------------------------------------------------------------
// Directory resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the directory for a given status string.
 * Accepts exact status names and aliases (e.g. "pending" → "pending-approval").
 */
function statusToDir(status) {
  const resolved = STATUS_ALIASES[status] || status;
  if (!VALID_STATUSES.includes(resolved)) {
    throw new Error(`Unknown status: "${status}". Valid: ${VALID_STATUSES.join(', ')}`);
  }
  return path.join(TICKETS_ROOT, resolved);
}

/**
 * Return all status directories that actually exist on disk.
 */
function allStatusDirs() {
  const dirs = [];
  for (const s of VALID_STATUSES) {
    const dir = path.join(TICKETS_ROOT, s);
    if (fs.existsSync(dir)) dirs.push({ status: s, dir });
  }
  // Also check "pending" alias directory
  const pendingDir = path.join(TICKETS_ROOT, 'pending');
  if (fs.existsSync(pendingDir)) dirs.push({ status: 'pending-approval', dir: pendingDir });
  return dirs;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Read a single ticket file. Returns ticket object or null.
 */
function readTicketFile(filePath, status) {
  try {
    const raw      = fs.readFileSync(filePath, 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const filename = path.basename(filePath);
    return {
      id:       meta.id || filename.replace('.md', ''),
      status:   meta.status || status,
      filename,
      filePath,
      meta,
      body,
    };
  } catch {
    return null;
  }
}

/**
 * Load all tickets from a specific status directory.
 * @param {string} status
 * @returns {object[]}
 */
function loadByStatus(status) {
  let dir;
  try { dir = statusToDir(status); } catch { return []; }
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('TICKET_TEMPLATE'))
    .map((f) => readTicketFile(path.join(dir, f), status))
    .filter(Boolean);
}

/**
 * Load ALL tickets across all status directories.
 * @returns {object[]}
 */
function loadAll() {
  const tickets = [];
  const seen = new Set();
  for (const { status, dir } of allStatusDirs()) {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('TICKET_TEMPLATE'));
    for (const f of files) {
      const p = path.join(dir, f);
      if (seen.has(p)) continue;
      seen.add(p);
      const t = readTicketFile(p, status);
      if (t) tickets.push(t);
    }
  }
  return tickets;
}

/**
 * Find a ticket by ID across all directories.
 * @param {string} ticketId
 * @returns {object|null}
 */
function findById(ticketId) {
  for (const { status, dir } of allStatusDirs()) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    // Match by id prefix in filename or exact id
    const match = files.find((f) => {
      if (!f.endsWith('.md')) return false;
      const base = f.replace('.md', '');
      return base === ticketId || base.startsWith(ticketId) || f.includes(ticketId.replace(/^TICKET-/, '').toUpperCase());
    });
    if (match) {
      return readTicketFile(path.join(dir, match), status);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Write / Create
// ---------------------------------------------------------------------------

/**
 * Generate a TICKET-[YYYYMMDD]-[NNN]-[slug].md filename.
 * Auto-increments the sequence number by scanning existing tickets for today.
 */
function generateFilename(slug, date) {
  const dateStr = date || new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // Find highest existing sequence for this date across all dirs
  let maxSeq = 0;
  for (const { dir } of allStatusDirs()) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(new RegExp(`TICKET-${dateStr}-(\\d+)-`));
      if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
    }
  }
  const seq = String(maxSeq + 1).padStart(3, '0');
  const cleanSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `TICKET-${dateStr}-${seq}-${cleanSlug}.md`;
}

/**
 * Create a new ticket and write it to tickets/open/.
 * @param {object} fields - ticket fields
 * @returns {{ ticket: object, filePath: string }}
 */
function createTicket(fields) {
  const now = new Date().toISOString();
  const dateStr = now.slice(0, 10).replace(/-/g, '');
  const filename = generateFilename(fields.slug || fields.summary || 'ticket', dateStr);

  const meta = {
    id:            `TICKET-${dateStr}-${filename.match(/TICKET-\d{8}-(\d+)/)[1]}`,
    type:          fields.type        || 'task',
    created_by:    fields.created_by  || 'dtp-onxza-cli',
    created_at:    now,
    assigned_to:   fields.assigned_to || '',
    project:       fields.project     || '',
    company:       fields.company     || '',
    priority:      fields.priority    || 'medium',
    status:        'open',
    requires_aaron: fields.requires_aaron || false,
    parent_ticket: fields.parent_ticket   || 'null',
    related_vision: fields.related_vision || '',
  };

  const body = [
    `## Summary`,
    fields.summary || '',
    ``,
    `## Context`,
    fields.context || '',
    ``,
    `## Requested Action`,
    fields.action || '',
    ``,
    `## Vision Alignment`,
    fields.vision_alignment || '',
    ``,
    `## Dependencies`,
    fields.dependencies || '',
    ``,
    `## Acceptance Criteria`,
    fields.acceptance_criteria || '',
    ``,
    `## Notes / Updates`,
    ``,
    `## Completion Note`,
    ``,
  ].join('\n');

  const content = serializeFrontmatter(meta) + '\n' + body;

  const openDir = path.join(TICKETS_ROOT, 'open');
  if (!fs.existsSync(openDir)) fs.mkdirSync(openDir, { recursive: true });

  const filePath = path.join(openDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');

  const ticket = readTicketFile(filePath, 'open');
  return { ticket, filePath };
}

// ---------------------------------------------------------------------------
// Move
// ---------------------------------------------------------------------------

/**
 * Move a ticket from its current directory to a new status directory.
 * Updates the status field in frontmatter.
 * @param {object} ticket - loaded ticket object
 * @param {string} newStatus
 * @returns {{ ticket: object, newPath: string, oldPath: string }}
 */
function moveTicket(ticket, newStatus) {
  const newDir = statusToDir(newStatus);
  if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });

  // Read fresh content
  const raw = fs.readFileSync(ticket.filePath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);

  // Update status
  meta.status = newStatus;
  const newContent = serializeFrontmatter(meta) + '\n' + body;

  const newPath = path.join(newDir, ticket.filename);
  fs.writeFileSync(newPath, newContent, 'utf8');

  // Remove from old location (only if different)
  if (path.resolve(ticket.filePath) !== path.resolve(newPath)) {
    fs.unlinkSync(ticket.filePath);
  }

  const moved = readTicketFile(newPath, newStatus);
  return { ticket: moved, newPath, oldPath: ticket.filePath };
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

/**
 * Apply filters to a ticket array.
 * @param {object[]} tickets
 * @param {object} filters - { company, assignedTo, priority, project, type }
 */
function applyFilters(tickets, filters = {}) {
  return tickets.filter((t) => {
    if (filters.company    && (t.meta.company    || '').toLowerCase() !== filters.company.toLowerCase())    return false;
    if (filters.assignedTo && (t.meta.assigned_to || '').toLowerCase() !== filters.assignedTo.toLowerCase()) return false;
    if (filters.priority   && (t.meta.priority   || '').toLowerCase() !== filters.priority.toLowerCase())   return false;
    if (filters.project    && (t.meta.project    || '').toLowerCase() !== filters.project.toLowerCase())    return false;
    if (filters.type       && (t.meta.type       || '').toLowerCase() !== filters.type.toLowerCase())       return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  loadByStatus,
  loadAll,
  findById,
  createTicket,
  moveTicket,
  applyFilters,
  generateFilename,
  parseFrontmatter,
  serializeFrontmatter,
  VALID_STATUSES,
  TICKETS_ROOT,
  WORKSPACE,
};

/**
 * MPI Store — local JSONL data reader.
 *
 * Reads ~/.onxza/mpi/events.jsonl (one JSON object per line, append-only).
 * Applies in-memory filters. Returns typed MpiEvent[].
 *
 * The backend (TICKET-DTP-019) can replace this reader with a Supabase query
 * layer by swapping the `readEvents` export — the CLI command is unchanged.
 * Override store path: ONXZA_MPI_PATH env var.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import fs   from 'fs';
import path from 'path';
import os   from 'os';
import { MpiEvent, MpiFilter, MPI_SCHEMA_VERSION } from './schema.js';

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

export function getMpiStorePath(): string {
  return process.env['ONXZA_MPI_PATH']
    ?? path.join(os.homedir(), '.onxza', 'mpi', 'events.jsonl');
}

export function ensureMpiStoreDir(): void {
  const dir = path.dirname(getMpiStorePath());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Parse the JSONL store into MpiEvent[]. Silently skips malformed lines.
 * Returns [] if store file does not exist.
 */
export function readAllEvents(): MpiEvent[] {
  const storePath = getMpiStorePath();
  if (!fs.existsSync(storePath)) return [];

  const lines = fs.readFileSync(storePath, 'utf8').split('\n');
  const events: MpiEvent[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed) as MpiEvent;
      // Basic shape check
      if (obj.ts && obj.modelUsed && obj.taskType) {
        events.push(obj);
      }
    } catch {
      // Skip malformed lines — never crash on bad data
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

/**
 * Apply MpiFilter to an event array. All filters are AND-combined.
 */
export function filterEvents(events: MpiEvent[], filter: MpiFilter): MpiEvent[] {
  return events.filter(e => {
    // Model filter — partial, case-insensitive match
    if (filter.model) {
      const q = filter.model.toLowerCase();
      if (!e.modelUsed.toLowerCase().includes(q)) return false;
    }

    // Task type filter — exact match
    if (filter.taskType && e.taskType !== filter.taskType) return false;

    // Date range — compare ISO dates as strings (lexicographic is valid for YYYY-MM-DD)
    if (filter.dateStart) {
      const evDate = e.ts.slice(0, 10);
      if (evDate < filter.dateStart) return false;
    }
    if (filter.dateEnd) {
      const evDate = e.ts.slice(0, 10);
      if (evDate > filter.dateEnd) return false;
    }

    return true;
  });
}

/**
 * Parse a "start:end" date-range string into { dateStart, dateEnd }.
 * Returns null if the format is invalid.
 */
export function parseDateRange(raw: string): { dateStart: string; dateEnd: string } | null {
  const parts = raw.split(':');
  if (parts.length !== 2) return null;
  const [start, end] = parts as [string, string];
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(start) || !iso.test(end)) return null;
  if (start > end) return null;
  return { dateStart: start, dateEnd: end };
}

// ---------------------------------------------------------------------------
// Write (for seed and agent logging)
// ---------------------------------------------------------------------------

/**
 * Append a single MPI event to the store.
 */
export function appendEvent(event: Omit<MpiEvent, 'version'>): void {
  ensureMpiStoreDir();
  const record: MpiEvent = { version: MPI_SCHEMA_VERSION, ...event };
  const line = JSON.stringify(record) + '\n';
  fs.appendFileSync(getMpiStorePath(), line, 'utf8');
}

/**
 * Convenience: read + filter in one call.
 */
export function readEvents(filter: MpiFilter = {}): MpiEvent[] {
  return filterEvents(readAllEvents(), filter);
}

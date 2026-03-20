/**
 * API Route: /api/memory-isolation
 * Returns memory isolation runtime state:
 *   - Recent access denials from memory-access.log
 *   - Active cross-company grants
 *   - Classification overview (count per type)
 *   - Scan results (critical violations + warnings)
 *
 * Reads workspace directly. No DB, no LLM.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

const OPENCLAW_HOME    = process.env.OPENCLAW_HOME || join(process.env.HOME || '~', '.openclaw');
const WORKSPACE        = join(OPENCLAW_HOME, 'workspace');
const ACCESS_LOG       = join(WORKSPACE, 'logs', 'audit', 'memory-access.log');
const GRANTS_FILE      = join(WORKSPACE, 'logs', '.memory-grants.json');
const CLASSIFICATIONS  = join(WORKSPACE, 'logs', '.memory-classifications.json');
const SHARED_LEARNINGS = join(WORKSPACE, 'shared-learnings');

interface AccessEvent {
  timestamp: string;
  agent: string;
  path: string;
  classification: string;
  allowed: boolean;
  reason: string;
}

interface Grant {
  from_company: string;
  to_agent: string;
  paths: string;
  granted_at: string;
  active: boolean;
}

async function getAccessEvents(limit = 50): Promise<AccessEvent[]> {
  const events: AccessEvent[] = [];
  try {
    const raw = await readFile(ACCESS_LOG, 'utf-8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      try { events.push(JSON.parse(t)); } catch { /* skip */ }
    }
  } catch { /* no log */ }
  return events.reverse().slice(0, limit);
}

async function getGrants(): Promise<Grant[]> {
  try {
    const raw = await readFile(GRANTS_FILE, 'utf-8');
    const all = JSON.parse(raw);
    return Array.isArray(all) ? all.filter((g: Grant) => g.active !== false) : [];
  } catch { return []; }
}

async function getClassifications(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(CLASSIFICATIONS, 'utf-8');
    return JSON.parse(raw);
  } catch { return {}; }
}

// Lightweight scan: look for PRIVATE files in shared-learnings
async function quickScan(): Promise<{ violations: number; warnings: number }> {
  let violations = 0;
  const PRIVATE_FILES = new Set(['MEMORY.md', 'SOUL.md', 'IDENTITY.md']);

  async function walk(dir: string): Promise<void> {
    let entries: string[];
    try { entries = await readdir(dir); } catch { return; }
    for (const e of entries) {
      if (e.startsWith('.') || e === 'node_modules') continue;
      if (PRIVATE_FILES.has(e)) { violations++; }
      try {
        const { stat } = await import('fs/promises');
        const s = await stat(join(dir, e));
        if (s.isDirectory()) await walk(join(dir, e));
      } catch { /* skip */ }
    }
  }

  await walk(SHARED_LEARNINGS);
  return { violations, warnings: 0 };
}

export async function GET() {
  const [events, grants, classifications, scan] = await Promise.all([
    getAccessEvents(100),
    getGrants(),
    getClassifications(),
    quickScan(),
  ]);

  const denials = events.filter(e => !e.allowed);
  const allows  = events.filter(e => e.allowed);

  // Denial breakdown by company pair
  const byPair: Record<string, number> = {};
  for (const d of denials) {
    const key = `${d.agent?.split('-')[0]?.toUpperCase() || '?'} → ${d.path?.split('/')[0] || '?'}`;
    byPair[key] = (byPair[key] || 0) + 1;
  }

  // Classification counts from overrides store
  const classCounts: Record<string, number> = {};
  for (const v of Object.values(classifications)) {
    classCounts[v as string] = (classCounts[v as string] || 0) + 1;
  }

  return NextResponse.json({
    recent_denials: denials.slice(0, 20),
    recent_allows: allows.slice(0, 10),
    total_events: events.length,
    denial_count: denials.length,
    grants,
    classifications_override_count: Object.keys(classifications).length,
    class_counts: classCounts,
    scan,
    generated_at: new Date().toISOString(),
  });
}

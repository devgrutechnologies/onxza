/**
 * API Route: /api/audit
 * Returns audit trail entries with optional query filters.
 * Reads ~/.openclaw/workspace/logs/audit/audit-trail.md directly.
 *
 * Query params:
 *   ?agent=<substr>    filter by agent ID (substring, case-insensitive)
 *   ?action=<substr>   filter by action (substring, case-insensitive)
 *   ?date=<yyyy-mm-dd> filter by date prefix
 *   ?limit=<n>         max entries to return (default 200, max 1000)
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as crypto from 'crypto';

const OPENCLAW_HOME = process.env.OPENCLAW_HOME || join(process.env.HOME || '~', '.openclaw');
const AUDIT_FILE = join(OPENCLAW_HOME, 'workspace', 'logs', 'audit', 'audit-trail.md');
const ENTRIES_MARKER = '## Log entries begin below this line';

interface AuditEntry {
  timestamp: string;
  agent: string;
  action: string;
  outcome: string;
  confirmed_by: string;
  reversible: string;
  checkpoint_id: string;
  checksum: string | null;
  checksum_valid: boolean | null;
  line_num: number;
}

function sha256Short(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);
}

async function parseAuditTrail(): Promise<AuditEntry[]> {
  let raw: string;
  try {
    raw = await readFile(AUDIT_FILE, 'utf-8');
  } catch {
    return [];
  }

  const lines = raw.split('\n');
  const entries: AuditEntry[] = [];
  let inLogSection = false;
  let lineNum = 0;

  for (const line of lines) {
    lineNum++;
    if (line.includes(ENTRIES_MARKER)) {
      inLogSection = true;
      continue;
    }
    if (!inLogSection) continue;
    const stripped = line.trim();
    if (!stripped) continue;

    const parts = stripped.split('|').map((p) => p.trim());
    if (parts.length < 7) continue;

    const checksum = parts.length >= 8 ? parts[7] : null;

    // Verify checksum if present
    let checksumValid: boolean | null = null;
    if (checksum) {
      const lineBody = `${parts[0]} | ${parts[1]} | ${parts[2]} | ${parts[3]} | ${parts[4]} | ${parts[5]} | ${parts[6]}`;
      checksumValid = sha256Short(lineBody) === checksum;
    }

    entries.push({
      timestamp: parts[0],
      agent: parts[1],
      action: parts[2],
      outcome: parts[3],
      confirmed_by: parts[4],
      reversible: parts[5],
      checkpoint_id: parts[6],
      checksum,
      checksum_valid: checksumValid,
      line_num: lineNum,
    });
  }

  return entries;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentFilter  = searchParams.get('agent')?.toLowerCase();
  const actionFilter = searchParams.get('action')?.toLowerCase();
  const dateFilter   = searchParams.get('date');
  const limit        = Math.min(parseInt(searchParams.get('limit') || '200', 10), 1000);

  let entries = await parseAuditTrail();

  if (agentFilter)  entries = entries.filter(e => e.agent.toLowerCase().includes(agentFilter));
  if (actionFilter) entries = entries.filter(e => e.action.toLowerCase().includes(actionFilter));
  if (dateFilter)   entries = entries.filter(e => e.timestamp.startsWith(dateFilter));

  // Most recent first
  entries = entries.reverse().slice(0, limit);

  const tampered = entries.filter(e => e.checksum_valid === false).length;

  return NextResponse.json({
    entries,
    total: entries.length,
    tampered_count: tampered,
    generated_at: new Date().toISOString(),
  });
}

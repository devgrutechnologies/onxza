/**
 * API Route: /api/vision-lock
 * Returns Vision Lock status for all vision.md files.
 * Reads workspace directly — no DB, no LLM.
 *
 * Returns:
 *   - List of all vision files with status, hash, immutability
 *   - Latest checkpoint vision hash comparison (changed / ok)
 *   - Any open vision_update_request tickets
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
import { NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import * as crypto from 'crypto';

const OPENCLAW_HOME  = process.env.OPENCLAW_HOME || join(process.env.HOME || '~', '.openclaw');
const WORKSPACE      = join(OPENCLAW_HOME, 'workspace');
const CHECKPOINTS    = join(OPENCLAW_HOME, 'checkpoints');
const TICKETS_OPEN   = join(WORKSPACE, 'tickets', 'open');

const IMMUTABLE_MARKER = 'APPROVED — IMMUTABLE';
const REVIEW_MARKER    = 'CDP-REVIEW';

function sha256File(content: Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function extractVisionStatus(content: string): string | null {
  // YAML frontmatter
  const fm = content.match(/^status:\s*(.+)$/m);
  if (fm) return fm[1].trim();
  // Markdown bold
  const md = content.match(/\*\*Status:\*\*\s*(.+?)(?:\n|$)/);
  if (md) return md[1].trim();
  return null;
}

async function walkForVisionFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch { return results; }

  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'node_modules') continue;
    const full = join(dir, entry);
    try {
      const s = await stat(full);
      if (s.isDirectory()) {
        const sub = await walkForVisionFiles(full);
        results.push(...sub);
      } else if (entry.toLowerCase() === 'vision.md') {
        results.push(full);
      }
    } catch { /* skip */ }
  }
  return results;
}

async function getLatestCheckpointHashes(): Promise<{ checkpointId: string; hashes: Record<string, string> } | null> {
  try {
    const entries = (await readdir(CHECKPOINTS)).sort().reverse();
    for (const name of entries) {
      const hashFile = join(CHECKPOINTS, name, 'vision-hashes.txt');
      try {
        const raw = await readFile(hashFile, 'utf-8');
        const hashes: Record<string, string> = {};
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const parts = trimmed.split('  ', 2);
          if (parts.length === 2) hashes[parts[1]] = parts[0];
        }
        if (Object.keys(hashes).length > 0) {
          return { checkpointId: name, hashes };
        }
      } catch { /* no hashes in this checkpoint */ }
    }
  } catch { /* no checkpoints dir */ }
  return null;
}

async function getOpenVisionUpdateRequests(): Promise<{ ticket_id: string; vision_file: string; agent: string; created_at: string }[]> {
  const results = [];
  try {
    const files = await readdir(TICKETS_OPEN);
    for (const f of files) {
      if (!f.includes('vision-update-request')) continue;
      try {
        const raw = await readFile(join(TICKETS_OPEN, f), 'utf-8');
        const idMatch = raw.match(/^id:\s*(.+)$/m);
        const visionMatch = raw.match(/^vision_file:\s*(.+)$/m);
        const agentMatch = raw.match(/^blocking_agent:\s*(.+)$/m);
        const dateMatch = raw.match(/^created_at:\s*(.+)$/m);
        results.push({
          ticket_id: idMatch?.[1]?.trim() || f,
          vision_file: visionMatch?.[1]?.trim() || '',
          agent: agentMatch?.[1]?.trim() || '',
          created_at: dateMatch?.[1]?.trim() || '',
        });
      } catch { /* skip */ }
    }
  } catch { /* no tickets dir */ }
  return results;
}

export async function GET() {
  const visionFiles = await walkForVisionFiles(WORKSPACE);
  const checkpointData = await getLatestCheckpointHashes();
  const pendingRequests = await getOpenVisionUpdateRequests();

  const fileResults = [];
  let immutableCount = 0;
  let violationCount = 0;

  for (const fpath of visionFiles) {
    const relPath = fpath.replace(WORKSPACE + '/', '');
    let content = '';
    let fileHash = '';
    try {
      const buf = await readFile(fpath);
      content = buf.toString('utf-8');
      fileHash = sha256File(buf);
    } catch { continue; }

    const status = extractVisionStatus(content) || 'NO STATUS';
    const immutable = status.includes(IMMUTABLE_MARKER);
    if (immutable) immutableCount++;

    // Check against checkpoint
    let checksumMatch: boolean | null = null;
    if (checkpointData && relPath in checkpointData.hashes) {
      const stored = checkpointData.hashes[relPath];
      // Full hash comparison
      const fullHash = crypto.createHash('sha256').update(await readFile(fpath)).digest('hex');
      checksumMatch = stored === fullHash;
      if (immutable && checksumMatch === false) violationCount++;
    }

    fileResults.push({
      path: relPath,
      status,
      immutable,
      in_review: status.includes(REVIEW_MARKER),
      hash: fileHash,
      checksum_match: checksumMatch,
    });
  }

  return NextResponse.json({
    vision_files: fileResults,
    total: fileResults.length,
    immutable_count: immutableCount,
    violation_count: violationCount,
    checkpoint: checkpointData?.checkpointId || null,
    pending_update_requests: pendingRequests,
    generated_at: new Date().toISOString(),
  });
}

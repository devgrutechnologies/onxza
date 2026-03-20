/**
 * API Route: /api/checkpoints
 * Returns checkpoint list with optional detail for a specific checkpoint.
 *
 * GET /api/checkpoints                     — list all checkpoints
 * GET /api/checkpoints?id=<checkpoint-id>  — get manifest + vision hashes for one checkpoint
 *
 * Reads ~/.openclaw/checkpoints/ directly. No DB.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

const OPENCLAW_HOME = process.env.OPENCLAW_HOME || join(process.env.HOME || '~', '.openclaw');
const CHECKPOINTS_DIR = join(OPENCLAW_HOME, 'checkpoints');

interface CheckpointSummary {
  checkpoint_id: string;
  timestamp: string;
  event: string;
  agent_count: number;
  vision_files: number;
  files_modified: number;
  has_vision_hashes: boolean;
}

interface CheckpointDetail extends CheckpointSummary {
  vision_hashes: Record<string, string>;
  agents: string[];
  manifest: Record<string, unknown>;
}

async function listCheckpoints(): Promise<CheckpointSummary[]> {
  let entries: string[];
  try {
    entries = await readdir(CHECKPOINTS_DIR);
  } catch {
    return [];
  }

  const results: CheckpointSummary[] = [];

  for (const name of entries.sort().reverse()) {
    const cpDir = join(CHECKPOINTS_DIR, name);
    try {
      const s = await stat(cpDir);
      if (!s.isDirectory()) continue;
    } catch {
      continue;
    }

    const manifestPath = join(cpDir, 'manifest.json');
    const visionHashesPath = join(cpDir, 'vision-hashes.txt');
    let hasVisionHashes = false;

    try {
      await stat(visionHashesPath);
      hasVisionHashes = true;
    } catch { /* ok */ }

    try {
      const raw = await readFile(manifestPath, 'utf-8');
      const m = JSON.parse(raw);
      results.push({
        checkpoint_id: m.checkpoint_id || name,
        timestamp: m.timestamp || '',
        event: m.event || '',
        agent_count: m.agent_count || 0,
        vision_files: m.vision_files_hashed || 0,
        files_modified: m.files_modified_count || 0,
        has_vision_hashes: hasVisionHashes,
      });
    } catch {
      // Fallback: name-only entry for old checkpoints without manifests
      results.push({
        checkpoint_id: name,
        timestamp: '',
        event: name.split('-').slice(2).join('-'),
        agent_count: 0,
        vision_files: 0,
        files_modified: 0,
        has_vision_hashes: hasVisionHashes,
      });
    }
  }

  return results;
}

async function getCheckpointDetail(id: string): Promise<CheckpointDetail | null> {
  const cpDir = join(CHECKPOINTS_DIR, id);

  try {
    await stat(cpDir);
  } catch {
    return null;
  }

  // Load manifest
  let manifest: Record<string, unknown> = {};
  try {
    const raw = await readFile(join(cpDir, 'manifest.json'), 'utf-8');
    manifest = JSON.parse(raw);
  } catch { /* ok */ }

  // Load agents list
  const agents: string[] = [];
  try {
    const raw = await readFile(join(cpDir, 'agents-list.txt'), 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) agents.push(trimmed);
    }
  } catch { /* ok */ }

  // Load vision hashes
  const visionHashes: Record<string, string> = {};
  try {
    const raw = await readFile(join(cpDir, 'vision-hashes.txt'), 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = trimmed.split('  ', 2);
      if (parts.length === 2) {
        visionHashes[parts[1]] = parts[0];
      }
    }
  } catch { /* ok */ }

  return {
    checkpoint_id: id,
    timestamp: String(manifest.timestamp || ''),
    event: String(manifest.event || ''),
    agent_count: agents.length,
    vision_files: Object.keys(visionHashes).length,
    files_modified: Number(manifest.files_modified_count || 0),
    has_vision_hashes: Object.keys(visionHashes).length > 0,
    vision_hashes: visionHashes,
    agents,
    manifest,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const detail = await getCheckpointDetail(id);
    if (!detail) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }
    return NextResponse.json(detail);
  }

  const checkpoints = await listCheckpoints();
  return NextResponse.json({
    checkpoints,
    total: checkpoints.length,
    generated_at: new Date().toISOString(),
  });
}

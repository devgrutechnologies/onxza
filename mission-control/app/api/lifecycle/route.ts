/**
 * API Route: /api/lifecycle
 * Returns agent lifecycle data:
 *   - Training status per agent (NEVER_RUN | IN_TRAINING | GRADUATED)
 *   - Retired agents (workspaces with RETIRED.md)
 *   - Pending lifecycle notifications
 *
 * Reads filesystem directly. No DB, no LLM.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const OPENCLAW_HOME   = process.env.OPENCLAW_HOME || join(process.env.HOME || '~', '.openclaw');
const WORKSPACE       = join(OPENCLAW_HOME, 'workspace');
const AGENTS_DIR      = join(OPENCLAW_HOME, 'agents');
const OPENCLAW_JSON   = join(OPENCLAW_HOME, 'openclaw.json');
const AUTONOMY_SCORES = join(WORKSPACE, 'logs', 'quality', 'autonomy-scores.jsonl');
const NOTIFICATIONS   = join(WORKSPACE, 'notifications');
const TRAINING_THRESHOLD = 10;

interface TrainingEntry {
  agent_id: string;
  status: 'NEVER_RUN' | 'IN_TRAINING' | 'GRADUATED';
  sessions: number;
  reviews: number;
  reviews_remaining: number;
  avg_score: number | null;
  last_score: number | null;
}

interface RetiredAgent {
  agent_id: string;
  workspace: string;
  retired_at: string;
  checkpoint: string;
}

async function getSessionCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  try {
    const agentDirs = await readdir(AGENTS_DIR);
    for (const d of agentDirs) {
      if (d.startsWith('.')) continue;
      const sessDir = join(AGENTS_DIR, d, 'sessions');
      try {
        const files = await readdir(sessDir);
        counts[d] = files.filter(f => f.endsWith('.jsonl')).length;
      } catch { counts[d] = 0; }
    }
  } catch { /* no agents dir */ }
  return counts;
}

async function getReviewCounts(): Promise<Record<string, { scores: number[]; count: number }>> {
  const counts: Record<string, { scores: number[]; count: number }> = {};
  try {
    const raw = await readFile(AUTONOMY_SCORES, 'utf-8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      try {
        const entry = JSON.parse(t);
        if (!entry.agent || entry.score == null) continue;
        if (!counts[entry.agent]) counts[entry.agent] = { scores: [], count: 0 };
        counts[entry.agent].scores.push(Number(entry.score));
        counts[entry.agent].count++;
      } catch { /* skip */ }
    }
  } catch { /* no file */ }
  return counts;
}

async function getAllAgentIds(): Promise<string[]> {
  const ids = new Set<string>();
  // From openclaw.json
  try {
    const raw = await readFile(OPENCLAW_JSON, 'utf-8');
    const cfg = JSON.parse(raw);
    for (const a of cfg?.agents?.list || []) {
      if (a.id) ids.add(a.id);
    }
  } catch { /* ok */ }
  // From agents dir
  try {
    const dirs = await readdir(AGENTS_DIR);
    for (const d of dirs) {
      if (!d.startsWith('.')) ids.add(d);
    }
  } catch { /* ok */ }
  return [...ids].sort();
}

async function getRetiredAgents(): Promise<RetiredAgent[]> {
  const retired: RetiredAgent[] = [];
  try {
    const entries = await readdir(OPENCLAW_HOME);
    for (const entry of entries) {
      if (!entry.startsWith('workspace-')) continue;
      const wsDir = join(OPENCLAW_HOME, entry);
      const retiredMd = join(wsDir, 'RETIRED.md');
      try {
        const content = await readFile(retiredMd, 'utf-8');
        const idMatch = content.match(/^agent_id:\s*(.+)$/m);
        const timeMatch = content.match(/^retired_at:\s*(.+)$/m);
        const cpMatch = content.match(/^checkpoint_before_retirement:\s*(.+)$/m);
        retired.push({
          agent_id: idMatch?.[1]?.trim() || entry.replace('workspace-', ''),
          workspace: wsDir,
          retired_at: timeMatch?.[1]?.trim() || '',
          checkpoint: cpMatch?.[1]?.trim() || 'none',
        });
      } catch { /* no RETIRED.md */ }
    }
  } catch { /* ok */ }
  return retired;
}

async function getPendingNotifications(): Promise<{ subject: string; created_at: string }[]> {
  const notes: { subject: string; created_at: string }[] = [];
  try {
    const files = await readdir(NOTIFICATIONS);
    for (const f of files.slice(-10)) {
      try {
        const raw = await readFile(join(NOTIFICATIONS, f), 'utf-8');
        const subj = raw.match(/^subject:\s*(.+)$/m)?.[1]?.trim() || f;
        const date = raw.match(/^created_at:\s*(.+)$/m)?.[1]?.trim() || '';
        notes.push({ subject: subj, created_at: date });
      } catch { /* skip */ }
    }
  } catch { /* ok */ }
  return notes.reverse().slice(0, 5);
}

export async function GET() {
  const [allIds, sessionCounts, reviewCounts, retiredAgents, notifications] = await Promise.all([
    getAllAgentIds(),
    getSessionCounts(),
    getReviewCounts(),
    getRetiredAgents(),
    getPendingNotifications(),
  ]);

  const training: TrainingEntry[] = allIds.map(id => {
    const sessions = sessionCounts[id] || 0;
    const reviewData = reviewCounts[id];
    const reviews = reviewData?.count || 0;
    const scores = reviewData?.scores || [];
    const avgScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
    const lastScore = scores.length > 0 ? scores[scores.length - 1] : null;

    let status: TrainingEntry['status'];
    if (sessions === 0) status = 'NEVER_RUN';
    else if (reviews < TRAINING_THRESHOLD) status = 'IN_TRAINING';
    else status = 'GRADUATED';

    return {
      agent_id: id,
      status,
      sessions,
      reviews,
      reviews_remaining: Math.max(0, TRAINING_THRESHOLD - reviews),
      avg_score: avgScore,
      last_score: lastScore,
    };
  });

  const graduated   = training.filter(t => t.status === 'GRADUATED').length;
  const inTraining  = training.filter(t => t.status === 'IN_TRAINING').length;
  const neverRun    = training.filter(t => t.status === 'NEVER_RUN').length;

  return NextResponse.json({
    training,
    summary: { total: training.length, graduated, in_training: inTraining, never_run: neverRun },
    retired_agents: retiredAgents,
    notifications,
    generated_at: new Date().toISOString(),
  });
}

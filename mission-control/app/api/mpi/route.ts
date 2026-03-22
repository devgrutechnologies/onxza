/**
 * API Route: /api/mpi
 * Returns MPI (Model Performance Index) aggregated stats and raw entries.
 *
 * GET /api/mpi                          — aggregated report (all data)
 * GET /api/mpi?model=X                  — filter by model name (substring match)
 * GET /api/mpi?task_type=code           — filter by task type
 * GET /api/mpi?date_from=YYYY-MM-DD
 * GET /api/mpi?date_to=YYYY-MM-DD
 * GET /api/mpi?raw=true                 — return raw entries instead of report
 * GET /api/mpi?limit=N                  — max entries (raw mode)
 * GET /api/mpi?compare=model1,model2    — side-by-side comparison of two models
 * GET /api/mpi?trends=true              — time-bucketed FVP pass rate trends by model
 *
 * Reads workspace/logs/mpi/mpi-log.jsonl directly. No DB, no LLM.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const WORKSPACE = process.env.WORKSPACE_PATH ||
  join(process.env.HOME || '~', '.openclaw', 'workspace');
const MPI_LOG = join(WORKSPACE, 'logs', 'mpi', 'mpi-log.jsonl');

interface MpiEntry {
  version: string;
  timestamp: string;
  task_id: string;
  task_type: string;
  model_used: string;
  router_suggestion: string;
  fvp_result: string;
  fvp_loops: number;
  confidence_score: number;
  time_to_complete_ms: number;
  approx_cost_usd: number;
  agent_role: string;
  outcome: string;
}

function loadEntries(model?: string, taskType?: string, dateFrom?: string, dateTo?: string, limit?: number): MpiEntry[] {
  if (!existsSync(MPI_LOG)) return [];

  const raw = readFileSync(MPI_LOG, 'utf-8');
  const entries: MpiEntry[] = [];

  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    let obj: Record<string, unknown>;
    try { obj = JSON.parse(t); } catch { continue; }
    if (obj['_schema'] || obj['version'] !== 'mpi-v1') continue;

    const ts = String(obj['timestamp'] ?? '');
    if (model && !String(obj['model_used'] ?? '').toLowerCase().includes(model.toLowerCase())) continue;
    if (taskType && obj['task_type'] !== taskType) continue;
    if (dateFrom && ts < dateFrom) continue;
    if (dateTo && ts > dateTo) continue;

    entries.push(obj as unknown as MpiEntry);
  }

  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return limit ? entries.slice(0, limit) : entries;
}

interface ModelStats {
  total_calls: number;
  fvp_pass_rate: number;
  fvp_fail_rate: number;
  avg_loops: number;
  avg_time_ms: number;
  avg_cost_usd: number;
  total_cost_usd: number;
  avg_confidence: number;
  cost_efficiency: number; // tasks per dollar
  top_task_types: [string, number][];
}

function buildModelStats(entries: MpiEntry[]): Record<string, ModelStats> {
  const models: Record<string, {
    calls: number; fvp_pass: number; fvp_fail: number; fvp_loop: number;
    total_loops: number; total_ms: number; total_cost: number;
    confidence_sum: number; task_types: Record<string, number>;
  }> = {};

  for (const e of entries) {
    const m = e.model_used;
    if (!models[m]) {
      models[m] = { calls: 0, fvp_pass: 0, fvp_fail: 0, fvp_loop: 0,
                    total_loops: 0, total_ms: 0, total_cost: 0,
                    confidence_sum: 0, task_types: {} };
    }
    const s = models[m]!;
    s.calls++;
    if (e.fvp_result === 'pass')      s.fvp_pass++;
    else if (e.fvp_result === 'fail') s.fvp_fail++;
    else if (e.fvp_result === 'loop') s.fvp_loop++;
    s.total_loops    += e.fvp_loops || 0;
    s.total_ms       += e.time_to_complete_ms || 0;
    s.total_cost     += e.approx_cost_usd || 0;
    s.confidence_sum += e.confidence_score || 0;
    s.task_types[e.task_type] = (s.task_types[e.task_type] ?? 0) + 1;
  }

  const result: Record<string, ModelStats> = {};
  for (const [m, s] of Object.entries(models)) {
    const c = s.calls;
    const totalCost = Math.round(s.total_cost * 10000) / 10000;
    result[m] = {
      total_calls:    c,
      fvp_pass_rate:  Math.round((s.fvp_pass / c) * 1000) / 1000,
      fvp_fail_rate:  Math.round((s.fvp_fail / c) * 1000) / 1000,
      avg_loops:      Math.round((s.total_loops / c) * 100) / 100,
      avg_time_ms:    Math.round(s.total_ms / c),
      avg_cost_usd:   Math.round((s.total_cost / c) * 100000) / 100000,
      total_cost_usd: totalCost,
      avg_confidence: Math.round((s.confidence_sum / c) * 10) / 10,
      cost_efficiency: totalCost > 0 ? Math.round((c / totalCost) * 10) / 10 : 0,
      top_task_types: Object.entries(s.task_types).sort((a, b) => b[1] - a[1]).slice(0, 3),
    };
  }
  return result;
}

function buildReport(entries: MpiEntry[]) {
  if (entries.length === 0) {
    return { total: 0, models: 0, model_stats: {}, task_types: [], generated_at: new Date().toISOString() };
  }

  const model_stats = buildModelStats(entries);

  // Unique task types
  const taskTypeCounts: Record<string, number> = {};
  for (const e of entries) {
    taskTypeCounts[e.task_type] = (taskTypeCounts[e.task_type] ?? 0) + 1;
  }
  const task_types = Object.entries(taskTypeCounts).sort((a, b) => b[1] - a[1]).map(([t, c]) => ({ type: t, count: c }));

  return {
    total: entries.length,
    models: Object.keys(model_stats).length,
    model_stats,
    task_types,
    generated_at: new Date().toISOString()
  };
}

function buildTrends(entries: MpiEntry[]) {
  // Bucket by day, track FVP pass rate per model per day
  const buckets: Record<string, Record<string, { pass: number; total: number }>> = {};

  for (const e of entries) {
    const day = e.timestamp.slice(0, 10);
    if (!buckets[day]) buckets[day] = {};
    const m = e.model_used;
    if (!buckets[day][m]) buckets[day][m] = { pass: 0, total: 0 };
    buckets[day][m].total++;
    if (e.fvp_result === 'pass') buckets[day][m].pass++;
  }

  const days = Object.keys(buckets).sort();
  const allModels = [...new Set(entries.map(e => e.model_used))];

  return {
    days,
    models: allModels,
    series: allModels.map(model => ({
      model,
      data: days.map(day => {
        const b = buckets[day]?.[model];
        if (!b || b.total === 0) return null;
        return Math.round((b.pass / b.total) * 1000) / 1000;
      })
    })),
    generated_at: new Date().toISOString()
  };
}

function buildComparison(entries: MpiEntry[], models: string[]) {
  const result: Record<string, ModelStats | { error: string }> = {};
  for (const m of models) {
    const filtered = entries.filter(e => e.model_used.toLowerCase().includes(m.toLowerCase()));
    if (filtered.length === 0) {
      result[m] = { error: 'No data for this model' };
    } else {
      const stats = buildModelStats(filtered);
      // Get the actual model key that matched
      const key = Object.keys(stats)[0];
      result[m] = key ? stats[key] : { error: 'No data' };
    }
  }
  return { comparison: result, generated_at: new Date().toISOString() };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const model    = searchParams.get('model') || undefined;
  const taskType = searchParams.get('task_type') || undefined;
  const dateFrom = searchParams.get('date_from') || undefined;
  const dateTo   = searchParams.get('date_to') || undefined;
  const raw      = searchParams.get('raw') === 'true';
  const trends   = searchParams.get('trends') === 'true';
  const compare  = searchParams.get('compare') || undefined;
  const limit    = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

  // Load all entries (for compare/trends we load unfiltered then filter by model inside)
  const entries = loadEntries(
    compare ? undefined : model,
    taskType,
    dateFrom,
    dateTo,
    raw ? limit : undefined
  );

  if (compare) {
    const compareModels = compare.split(',').map(s => s.trim()).filter(Boolean);
    return NextResponse.json(buildComparison(entries, compareModels));
  }

  if (trends) {
    return NextResponse.json(buildTrends(entries));
  }

  if (raw) {
    return NextResponse.json({ entries, total: entries.length, generated_at: new Date().toISOString() });
  }

  const report = buildReport(entries);
  return NextResponse.json(report);
}

/**
 * @onxza/core — MPI (Model Performance Index) Module
 * Logging hook, query layer, and aggregation for task performance tracking.
 * Per FAAILS MPI-001.md specification.
 *
 * Design constraints:
 * - <100ms hot-path overhead (append-only write, no reads on log path)
 * - Zero PII: no agent IDs, company names, or project slugs stored
 * - Filesystem-only (no cloud dependency in v0.1)
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getWorkspacePath } from '../config/index.js';

// ── Types ──────────────────────────────────────────────────────────────────────

export type MpiTaskType = 'code' | 'content' | 'config' | 'research' | 'deploy' | 'data' | 'review' | 'other';
export type MpiFvpResult = 'pass' | 'fail' | 'loop' | 'escalated';
export type MpiOutcome = 'success' | 'partial' | 'failed';

export interface MpiEntry {
  version: 'mpi-v1';
  timestamp: string;           // ISO-8601 UTC
  task_id: string;             // UUID — not tied to real ticket ID
  task_type: MpiTaskType;
  model_used: string;          // "provider/model-name"
  router_suggestion: string;   // model the router recommended
  fvp_result: MpiFvpResult;
  fvp_loops: number;           // 0–N
  confidence_score: number;    // 0–100
  time_to_complete_ms: number;
  approx_cost_usd: number;
  agent_role: string;          // functional role only — no agent ID
  outcome: MpiOutcome;
}

export interface MpiQueryOptions {
  model?: string;
  task_type?: MpiTaskType;
  fvp_result?: MpiFvpResult;
  date_from?: string;   // ISO date string
  date_to?: string;
  limit?: number;
  root?: string;
}

export interface ModelStats {
  total_calls: number;
  fvp_pass_rate: number;
  fvp_fail_rate: number;
  fvp_loop_rate: number;
  avg_loops: number;
  avg_time_ms: number;
  avg_cost_usd: number;
  total_cost_usd: number;
  avg_confidence: number;
  top_task_types: Array<[string, number]>;
}

export interface MpiReport {
  total: number;
  models: number;
  model_stats: Record<string, ModelStats>;
  generated_at: string;
}

// ── Paths ──────────────────────────────────────────────────────────────────────

function getMpiLogPath(root?: string): string {
  return join(getWorkspacePath(root), 'logs', 'mpi', 'mpi-log.jsonl');
}

// ── PII sanitizer ──────────────────────────────────────────────────────────────

const PII_PATTERNS = [
  /\b[A-Z]{2,4}_[A-Z][a-z]+_[A-Z][a-z]+\b/g,  // Agent name: DTP_ONXZA_Backend
  /\bTICKET-\d{8}-[A-Z]+-\d+\b/g,               // Ticket IDs
  /\b(dtp|wdc|mga|mgp|mg)-[a-z-]+\b/gi,          // Agent IDs
];

function sanitizeRole(raw: string): string {
  const lower = raw.toLowerCase();
  const roleMap: Record<string, string> = {
    backend: 'backend', cli: 'cli', architect: 'architect', pm: 'pm',
    coo: 'coo', ceo: 'ceo', security: 'security', docs: 'docs',
    qa: 'qa', modelindex: 'modelindex', verification: 'verification',
    router: 'router', llm: 'llm', orchestrator: 'orchestrator',
    content: 'content', seo: 'seo', frontend: 'frontend',
    affiliate: 'affiliate', community: 'community',
  };
  for (const [key, label] of Object.entries(roleMap)) {
    if (lower.includes(key)) return label;
  }
  const parts = raw.split(/[-_]/);
  return (parts[parts.length - 1] ?? 'unknown').slice(0, 32).toLowerCase();
}

// ── Log (hot path — <100ms) ────────────────────────────────────────────────────

export interface LogMpiOptions {
  task_type?: MpiTaskType;
  model_used: string;
  router_suggestion?: string;
  fvp_result?: MpiFvpResult;
  fvp_loops?: number;
  confidence_score?: number;
  time_to_complete_ms?: number;
  approx_cost_usd?: number;
  agent_role?: string;
  outcome?: MpiOutcome;
  root?: string;
}

/**
 * Log one MPI entry. Designed for <100ms overhead:
 * single synchronous append write, no reads, no validation on hot path.
 */
export function logMpiEntry(options: LogMpiOptions): string {
  const entry: MpiEntry = {
    version:             'mpi-v1',
    timestamp:           new Date().toISOString(),
    task_id:             randomUUID(),
    task_type:           options.task_type ?? 'other',
    model_used:          options.model_used,
    router_suggestion:   options.router_suggestion ?? options.model_used,
    fvp_result:          options.fvp_result ?? 'pass',
    fvp_loops:           options.fvp_loops ?? 1,
    confidence_score:    options.confidence_score ?? 0,
    time_to_complete_ms: options.time_to_complete_ms ?? 0,
    approx_cost_usd:     options.approx_cost_usd ?? 0,
    agent_role:          sanitizeRole(options.agent_role ?? 'unknown'),
    outcome:             options.outcome ?? 'success',
  };

  const logPath = getMpiLogPath(options.root);
  mkdirSync(join(logPath, '..'), { recursive: true });
  appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8');

  return entry.task_id;
}

// ── Read & filter ──────────────────────────────────────────────────────────────

export function queryMpi(options: MpiQueryOptions = {}): MpiEntry[] {
  const logPath = getMpiLogPath(options.root);
  if (!existsSync(logPath)) return [];

  const raw = readFileSync(logPath, 'utf-8');
  const entries: MpiEntry[] = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj: Record<string, unknown>;
    try { obj = JSON.parse(trimmed); } catch { continue; }
    if ((obj['_schema'] as string) || obj['version'] !== 'mpi-v1') continue;

    const ts = String(obj['timestamp'] ?? '');
    if (options.model && !String(obj['model_used'] ?? '').toLowerCase().includes(options.model.toLowerCase())) continue;
    if (options.task_type && obj['task_type'] !== options.task_type) continue;
    if (options.fvp_result && obj['fvp_result'] !== options.fvp_result) continue;
    if (options.date_from && ts < options.date_from) continue;
    if (options.date_to && ts > options.date_to) continue;

    entries.push(obj as unknown as MpiEntry);
  }

  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return options.limit ? entries.slice(0, options.limit) : entries;
}

// ── Aggregate ──────────────────────────────────────────────────────────────────

export function aggregateMpi(options: MpiQueryOptions = {}): MpiReport {
  const entries = queryMpi(options);

  if (entries.length === 0) {
    return { total: 0, models: 0, model_stats: {}, generated_at: new Date().toISOString() };
  }

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
    s.total_loops    += e.fvp_loops;
    s.total_ms       += e.time_to_complete_ms;
    s.total_cost     += e.approx_cost_usd;
    s.confidence_sum += e.confidence_score;
    s.task_types[e.task_type] = (s.task_types[e.task_type] ?? 0) + 1;
  }

  const model_stats: Record<string, ModelStats> = {};
  for (const [m, s] of Object.entries(models)) {
    const c = s.calls;
    model_stats[m] = {
      total_calls:    c,
      fvp_pass_rate:  Math.round((s.fvp_pass / c) * 1000) / 1000,
      fvp_fail_rate:  Math.round((s.fvp_fail / c) * 1000) / 1000,
      fvp_loop_rate:  Math.round((s.fvp_loop / c) * 1000) / 1000,
      avg_loops:      Math.round((s.total_loops / c) * 100) / 100,
      avg_time_ms:    Math.round(s.total_ms / c),
      avg_cost_usd:   Math.round((s.total_cost / c) * 100000) / 100000,
      total_cost_usd: Math.round(s.total_cost * 10000) / 10000,
      avg_confidence: Math.round((s.confidence_sum / c) * 10) / 10,
      top_task_types: Object.entries(s.task_types)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
    };
  }

  return {
    total: entries.length,
    models: Object.keys(model_stats).length,
    model_stats,
    generated_at: new Date().toISOString(),
  };
}

// ── Export ─────────────────────────────────────────────────────────────────────

export function exportMpi(options: MpiQueryOptions = {}): string {
  const entries = queryMpi(options);
  return JSON.stringify(entries, null, 2);
}

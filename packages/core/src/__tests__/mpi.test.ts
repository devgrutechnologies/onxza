/**
 * @onxza/core — MPI module tests
 * Tests: logMpiEntry, queryMpi, aggregateMpi, exportMpi
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

import { logMpiEntry, queryMpi, aggregateMpi, exportMpi } from '../mpi/index.js';

// ── Test root ──────────────────────────────────────────────────────────────────

let testRoot: string;

beforeEach(() => {
  testRoot = join(tmpdir(), `onxza-mpi-test-${randomUUID()}`);
  mkdirSync(join(testRoot, 'workspace', 'logs', 'mpi'), { recursive: true });
});

afterEach(() => {
  rmSync(testRoot, { recursive: true, force: true });
});

// ── logMpiEntry ────────────────────────────────────────────────────────────────

describe('logMpiEntry', () => {
  it('returns a valid UUID task_id', () => {
    const id = logMpiEntry({
      model_used: 'anthropic/claude-sonnet-4-6',
      root: testRoot,
    });
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('creates mpi-log.jsonl file on first call', () => {
    const logPath = join(testRoot, 'workspace', 'logs', 'mpi', 'mpi-log.jsonl');
    expect(existsSync(logPath)).toBe(false);

    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', root: testRoot });
    expect(existsSync(logPath)).toBe(true);
  });

  it('appends multiple entries (one per line)', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-opus-4-6', root: testRoot });

    const entries = queryMpi({ root: testRoot });
    expect(entries).toHaveLength(3);
  });

  it('sanitizes agent_role to remove PII patterns', () => {
    logMpiEntry({
      model_used: 'anthropic/claude-sonnet-4-6',
      agent_role: 'DTP_ONXZA_Backend',
      root: testRoot,
    });

    const [entry] = queryMpi({ root: testRoot });
    // Should be sanitized to functional role only
    expect(entry?.agent_role).toBe('backend');
    expect(entry?.agent_role).not.toContain('DTP');
    expect(entry?.agent_role).not.toContain('ONXZA');
  });

  it('uses provided fvp_result', () => {
    logMpiEntry({
      model_used: 'anthropic/claude-sonnet-4-6',
      fvp_result: 'loop',
      fvp_loops: 3,
      root: testRoot,
    });

    const [entry] = queryMpi({ root: testRoot });
    expect(entry?.fvp_result).toBe('loop');
    expect(entry?.fvp_loops).toBe(3);
  });

  it('records version as mpi-v1', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', root: testRoot });
    const [entry] = queryMpi({ root: testRoot });
    expect(entry?.version).toBe('mpi-v1');
  });
});

// ── queryMpi ──────────────────────────────────────────────────────────────────

describe('queryMpi', () => {
  it('returns empty array when no log file exists', () => {
    const result = queryMpi({ root: testRoot });
    expect(result).toEqual([]);
  });

  it('filters by model', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-opus-4-6', root: testRoot });

    const sonnet = queryMpi({ model: 'sonnet', root: testRoot });
    expect(sonnet).toHaveLength(1);
    expect(sonnet[0]?.model_used).toContain('sonnet');
  });

  it('filters by task_type', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', task_type: 'code', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', task_type: 'content', root: testRoot });

    const codeEntries = queryMpi({ task_type: 'code', root: testRoot });
    expect(codeEntries).toHaveLength(1);
    expect(codeEntries[0]?.task_type).toBe('code');
  });

  it('filters by fvp_result', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', fvp_result: 'pass', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', fvp_result: 'fail', root: testRoot });

    const fails = queryMpi({ fvp_result: 'fail', root: testRoot });
    expect(fails).toHaveLength(1);
    expect(fails[0]?.fvp_result).toBe('fail');
  });

  it('respects limit', () => {
    for (let i = 0; i < 5; i++) {
      logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', root: testRoot });
    }
    const limited = queryMpi({ limit: 3, root: testRoot });
    expect(limited).toHaveLength(3);
  });

  it('returns entries sorted by timestamp descending', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-opus-4-6', root: testRoot });

    const entries = queryMpi({ root: testRoot });
    // More recent entries first
    expect(entries[0]!.timestamp >= entries[entries.length - 1]!.timestamp).toBe(true);
  });
});

// ── aggregateMpi ──────────────────────────────────────────────────────────────

describe('aggregateMpi', () => {
  it('returns empty report when no data', () => {
    const report = aggregateMpi({ root: testRoot });
    expect(report.total).toBe(0);
    expect(report.models).toBe(0);
    expect(report.model_stats).toEqual({});
  });

  it('computes correct total_calls per model', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-opus-4-6', root: testRoot });

    const report = aggregateMpi({ root: testRoot });
    expect(report.total).toBe(3);
    expect(report.models).toBe(2);
    expect(report.model_stats['anthropic/claude-sonnet-4-6']?.total_calls).toBe(2);
    expect(report.model_stats['anthropic/claude-opus-4-6']?.total_calls).toBe(1);
  });

  it('computes fvp_pass_rate correctly', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', fvp_result: 'pass', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', fvp_result: 'pass', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', fvp_result: 'fail', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', fvp_result: 'fail', root: testRoot });

    const report = aggregateMpi({ root: testRoot });
    const stats = report.model_stats['anthropic/claude-sonnet-4-6'];
    expect(stats?.fvp_pass_rate).toBe(0.5);
    expect(stats?.fvp_fail_rate).toBe(0.5);
  });

  it('computes avg_cost_usd correctly', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', approx_cost_usd: 0.01, root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', approx_cost_usd: 0.03, root: testRoot });

    const report = aggregateMpi({ root: testRoot });
    const stats = report.model_stats['anthropic/claude-sonnet-4-6'];
    expect(stats?.avg_cost_usd).toBeCloseTo(0.02, 4);
    expect(stats?.total_cost_usd).toBeCloseTo(0.04, 4);
  });

  it('tracks top_task_types', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', task_type: 'code', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', task_type: 'code', root: testRoot });
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', task_type: 'content', root: testRoot });

    const report = aggregateMpi({ root: testRoot });
    const stats = report.model_stats['anthropic/claude-sonnet-4-6'];
    expect(stats?.top_task_types[0]?.[0]).toBe('code');
    expect(stats?.top_task_types[0]?.[1]).toBe(2);
  });

  it('includes generated_at timestamp', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', root: testRoot });
    const report = aggregateMpi({ root: testRoot });
    expect(report.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ── exportMpi ─────────────────────────────────────────────────────────────────

describe('exportMpi', () => {
  it('returns valid JSON string', () => {
    logMpiEntry({ model_used: 'anthropic/claude-sonnet-4-6', root: testRoot });
    const json = exportMpi({ root: testRoot });
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('returns empty array JSON when no data', () => {
    const json = exportMpi({ root: testRoot });
    expect(JSON.parse(json)).toEqual([]);
  });

  it('exported entries include all required MPI fields', () => {
    logMpiEntry({
      model_used: 'anthropic/claude-sonnet-4-6',
      task_type: 'code',
      fvp_result: 'pass',
      confidence_score: 85,
      root: testRoot,
    });

    const entries = JSON.parse(exportMpi({ root: testRoot }));
    expect(entries).toHaveLength(1);
    const e = entries[0];
    expect(e.version).toBe('mpi-v1');
    expect(e.task_id).toBeDefined();
    expect(e.model_used).toBe('anthropic/claude-sonnet-4-6');
    expect(e.task_type).toBe('code');
    expect(e.fvp_result).toBe('pass');
    expect(e.confidence_score).toBe(85);
  });
});

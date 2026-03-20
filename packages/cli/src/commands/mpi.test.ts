/**
 * MPI CLI — Unit and Integration Tests
 *
 * Tests: schema validation, aggregator math, formatter CSV,
 *        filter chain, empty store, single-entry store.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs   from 'fs';
import path from 'path';
import os   from 'os';

// Set test store path before importing store
const TEST_MPI_DIR  = path.join(os.tmpdir(), `onxza-mpi-test-${process.pid}`);
const TEST_MPI_PATH = path.join(TEST_MPI_DIR, 'events.jsonl');
process.env['ONXZA_MPI_PATH'] = TEST_MPI_PATH;

import {
  readAllEvents, filterEvents, parseDateRange, appendEvent, readEvents,
} from '../mpi/store.js';
import {
  aggregateByModelAndType, aggregateByModel, compareModels, summarise,
} from '../mpi/aggregator.js';
import { formatJson, formatCsv } from '../mpi/formatter.js';
import { MpiEvent }               from '../mpi/schema.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<MpiEvent> = {}): Omit<MpiEvent, 'version'> {
  return {
    ts:               '2026-03-18T10:00:00.000Z',
    taskType:         'coding',
    modelUsed:        'anthropic/claude-sonnet-4-6',
    routerSuggestion: 'anthropic/claude-sonnet-4-6',
    fvpResult:        'pass',
    fvpFirstAttempt:  true,
    loopCount:        1,
    confidenceScore:  88,
    timeMs:           12000,
    approxCostUsd:    0.012,
    agentId:          'test-agent',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  fs.mkdirSync(TEST_MPI_DIR, { recursive: true });
  if (fs.existsSync(TEST_MPI_PATH)) fs.unlinkSync(TEST_MPI_PATH);
});

afterEach(() => {
  fs.rmSync(TEST_MPI_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// store.ts — parseDateRange
// ---------------------------------------------------------------------------

describe('parseDateRange', () => {
  it('parses valid range', () => {
    const r = parseDateRange('2026-03-01:2026-03-18');
    expect(r).toEqual({ dateStart: '2026-03-01', dateEnd: '2026-03-18' });
  });

  it('returns null for bad separator', () => {
    expect(parseDateRange('2026-03-01/2026-03-18')).toBeNull();
  });

  it('returns null for reversed range', () => {
    expect(parseDateRange('2026-03-18:2026-03-01')).toBeNull();
  });

  it('returns null for non-ISO dates', () => {
    expect(parseDateRange('March 1:March 18')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// store.ts — read / append / filter
// ---------------------------------------------------------------------------

describe('store — empty', () => {
  it('returns [] for non-existent file', () => {
    expect(readAllEvents()).toEqual([]);
  });
});

describe('store — append and read', () => {
  it('round-trips a single event', () => {
    appendEvent(makeEvent());
    const events = readAllEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.modelUsed).toBe('anthropic/claude-sonnet-4-6');
    expect(events[0]!.version).toBe('1');
  });

  it('appends multiple events', () => {
    appendEvent(makeEvent({ taskType: 'writing' }));
    appendEvent(makeEvent({ taskType: 'analysis' }));
    appendEvent(makeEvent({ taskType: 'coding' }));
    expect(readAllEvents()).toHaveLength(3);
  });

  it('skips malformed lines silently', () => {
    fs.writeFileSync(TEST_MPI_PATH, 'not-json\n{"ts":"2026","modelUsed":"m","taskType":"coding"}\n', 'utf8');
    expect(readAllEvents()).toHaveLength(1);
  });
});

describe('filterEvents', () => {
  beforeEach(() => {
    appendEvent(makeEvent({ modelUsed: 'anthropic/claude-sonnet-4-6', taskType: 'coding',  ts: '2026-03-10T00:00:00Z' }));
    appendEvent(makeEvent({ modelUsed: 'anthropic/claude-haiku-4-5',  taskType: 'writing', ts: '2026-03-15T00:00:00Z' }));
    appendEvent(makeEvent({ modelUsed: 'anthropic/claude-sonnet-4-6', taskType: 'writing', ts: '2026-03-20T00:00:00Z' }));
  });

  it('filters by model (partial)', () => {
    const result = readEvents({ model: 'haiku' });
    expect(result).toHaveLength(1);
    expect(result[0]!.modelUsed).toContain('haiku');
  });

  it('filters by taskType', () => {
    const result = readEvents({ taskType: 'coding' });
    expect(result).toHaveLength(1);
    expect(result[0]!.taskType).toBe('coding');
  });

  it('filters by dateStart', () => {
    const result = readEvents({ dateStart: '2026-03-14' });
    expect(result).toHaveLength(2);
  });

  it('filters by dateEnd', () => {
    const result = readEvents({ dateEnd: '2026-03-12' });
    expect(result).toHaveLength(1);
  });

  it('combines model + taskType filters', () => {
    const result = readEvents({ model: 'sonnet', taskType: 'writing' });
    expect(result).toHaveLength(1);
    expect(result[0]!.modelUsed).toContain('sonnet');
    expect(result[0]!.taskType).toBe('writing');
  });

  it('returns [] when no match', () => {
    expect(readEvents({ model: 'gpt-5-turbo-ultra' })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// aggregator.ts
// ---------------------------------------------------------------------------

describe('aggregateByModel', () => {
  beforeEach(() => {
    // 3 passes + 1 fail for sonnet
    appendEvent(makeEvent({ fvpFirstAttempt: true,  loopCount: 1, approxCostUsd: 0.01, timeMs: 10000 }));
    appendEvent(makeEvent({ fvpFirstAttempt: true,  loopCount: 1, approxCostUsd: 0.01, timeMs: 12000 }));
    appendEvent(makeEvent({ fvpFirstAttempt: true,  loopCount: 1, approxCostUsd: 0.01, timeMs: 11000 }));
    appendEvent(makeEvent({ fvpFirstAttempt: false, loopCount: 2, approxCostUsd: 0.02, timeMs: 20000 }));
    // 1 event for haiku
    appendEvent(makeEvent({ modelUsed: 'anthropic/claude-haiku-4-5', fvpFirstAttempt: true, loopCount: 1, approxCostUsd: 0.002, timeMs: 5000 }));
  });

  it('produces one slice per model', () => {
    const slices = aggregateByModel(readAllEvents());
    expect(slices).toHaveLength(2);
  });

  it('computes correct pass rate for sonnet (3/4 = 0.75)', () => {
    const slices = aggregateByModel(readAllEvents());
    const sonnet = slices.find(s => s.modelUsed.includes('sonnet'));
    expect(sonnet!.fvpFirstAttemptRate).toBeCloseTo(0.75, 5);
    expect(sonnet!.sampleCount).toBe(4);
  });

  it('computes correct avg loop count for sonnet', () => {
    const slices = aggregateByModel(readAllEvents());
    const sonnet = slices.find(s => s.modelUsed.includes('sonnet'));
    // (1+1+1+2)/4 = 1.25
    expect(sonnet!.avgLoopCount).toBeCloseTo(1.25, 5);
  });

  it('respects minSamples', () => {
    const slices = aggregateByModel(readAllEvents(), 2);
    // haiku has 1 event — excluded
    expect(slices.every(s => s.sampleCount >= 2)).toBe(true);
  });
});

describe('aggregateByModelAndType', () => {
  beforeEach(() => {
    appendEvent(makeEvent({ taskType: 'coding',  fvpFirstAttempt: true }));
    appendEvent(makeEvent({ taskType: 'writing', fvpFirstAttempt: false }));
    appendEvent(makeEvent({ taskType: 'coding',  fvpFirstAttempt: true }));
  });

  it('produces one slice per model×type pair', () => {
    const slices = aggregateByModelAndType(readAllEvents());
    expect(slices).toHaveLength(2);
  });

  it('coding slice has 2 samples, pass rate 1.0', () => {
    const slices = aggregateByModelAndType(readAllEvents());
    const coding = slices.find(s => s.taskType === 'coding');
    expect(coding!.sampleCount).toBe(2);
    expect(coding!.fvpFirstAttemptRate).toBe(1.0);
  });

  it('writing slice has 1 sample, pass rate 0.0', () => {
    const slices = aggregateByModelAndType(readAllEvents());
    const writing = slices.find(s => s.taskType === 'writing');
    expect(writing!.sampleCount).toBe(1);
    expect(writing!.fvpFirstAttemptRate).toBe(0.0);
  });
});

describe('compareModels', () => {
  beforeEach(() => {
    appendEvent(makeEvent({ modelUsed: 'anthropic/claude-sonnet-4-6', fvpFirstAttempt: true }));
    appendEvent(makeEvent({ modelUsed: 'anthropic/claude-haiku-4-5',  fvpFirstAttempt: false }));
  });

  it('returns two MpiSlices', () => {
    const { modelA, modelB } = compareModels(readAllEvents(), 'sonnet', 'haiku');
    expect(modelA.sampleCount).toBe(1);
    expect(modelB.sampleCount).toBe(1);
  });

  it('sonnet has higher pass rate than haiku', () => {
    const { modelA, modelB } = compareModels(readAllEvents(), 'sonnet', 'haiku');
    expect(modelA.fvpFirstAttemptRate).toBeGreaterThan(modelB.fvpFirstAttemptRate);
  });
});

describe('summarise', () => {
  it('returns zeros for empty array', () => {
    const s = summarise([]);
    expect(s.totalSamples).toBe(0);
    expect(s.overallPassRate).toBe(0);
  });

  it('weighted average across slices', () => {
    const slices = aggregateByModel([
      { ...makeEvent({ fvpFirstAttempt: true }), version: '1' } as MpiEvent,
      { ...makeEvent({ modelUsed: 'anthropic/claude-haiku-4-5', fvpFirstAttempt: false }), version: '1' } as MpiEvent,
    ]);
    const s = summarise(slices);
    expect(s.totalSamples).toBe(2);
    // 1 pass out of 2 → 0.5
    expect(s.overallPassRate).toBeCloseTo(0.5, 5);
  });
});

// ---------------------------------------------------------------------------
// formatter.ts — JSON and CSV
// ---------------------------------------------------------------------------

describe('formatJson', () => {
  it('produces valid JSON', () => {
    appendEvent(makeEvent());
    const slices = aggregateByModel(readAllEvents());
    const json = formatJson(slices);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('JSON contains slices and summary', () => {
    appendEvent(makeEvent());
    const slices = aggregateByModel(readAllEvents());
    const parsed = JSON.parse(formatJson(slices)) as { slices: unknown[]; summary: { totalSamples: number } };
    expect(parsed.slices).toHaveLength(1);
    expect(parsed.summary.totalSamples).toBe(1);
  });
});

describe('formatCsv', () => {
  it('first row is headers', () => {
    appendEvent(makeEvent());
    const slices = aggregateByModel(readAllEvents());
    const csv  = formatCsv(slices);
    const rows = csv.split('\r\n').filter(Boolean);
    expect(rows[0]).toContain('model');
    expect(rows[0]).toContain('fvpFirstAttemptRatePct');
    expect(rows[0]).toContain('avgCostUsd');
  });

  it('data row follows headers', () => {
    appendEvent(makeEvent({ approxCostUsd: 0.012 }));
    const slices = aggregateByModel(readAllEvents());
    const rows = formatCsv(slices).split('\r\n').filter(Boolean);
    expect(rows).toHaveLength(2);                  // header + 1 data row
    expect(rows[1]).toContain('claude-sonnet-4-6');
  });

  it('escapes commas in values', () => {
    const slices = [{ modelUsed: 'model,with,commas', taskType: 'coding' as const, sampleCount: 1, fvpFirstAttemptRate: 1, avgLoopCount: 1, avgConfidenceScore: 90, avgCostUsd: 0.01, avgTimeMs: 1000, routerMatchRate: 1 }];
    const csv = formatCsv(slices);
    expect(csv).toContain('"model,with,commas"');
  });
});

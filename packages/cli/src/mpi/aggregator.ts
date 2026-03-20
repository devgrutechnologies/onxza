/**
 * MPI Aggregator — compute sliced metrics from raw event arrays.
 *
 * Produces MpiSlice objects grouped by (model × taskType) or
 * collapsed across one dimension.
 *
 * All arithmetic uses simple means — no weighted averages in v0.1.
 * Confidence interval and percentile support is deferred to v0.5.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { MpiEvent, MpiSlice, TaskType } from './schema.js';

// ---------------------------------------------------------------------------
// Core stats helper
// ---------------------------------------------------------------------------

function mean(vals: number[]): number {
  if (vals.length === 0) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function sliceFromEvents(
  events: MpiEvent[],
  model: string,
  taskType: TaskType | 'all',
): MpiSlice {
  const n = events.length;
  if (n === 0) {
    return {
      modelUsed: model, taskType, sampleCount: 0,
      fvpFirstAttemptRate: 0, avgLoopCount: 0,
      avgConfidenceScore: 0, avgCostUsd: 0,
      avgTimeMs: 0, routerMatchRate: 0,
    };
  }

  const firstAttemptPasses = events.filter(e => e.fvpFirstAttempt).length;
  const routerMatches      = events.filter(e =>
    e.routerSuggestion !== null && e.routerSuggestion === e.modelUsed
  ).length;
  const routerConsulted = events.filter(e => e.routerSuggestion !== null).length;

  return {
    modelUsed:           model,
    taskType,
    sampleCount:         n,
    fvpFirstAttemptRate: firstAttemptPasses / n,
    avgLoopCount:        mean(events.map(e => e.loopCount)),
    avgConfidenceScore:  mean(events.map(e => e.confidenceScore)),
    avgCostUsd:          mean(events.map(e => e.approxCostUsd)),
    avgTimeMs:           mean(events.map(e => e.timeMs)),
    routerMatchRate:     routerConsulted > 0 ? routerMatches / routerConsulted : 0,
  };
}

// ---------------------------------------------------------------------------
// Public aggregation functions
// ---------------------------------------------------------------------------

/**
 * Group events by model × taskType. Returns one MpiSlice per unique pair.
 * minSamples: omit slices with fewer than N events.
 */
export function aggregateByModelAndType(
  events: MpiEvent[],
  minSamples: number = 1,
): MpiSlice[] {
  // Build groups
  const groups = new Map<string, MpiEvent[]>();

  for (const e of events) {
    const key = `${e.modelUsed}|||${e.taskType}`;
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  const slices: MpiSlice[] = [];
  for (const [key, evts] of groups.entries()) {
    if (evts.length < minSamples) continue;
    const [model, taskType] = key.split('|||') as [string, TaskType];
    slices.push(sliceFromEvents(evts, model, taskType));
  }

  return slices.sort((a, b) =>
    a.modelUsed.localeCompare(b.modelUsed) || a.taskType.localeCompare(b.taskType)
  );
}

/**
 * Group events by model only (collapse taskType dimension).
 */
export function aggregateByModel(
  events: MpiEvent[],
  minSamples: number = 1,
): MpiSlice[] {
  const groups = new Map<string, MpiEvent[]>();
  for (const e of events) {
    const arr = groups.get(e.modelUsed) ?? [];
    arr.push(e);
    groups.set(e.modelUsed, arr);
  }

  const slices: MpiSlice[] = [];
  for (const [model, evts] of groups.entries()) {
    if (evts.length < minSamples) continue;
    slices.push(sliceFromEvents(evts, model, 'all'));
  }

  return slices.sort((a, b) => b.fvpFirstAttemptRate - a.fvpFirstAttemptRate);
}

/**
 * Build a comparison view: two named models side-by-side for a given task type.
 * Returns { modelA: MpiSlice, modelB: MpiSlice }.
 */
export function compareModels(
  events: MpiEvent[],
  modelA: string,
  modelB: string,
): { modelA: MpiSlice; modelB: MpiSlice } {
  const matchA = events.filter(e => e.modelUsed.toLowerCase().includes(modelA.toLowerCase()));
  const matchB = events.filter(e => e.modelUsed.toLowerCase().includes(modelB.toLowerCase()));

  const labelA = matchA.length > 0 ? matchA[0]!.modelUsed : modelA;
  const labelB = matchB.length > 0 ? matchB[0]!.modelUsed : modelB;

  return {
    modelA: sliceFromEvents(matchA, labelA, 'all'),
    modelB: sliceFromEvents(matchB, labelB, 'all'),
  };
}

/**
 * Summarise a slice array into overall totals (for footer line).
 */
export function summarise(slices: MpiSlice[]): {
  totalSamples:       number;
  overallPassRate:    number;
  overallAvgLoops:    number;
  overallAvgCostUsd:  number;
} {
  const total = slices.reduce((s, sl) => s + sl.sampleCount, 0);
  if (total === 0) {
    return { totalSamples: 0, overallPassRate: 0, overallAvgLoops: 0, overallAvgCostUsd: 0 };
  }
  const weightedPass  = slices.reduce((s, sl) => s + sl.fvpFirstAttemptRate * sl.sampleCount, 0);
  const weightedLoops = slices.reduce((s, sl) => s + sl.avgLoopCount * sl.sampleCount, 0);
  const weightedCost  = slices.reduce((s, sl) => s + sl.avgCostUsd * sl.sampleCount, 0);
  return {
    totalSamples:      total,
    overallPassRate:   weightedPass  / total,
    overallAvgLoops:   weightedLoops / total,
    overallAvgCostUsd: weightedCost  / total,
  };
}

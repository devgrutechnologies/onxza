/**
 * MPI Seed Data Generator
 *
 * Generates realistic MPI events for testing and demo.
 * Invoked by `onxza mpi seed [--count N]`.
 *
 * Models and task types mirror the real DevGru fleet.
 * Pass rates, loop counts, and costs reflect realistic but fictional values.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { appendEvent, ensureMpiStoreDir } from './store.js';
import { MpiEvent, TASK_TYPES, TaskType } from './schema.js';

const SEED_MODELS = [
  'anthropic/claude-opus-4-6',
  'anthropic/claude-sonnet-4-6',
  'anthropic/claude-haiku-4-5',
  'openai/gpt-4o',
  'ollama/qwen2.5-7b',
] as const;

// Per-model baseline pass rates (realistic fiction)
const MODEL_PASS_RATES: Record<string, number> = {
  'anthropic/claude-opus-4-6':   0.91,
  'anthropic/claude-sonnet-4-6': 0.82,
  'anthropic/claude-haiku-4-5':  0.71,
  'openai/gpt-4o':               0.79,
  'ollama/qwen2.5-7b':           0.61,
};

// Per-model avg cost per task in USD
const MODEL_COSTS: Record<string, number> = {
  'anthropic/claude-opus-4-6':   0.0480,
  'anthropic/claude-sonnet-4-6': 0.0120,
  'anthropic/claude-haiku-4-5':  0.0018,
  'openai/gpt-4o':               0.0200,
  'ollama/qwen2.5-7b':           0.0000,
};

// Per-task-type avg time in ms
const TYPE_TIMES: Record<string, number> = {
  writing:      8_400,
  analysis:    12_200,
  coding:      18_600,
  verification: 5_100,
  routing:      1_800,
  other:        9_000,
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

/**
 * Generate N seed events and append to the store.
 * @param count Number of events to generate (default: 50)
 */
export function seedMpiData(count: number = 50): void {
  ensureMpiStoreDir();

  for (let i = 0; i < count; i++) {
    const model        = pick(SEED_MODELS);
    const taskType     = pick(TASK_TYPES) as TaskType;
    const basePassRate = MODEL_PASS_RATES[model] ?? 0.75;

    // Slight variance per task type
    const taskVariance = taskType === 'coding' ? -0.05 : taskType === 'routing' ? 0.04 : 0;
    const passRate     = Math.min(0.99, Math.max(0.1, basePassRate + taskVariance));

    const fvpFirstAttempt = Math.random() < passRate;
    const loopCount       = fvpFirstAttempt ? 1 : randInt(2, 3);
    const fvpResult       = loopCount <= 3 ? 'pass' : 'fail';

    const baseCost  = MODEL_COSTS[model] ?? 0.005;
    const baseTime  = TYPE_TIMES[taskType] ?? 9_000;

    // Use deterministic router suggestion for ~60% of tasks
    const consultRouter   = Math.random() < 0.60;
    const routerSuggestion = consultRouter
      ? (Math.random() < 0.65 ? model : pick(SEED_MODELS))  // 65% router is right
      : null;

    appendEvent({
      ts:                isoDate(randInt(0, 30)),
      taskType,
      modelUsed:         model,
      routerSuggestion,
      fvpResult:         fvpResult as 'pass' | 'fail',
      fvpFirstAttempt,
      loopCount,
      confidenceScore:   fvpFirstAttempt
        ? randInt(75, 98)
        : randInt(45, 74),
      timeMs:            rand(baseTime * 0.7, baseTime * 1.5) * loopCount,
      approxCostUsd:     baseCost * loopCount * rand(0.8, 1.3),
      agentId:           `seed-agent-${randInt(1, 10)}`,
    });
  }
}

/**
 * MPI Event Schema — Model Performance Index
 *
 * One JSONL record per task completion. Written by agents on task close;
 * read by `onxza mpi report`.
 *
 * Storage: ~/.onxza/mpi/events.jsonl (append-only)
 * Override: ONXZA_MPI_PATH env var
 *
 * Design: schema is intentionally flat and small. No company/project names —
 * all identifiers are anonymisable for future FAAILS community publication.
 *
 * Spec: MPI-001.md · TICKET-20260318-DTP-020
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

export const MPI_SCHEMA_VERSION = '1' as const;

export const TASK_TYPES = [
  'writing',
  'analysis',
  'coding',
  'verification',
  'routing',
  'other',
] as const;
export type TaskType = typeof TASK_TYPES[number];

export const FVP_RESULTS = ['pass', 'fail'] as const;
export type FvpResult = typeof FVP_RESULTS[number];

/** A single MPI event record (one per completed task). */
export interface MpiEvent {
  /** Schema version — always '1' for this iteration. */
  version: typeof MPI_SCHEMA_VERSION;
  /** ISO-8601 timestamp of task completion. */
  ts: string;
  /** Broad task category. */
  taskType: TaskType;
  /** Full model reference, e.g. "anthropic/claude-sonnet-4-6". */
  modelUsed: string;
  /** Router's suggested model (null if router was not consulted). */
  routerSuggestion: string | null;
  /** Overall FVP gate result. */
  fvpResult: FvpResult;
  /** True if FVP passed on the first attempt (loop count = 1). */
  fvpFirstAttempt: boolean;
  /** Number of FVP loops required (1 = first attempt pass). */
  loopCount: number;
  /** Agent's self-reported confidence score (0–100). */
  confidenceScore: number;
  /** Wall-clock milliseconds from task start to task close. */
  timeMs: number;
  /** Approximate USD cost of LLM calls for this task. */
  approxCostUsd: number;
  /** Anonymised agent ID (can be hashed for external publishing). */
  agentId: string;
}

/** Aggregated stats for a single (model × taskType) slice. */
export interface MpiSlice {
  modelUsed:             string;
  taskType:              TaskType | 'all';
  sampleCount:           number;
  fvpFirstAttemptRate:   number;   // 0–1
  avgLoopCount:          number;
  avgConfidenceScore:    number;   // 0–100
  avgCostUsd:            number;
  avgTimeMs:             number;
  routerMatchRate:       number;   // % where router suggestion matched model used
}

/** Filter options passed to the store reader. */
export interface MpiFilter {
  model?:      string;       // partial match on modelUsed
  taskType?:   TaskType;
  dateStart?:  string;       // ISO date string YYYY-MM-DD
  dateEnd?:    string;
  minSamples?: number;
}

/** Validated CLI options for `onxza mpi report`. */
export interface MpiReportOptions {
  model?:      string;
  taskType?:   TaskType;
  dateRange?:  string;       // raw "start:end" string before parse
  format:      'table' | 'json' | 'csv';
  compare?:    string;       // "modelA,modelB"
  export?:     string;       // file path
  minSamples:  number;
}

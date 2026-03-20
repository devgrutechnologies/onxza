/**
 * Script Engine Schema — type definitions for onxza script commands.
 *
 * Scripts are automation artifacts classified by tier (ARCHITECTURE.md §10.2):
 *   Tier 1 — LLM reasoning required
 *   Tier 2 — Script + LLM hybrid
 *   Tier 3 — Pure script/cron (zero LLM tokens — goal state)
 *
 * The push-to-Tier-3 principle: every repeatable task that can be automated
 * to a script must be, over time. Tier 1 → Tier 2 → Tier 3 is the cost
 * reduction path for every agent workflow.
 *
 * Spec: ARCHITECTURE.md §10.2 · TICKET-20260318-DTP-025
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

export type ScriptTier = 1 | 2 | 3;
export type ScriptLanguage = 'bash' | 'python' | 'node' | 'other';

export const SCRIPT_TIERS: ScriptTier[]     = [1, 2, 3];
export const SCRIPT_LANGUAGES: ScriptLanguage[] = ['bash', 'python', 'node', 'other'];

export const TIER_DESCRIPTIONS: Record<ScriptTier, string> = {
  1: 'LLM reasoning required (no script yet)',
  2: 'Script + LLM hybrid (script handles mechanics, LLM handles judgment)',
  3: 'Pure script/cron (zero LLM tokens — cost optimal)',
};

export const LANGUAGE_EXTENSIONS: Record<ScriptLanguage, string> = {
  bash:   '.sh',
  python: '.py',
  node:   '.js',
  other:  '.sh',
};

export const LANGUAGE_RUNNERS: Record<ScriptLanguage, string> = {
  bash:   'bash',
  python: 'python3',
  node:   'node',
  other:  'bash',
};

/** A registered script entry in the registry. */
export interface ScriptEntry {
  /** Unique slug: lowercase alphanumeric + hyphens, e.g. "daily-blog-deploy". */
  name:          string;
  /** Absolute path to the script file on disk. */
  path:          string;
  /** Automation tier (1, 2, or 3). */
  tier:          ScriptTier;
  /** Short description of what the script does. */
  description:   string;
  /** Script language / interpreter. */
  language:      ScriptLanguage;
  /** ISO date of registration, e.g. "2026-03-18". */
  created:       string;
  /** ISO timestamp of most recent run. Null if never run. */
  lastRun:       string | null;
  /** Total number of times the script has been run via `onxza script run`. */
  runCount:      number;
  /** Number of runs that exited with code 0. */
  successCount:  number;
  /** Number of runs that exited with non-zero code or timed out. */
  failCount:     number;
  /** Rolling average duration of all runs in milliseconds. */
  avgDurationMs: number;
}

/** Result of a single script execution. */
export interface ScriptRunResult {
  name:        string;
  exitCode:    number;
  stdout:      string;
  stderr:      string;
  durationMs:  number;
  ts:          string;   // ISO timestamp of run start
  success:     boolean;
  timedOut:    boolean;
  dryRun:      boolean;
  blocked:     boolean;  // true if safety rules blocked execution
  blockReason: string | null;
}

/** Options passed to the runner. */
export interface ScriptRunOptions {
  dryRun:          boolean;
  timeoutSeconds:  number;
  extraArgs:       string[];
}

/** Metadata parsed from a script file's frontmatter comment header. */
export interface ScriptFileMeta {
  name?:        string;
  tier?:        ScriptTier;
  description?: string;
  language?:    ScriptLanguage;
  created?:     string;
}

/** Threshold for push-to-Tier-3 recommendation. */
export const PROMOTION_THRESHOLD = {
  minRunCount:     5,
  minSuccessRate:  0.9,
  maxTierToPromote: 2 as ScriptTier,
} as const;

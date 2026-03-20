/**
 * Script Registry — CRUD against ~/.onxza/scripts/registry.json
 *
 * Stored separately from the workspace so it survives workspace resets
 * and stays out of git (same pattern as the skill registry).
 *
 * Override path: ONXZA_SCRIPTS_REGISTRY env var.
 * Override script dir: ONXZA_SCRIPTS_PATH env var.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import fs   from 'fs';
import path from 'path';
import os   from 'os';
import {
  ScriptEntry, ScriptRunResult,
  SCRIPT_TIERS, type ScriptTier,
  PROMOTION_THRESHOLD,
} from './schema.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ONXZA_HOME = process.env['ONXZA_HOME']
  ?? path.join(os.homedir(), '.onxza');

export function getRegistryPath(): string {
  return process.env['ONXZA_SCRIPTS_REGISTRY']
    ?? path.join(ONXZA_HOME, 'scripts', 'registry.json');
}

export function getScriptsDir(): string {
  return process.env['ONXZA_SCRIPTS_PATH']
    ?? path.join(os.homedir(), '.openclaw', 'workspace', 'scripts');
}

// ---------------------------------------------------------------------------
// Registry shape
// ---------------------------------------------------------------------------

interface Registry {
  version: 1;
  scripts: Record<string, ScriptEntry>;
}

// ---------------------------------------------------------------------------
// Load / save
// ---------------------------------------------------------------------------

function loadRegistry(): Registry {
  const p = getRegistryPath();
  if (!fs.existsSync(p)) return { version: 1, scripts: {} };
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as Registry;
    return raw;
  } catch {
    return { version: 1, scripts: {} };
  }
}

function saveRegistry(reg: Registry): void {
  const p = getRegistryPath();
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(reg, null, 2) + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Return all registered scripts, sorted by tier asc, name asc. */
export function listScripts(filterTier?: ScriptTier): ScriptEntry[] {
  const reg = loadRegistry();
  let entries = Object.values(reg.scripts);
  if (filterTier !== undefined) {
    entries = entries.filter(e => e.tier === filterTier);
  }
  return entries.sort((a, b) =>
    a.tier - b.tier || a.name.localeCompare(b.name)
  );
}

/** Get a single script by name. Returns null if not found. */
export function getScript(name: string): ScriptEntry | null {
  const reg = loadRegistry();
  return reg.scripts[name] ?? null;
}

/** Check if a script name is registered. */
export function scriptExists(name: string): boolean {
  return getScript(name) !== null;
}

/**
 * Register or update a script entry.
 * Safe to call multiple times — idempotent upsert.
 */
export function registerScript(entry: ScriptEntry): void {
  const reg = loadRegistry();
  reg.scripts[entry.name] = entry;
  saveRegistry(reg);
}

/**
 * Update run history after a script execution.
 * Updates lastRun, runCount, successCount/failCount, and rolling avgDurationMs.
 */
export function recordRun(name: string, result: ScriptRunResult): void {
  const reg = loadRegistry();
  const entry = reg.scripts[name];
  if (!entry) return;   // silently skip if not in registry

  entry.lastRun     = result.ts;
  entry.runCount   += 1;
  if (result.success) {
    entry.successCount += 1;
  } else {
    entry.failCount += 1;
  }
  // Rolling average (cumulative mean)
  entry.avgDurationMs = entry.runCount === 1
    ? result.durationMs
    : (entry.avgDurationMs * (entry.runCount - 1) + result.durationMs) / entry.runCount;

  reg.scripts[name] = entry;
  saveRegistry(reg);
}

/** Remove a script from the registry (does not delete the file). */
export function unregisterScript(name: string): boolean {
  const reg = loadRegistry();
  if (!reg.scripts[name]) return false;
  delete reg.scripts[name];
  saveRegistry(reg);
  return true;
}

// ---------------------------------------------------------------------------
// Push-to-Tier-3 promotion analysis
// ---------------------------------------------------------------------------

/** Returns true if this script meets promotion criteria. */
export function isPromotionCandidate(entry: ScriptEntry): boolean {
  if (entry.tier >= PROMOTION_THRESHOLD.maxTierToPromote + 1) return false;
  if (entry.runCount < PROMOTION_THRESHOLD.minRunCount) return false;
  const successRate = entry.runCount > 0
    ? entry.successCount / entry.runCount
    : 0;
  return successRate >= PROMOTION_THRESHOLD.minSuccessRate;
}

/** Compute success rate (0–1) for a script entry. */
export function successRate(entry: ScriptEntry): number {
  if (entry.runCount === 0) return 0;
  return entry.successCount / entry.runCount;
}

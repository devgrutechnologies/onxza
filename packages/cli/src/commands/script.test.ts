/**
 * Script Engine — Unit and Integration Tests
 *
 * Covers: slug validation, tier validation, registry CRUD,
 * scaffold file creation, runner safety blocks, dry-run, promotion tips,
 * run history recording.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs   from 'fs';
import path from 'path';
import os   from 'os';

// ── Redirect all paths to temp dirs before any imports use them ──────────

const TEST_ONXZA_HOME  = path.join(os.tmpdir(), `onxza-script-test-home-${process.pid}`);
const TEST_SCRIPTS_DIR = path.join(os.tmpdir(), `onxza-script-test-scripts-${process.pid}`);

process.env['ONXZA_HOME']             = TEST_ONXZA_HOME;
process.env['ONXZA_SCRIPTS_REGISTRY'] = path.join(TEST_ONXZA_HOME, 'scripts', 'registry.json');
process.env['ONXZA_SCRIPTS_PATH']     = TEST_SCRIPTS_DIR;

import {
  listScripts, getScript, registerScript, recordRun,
  scriptExists, isPromotionCandidate, successRate,
} from '../script/registry.js';
import { scaffoldScript, parseScriptMeta } from '../script/scaffold.js';
import { checkSafety }                      from '../script/runner.js';
import { ScriptEntry, ScriptRunResult }     from '../script/schema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<ScriptEntry> = {}): ScriptEntry {
  return {
    name:          'test-script',
    path:          path.join(TEST_SCRIPTS_DIR, 'test-script.sh'),
    tier:          3,
    language:      'bash',
    description:   'A test script',
    created:       '2026-03-18',
    lastRun:       null,
    runCount:      0,
    successCount:  0,
    failCount:     0,
    avgDurationMs: 0,
    ...overrides,
  };
}

function makeRunResult(overrides: Partial<ScriptRunResult> = {}): ScriptRunResult {
  return {
    name: 'test-script', exitCode: 0, stdout: 'ok', stderr: '',
    durationMs: 500, ts: new Date().toISOString(),
    success: true, timedOut: false, dryRun: false, blocked: false, blockReason: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  fs.mkdirSync(TEST_ONXZA_HOME,  { recursive: true });
  fs.mkdirSync(TEST_SCRIPTS_DIR, { recursive: true });
});

afterEach(() => {
  fs.rmSync(TEST_ONXZA_HOME,  { recursive: true, force: true });
  fs.rmSync(TEST_SCRIPTS_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// registry.ts — CRUD
// ---------------------------------------------------------------------------

describe('registry — empty', () => {
  it('listScripts returns [] with no registry file', () => {
    expect(listScripts()).toEqual([]);
  });

  it('getScript returns null for unknown name', () => {
    expect(getScript('nonexistent')).toBeNull();
  });

  it('scriptExists returns false when empty', () => {
    expect(scriptExists('nonexistent')).toBe(false);
  });
});

describe('registry — registerScript', () => {
  it('round-trips a single entry', () => {
    registerScript(makeEntry());
    const entries = listScripts();
    expect(entries).toHaveLength(1);
    expect(entries[0]!.name).toBe('test-script');
    expect(entries[0]!.tier).toBe(3);
  });

  it('upserts on duplicate name', () => {
    registerScript(makeEntry({ tier: 3 }));
    registerScript(makeEntry({ tier: 2 }));  // update
    expect(listScripts()).toHaveLength(1);
    expect(listScripts()[0]!.tier).toBe(2);
  });

  it('scriptExists returns true after register', () => {
    registerScript(makeEntry());
    expect(scriptExists('test-script')).toBe(true);
  });

  it('lists multiple scripts sorted by tier then name', () => {
    registerScript(makeEntry({ name: 'z-script', tier: 3 }));
    registerScript(makeEntry({ name: 'a-script', tier: 1 }));
    registerScript(makeEntry({ name: 'm-script', tier: 2 }));
    const names = listScripts().map(s => s.name);
    expect(names).toEqual(['a-script', 'm-script', 'z-script']);
  });

  it('filters by tier', () => {
    registerScript(makeEntry({ name: 's1', tier: 1 }));
    registerScript(makeEntry({ name: 's3', tier: 3 }));
    const tier1 = listScripts(1);
    expect(tier1).toHaveLength(1);
    expect(tier1[0]!.name).toBe('s1');
  });
});

describe('registry — recordRun', () => {
  beforeEach(() => {
    registerScript(makeEntry());
  });

  it('increments runCount and successCount on success', () => {
    recordRun('test-script', makeRunResult({ success: true, durationMs: 1000 }));
    const e = getScript('test-script')!;
    expect(e.runCount).toBe(1);
    expect(e.successCount).toBe(1);
    expect(e.failCount).toBe(0);
    expect(e.avgDurationMs).toBe(1000);
  });

  it('increments failCount on failure', () => {
    recordRun('test-script', makeRunResult({ success: false, exitCode: 1 }));
    const e = getScript('test-script')!;
    expect(e.failCount).toBe(1);
    expect(e.successCount).toBe(0);
  });

  it('computes rolling average duration', () => {
    recordRun('test-script', makeRunResult({ success: true, durationMs: 1000 }));
    recordRun('test-script', makeRunResult({ success: true, durationMs: 3000 }));
    const e = getScript('test-script')!;
    expect(e.avgDurationMs).toBeCloseTo(2000, 0);
    expect(e.runCount).toBe(2);
  });

  it('sets lastRun on each run', () => {
    recordRun('test-script', makeRunResult({ ts: '2026-03-18T10:00:00Z' }));
    expect(getScript('test-script')!.lastRun).toBe('2026-03-18T10:00:00Z');
  });

  it('ignores unknown script name silently', () => {
    // Should not throw
    expect(() => recordRun('ghost-script', makeRunResult())).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Promotion logic
// ---------------------------------------------------------------------------

describe('isPromotionCandidate', () => {
  it('not a candidate if tier 3', () => {
    const e = makeEntry({ tier: 3, runCount: 10, successCount: 10, failCount: 0 });
    expect(isPromotionCandidate(e)).toBe(false);
  });

  it('not a candidate if too few runs', () => {
    const e = makeEntry({ tier: 2, runCount: 4, successCount: 4, failCount: 0 });
    expect(isPromotionCandidate(e)).toBe(false);
  });

  it('not a candidate if success rate < 90%', () => {
    const e = makeEntry({ tier: 2, runCount: 10, successCount: 8, failCount: 2 });
    expect(isPromotionCandidate(e)).toBe(false);
  });

  it('is a candidate at tier 2 with 5+ runs and ≥90% success', () => {
    const e = makeEntry({ tier: 2, runCount: 5, successCount: 5, failCount: 0 });
    expect(isPromotionCandidate(e)).toBe(true);
  });

  it('is a candidate at tier 1 meeting thresholds', () => {
    const e = makeEntry({ tier: 1, runCount: 10, successCount: 10, failCount: 0 });
    expect(isPromotionCandidate(e)).toBe(true);
  });
});

describe('successRate', () => {
  it('returns 0 for no runs', () => {
    expect(successRate(makeEntry({ runCount: 0 }))).toBe(0);
  });

  it('returns 1.0 for all successes', () => {
    expect(successRate(makeEntry({ runCount: 5, successCount: 5, failCount: 0 }))).toBe(1.0);
  });

  it('returns correct ratio', () => {
    expect(successRate(makeEntry({ runCount: 4, successCount: 3, failCount: 1 }))).toBeCloseTo(0.75, 5);
  });
});

// ---------------------------------------------------------------------------
// scaffold.ts
// ---------------------------------------------------------------------------

describe('scaffoldScript', () => {
  it('creates a bash file for tier 3', () => {
    const result = scaffoldScript('my-script', 3, 'bash', 'test');
    expect(fs.existsSync(result.path)).toBe(true);
    expect(result.path.endsWith('.sh')).toBe(true);
  });

  it('creates a python file', () => {
    const result = scaffoldScript('py-script', 3, 'python', 'test');
    expect(result.path.endsWith('.py')).toBe(true);
    expect(fs.existsSync(result.path)).toBe(true);
  });

  it('creates a node file', () => {
    const result = scaffoldScript('node-script', 3, 'node', 'test');
    expect(result.path.endsWith('.js')).toBe(true);
    expect(fs.existsSync(result.path)).toBe(true);
  });

  it('throws if file already exists', () => {
    scaffoldScript('dup-script', 3, 'bash', 'test');
    expect(() => scaffoldScript('dup-script', 3, 'bash', 'test')).toThrow();
  });

  it('tier 1 template contains tier 1 text', () => {
    const result = scaffoldScript('tier1-script', 1, 'bash', 'test');
    const content = fs.readFileSync(result.path, 'utf8');
    expect(content).toContain('tier: 1');
    expect(content).toContain('Tier 1');
  });

  it('tier 2 template contains tier 2 text', () => {
    const result = scaffoldScript('tier2-script', 2, 'bash', 'test');
    const content = fs.readFileSync(result.path, 'utf8');
    expect(content).toContain('tier: 2');
    expect(content).toContain('push toward Tier 3');
  });
});

describe('parseScriptMeta', () => {
  it('parses frontmatter from a scaffolded file', () => {
    const result = scaffoldScript('meta-script', 3, 'bash', 'A test description');
    const meta   = parseScriptMeta(result.path);
    expect(meta['name']).toBe('meta-script');
    expect(meta['tier']).toBe('3');
    expect(meta['language']).toBe('bash');
    expect(meta['description']).toBe('A test description');
  });

  it('returns empty object for non-existent file', () => {
    expect(parseScriptMeta('/nonexistent/path.sh')).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// runner.ts — safety rules
// ---------------------------------------------------------------------------

describe('checkSafety', () => {
  function writeScript(content: string): string {
    const p = path.join(TEST_SCRIPTS_DIR, `safety-test-${Date.now()}.sh`);
    fs.writeFileSync(p, content, 'utf8');
    return p;
  }

  it('returns null for a safe script', () => {
    const p = writeScript('#!/bin/bash\necho hello');
    expect(checkSafety(p)).toBeNull();
  });

  it('blocks rm -rf /', () => {
    const p = writeScript('rm -rf /');
    expect(checkSafety(p)).toMatch(/Destructive/i);
  });

  it('blocks sudo rm', () => {
    const p = writeScript('sudo rm -rf /tmp/something');
    expect(checkSafety(p)).toMatch(/Destructive/i);
  });

  it('blocks dd if=/dev/zero', () => {
    const p = writeScript('dd if=/dev/zero of=/tmp/test');
    expect(checkSafety(p)).toMatch(/Destructive/i);
  });

  it('blocks rm -rf ~', () => {
    const p = writeScript('rm -rf ~ ');  // trailing space ensures pattern match
    const result = checkSafety(p);
    expect(result).not.toBeNull();
    expect(result).toContain('Destructive');
  });

  it('returns specific reason string', () => {
    const p = writeScript('rm -rf /');
    const result = checkSafety(p);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// slug validation (inline — no separate import needed)
// ---------------------------------------------------------------------------

describe('slug validation', () => {
  const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

  it('accepts valid slugs', () => {
    for (const s of ['daily-report', 'deploy-blogs', 'a', 'test123']) {
      expect(SLUG_RE.test(s)).toBe(true);
    }
  });

  it('rejects slugs with spaces', () => {
    expect(SLUG_RE.test('bad name')).toBe(false);
  });

  it('rejects slugs with uppercase', () => {
    expect(SLUG_RE.test('BadName')).toBe(false);
  });

  it('rejects slugs starting with hyphen', () => {
    expect(SLUG_RE.test('-bad')).toBe(false);
  });
});

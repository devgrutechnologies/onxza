/**
 * @onxza/core — Config module tests
 * Tests: getOpenclawRoot, getConfigPath, readConfig, requireConfig, writeConfig,
 *        seedConfig, registerAgent, removeAgent, getAgent, listAgents,
 *        registerCompany, getCompany, listCompanies, setActiveCompany,
 *        migrateConfig, getSchemaVersion
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getOpenclawRoot,
  getConfigPath,
  getWorkspacePath,
  readConfig,
  requireConfig,
  writeConfig,
  seedConfig,
  registerAgent,
  removeAgent,
  getAgent,
  listAgents,
  registerCompany,
  getCompany,
  listCompanies,
  setActiveCompany,
  migrateConfig,
  getSchemaVersion,
} from '../config/index.js';
import { SCHEMA_VERSION } from '../types.js';

// ── Test helpers ───────────────────────────────────────────────────────────────

let testRoot: string;

beforeEach(() => {
  testRoot = join(tmpdir(), `onxza-config-test-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });
});

afterEach(() => {
  rmSync(testRoot, { recursive: true, force: true });
});

// ── Path helpers ───────────────────────────────────────────────────────────────

describe('getOpenclawRoot', () => {
  it('returns override when provided', () => {
    expect(getOpenclawRoot('/custom/path')).toBe('/custom/path');
  });

  it('returns env var ONXZA_OPENCLAW_DIR when set', () => {
    const orig = process.env['ONXZA_OPENCLAW_DIR'];
    process.env['ONXZA_OPENCLAW_DIR'] = '/env/path';
    expect(getOpenclawRoot()).toBe('/env/path');
    if (orig === undefined) delete process.env['ONXZA_OPENCLAW_DIR'];
    else process.env['ONXZA_OPENCLAW_DIR'] = orig;
  });

  it('falls back to ~/.openclaw when no override', () => {
    const orig = process.env['ONXZA_OPENCLAW_DIR'];
    delete process.env['ONXZA_OPENCLAW_DIR'];
    const result = getOpenclawRoot();
    expect(result).toMatch(/\.openclaw$/);
    if (orig !== undefined) process.env['ONXZA_OPENCLAW_DIR'] = orig;
  });
});

describe('getConfigPath', () => {
  it('returns openclaw.json inside root', () => {
    expect(getConfigPath(testRoot)).toBe(join(testRoot, 'openclaw.json'));
  });
});

describe('getWorkspacePath', () => {
  it('returns workspace inside root', () => {
    expect(getWorkspacePath(testRoot)).toBe(join(testRoot, 'workspace'));
  });
});

// ── Read / Write ───────────────────────────────────────────────────────────────

describe('readConfig', () => {
  it('returns null when no config exists', () => {
    expect(readConfig(testRoot)).toBeNull();
  });

  it('returns config object when file exists', () => {
    const cfg = seedConfig(testRoot);
    const result = readConfig(testRoot);
    expect(result).not.toBeNull();
    expect(result!.$schemaVersion).toBe(SCHEMA_VERSION);
    void cfg;
  });

  it('returns null when file is invalid JSON', () => {
    writeFileSync(getConfigPath(testRoot), 'NOT JSON', 'utf-8');
    expect(readConfig(testRoot)).toBeNull();
  });
});

describe('requireConfig', () => {
  it('throws when no config exists', () => {
    expect(() => requireConfig(testRoot)).toThrow(/not initialized/);
  });

  it('returns config when it exists', () => {
    seedConfig(testRoot);
    const cfg = requireConfig(testRoot);
    expect(cfg).toBeDefined();
    expect(cfg.agents).toBeDefined();
  });
});

describe('seedConfig', () => {
  it('creates openclaw.json', () => {
    seedConfig(testRoot);
    expect(existsSync(getConfigPath(testRoot))).toBe(true);
  });

  it('has required top-level keys', () => {
    const cfg = seedConfig(testRoot);
    expect(cfg.$schemaVersion).toBe(SCHEMA_VERSION);
    expect(cfg.agents).toBeDefined();
    expect(cfg.companies).toBeDefined();
    expect(cfg.dispatcher).toBeDefined();
    expect(cfg.gateway).toBeDefined();
  });

  it('sets empty agents list', () => {
    const cfg = seedConfig(testRoot);
    expect(cfg.agents.list).toEqual([]);
  });
});

describe('writeConfig', () => {
  it('updates lastTouchedAt on write', () => {
    const cfg = seedConfig(testRoot);
    const before = cfg.meta.lastTouchedAt;
    // Delay slightly for timestamp change
    const updated = { ...cfg };
    writeConfig(updated, testRoot);
    const result = readConfig(testRoot)!;
    expect(result.meta.lastTouchedAt).toBeDefined();
    void before;
  });
});

// ── Agent mutations ────────────────────────────────────────────────────────────

describe('registerAgent / getAgent / removeAgent / listAgents', () => {
  beforeEach(() => seedConfig(testRoot));

  it('registers and retrieves an agent', () => {
    registerAgent({ id: 'test-agent', workspace: '/tmp', company: 'DTP' }, testRoot);
    const agent = getAgent('test-agent', testRoot);
    expect(agent).toBeDefined();
    expect(agent!.id).toBe('test-agent');
  });

  it('updates agent if id already exists', () => {
    registerAgent({ id: 'test-agent', workspace: '/tmp', company: 'DTP', tags: ['v1'] }, testRoot);
    registerAgent({ id: 'test-agent', workspace: '/tmp', company: 'DTP', tags: ['v2'] }, testRoot);
    const agent = getAgent('test-agent', testRoot);
    expect(agent!.tags).toEqual(['v2']);
  });

  it('removes an agent and returns true', () => {
    registerAgent({ id: 'test-agent', workspace: '/tmp', company: 'DTP' }, testRoot);
    const removed = removeAgent('test-agent', testRoot);
    expect(removed).toBe(true);
    expect(getAgent('test-agent', testRoot)).toBeUndefined();
  });

  it('returns false when removing nonexistent agent', () => {
    const removed = removeAgent('ghost-agent', testRoot);
    expect(removed).toBe(false);
  });

  it('lists all registered agents', () => {
    registerAgent({ id: 'agent-a', workspace: '/tmp', company: 'DTP' }, testRoot);
    registerAgent({ id: 'agent-b', workspace: '/tmp', company: 'DTP' }, testRoot);
    const list = listAgents(testRoot);
    expect(list).toHaveLength(2);
    expect(list.map((a) => a.id)).toContain('agent-a');
    expect(list.map((a) => a.id)).toContain('agent-b');
  });
});

// ── Company mutations ──────────────────────────────────────────────────────────

describe('registerCompany / getCompany / listCompanies / setActiveCompany', () => {
  beforeEach(() => seedConfig(testRoot));

  it('registers and retrieves a company', () => {
    registerCompany({ slug: 'DTP', name: 'DevGru Technology Products', sharedLearningsPath: 'shared-learnings/DTP', created: '2026-01-01' }, testRoot);
    const company = getCompany('DTP', testRoot);
    expect(company).toBeDefined();
    expect(company!.name).toBe('DevGru Technology Products');
  });

  it('updates company if slug already exists', () => {
    registerCompany({ slug: 'DTP', name: 'Old Name', sharedLearningsPath: 'shared-learnings/DTP', created: '2026-01-01' }, testRoot);
    registerCompany({ slug: 'DTP', name: 'DevGru Technology Products', sharedLearningsPath: 'shared-learnings/DTP', created: '2026-01-01' }, testRoot);
    expect(getCompany('DTP', testRoot)!.name).toBe('DevGru Technology Products');
  });

  it('lists all companies', () => {
    registerCompany({ slug: 'DTP', name: 'DevGru Technology Products', sharedLearningsPath: 'shared-learnings/DTP', created: '2026-01-01' }, testRoot);
    registerCompany({ slug: 'WDC', name: 'World Destination Club', sharedLearningsPath: 'shared-learnings/WDC', created: '2026-01-01' }, testRoot);
    const companies = listCompanies(testRoot);
    expect(companies).toHaveLength(2);
  });

  it('sets active company', () => {
    registerCompany({ slug: 'DTP', name: 'DevGru Technology Products', sharedLearningsPath: 'shared-learnings/DTP', created: '2026-01-01' }, testRoot);
    setActiveCompany('DTP', testRoot);
    const cfg = requireConfig(testRoot);
    expect(cfg.meta.activeCompany).toBe('DTP');
  });

  it('returns empty array when no companies registered', () => {
    expect(listCompanies(testRoot)).toEqual([]);
  });
});

// ── Migration ──────────────────────────────────────────────────────────────────

describe('migrateConfig', () => {
  it('throws when no config file exists', () => {
    expect(() => migrateConfig(testRoot)).toThrow();
  });

  it('reports already at current version', () => {
    seedConfig(testRoot);
    const result = migrateConfig(testRoot);
    expect(result.changed).toBe(false);
    expect(result.steps).toContain('Already at current schema version');
  });

  it('migrates from 0.0.0', () => {
    // Write an old-style config without $schemaVersion
    writeFileSync(
      getConfigPath(testRoot),
      JSON.stringify({ meta: { lastTouchedAt: '2026-01-01' }, agents: { list: [] }, companies: { list: [] } }),
      'utf-8'
    );
    const result = migrateConfig(testRoot);
    expect(result.changed).toBe(true);
    expect(result.fromVersion).toBe('0.0.0');
    expect(result.toVersion).toBe(SCHEMA_VERSION);
  });

  it('dry run does not write changes', () => {
    writeFileSync(
      getConfigPath(testRoot),
      JSON.stringify({ meta: { lastTouchedAt: '2026-01-01' }, agents: { list: [] }, companies: { list: [] } }),
      'utf-8'
    );
    migrateConfig(testRoot, true);
    const raw = JSON.parse(readFileSync(getConfigPath(testRoot), 'utf-8'));
    expect(raw['$schemaVersion']).toBeUndefined();
  });
});

describe('getSchemaVersion', () => {
  it('returns unknown when no config', () => {
    expect(getSchemaVersion(testRoot)).toBe('unknown');
  });

  it('returns schema version after init', () => {
    seedConfig(testRoot);
    expect(getSchemaVersion(testRoot)).toBe(SCHEMA_VERSION);
  });
});

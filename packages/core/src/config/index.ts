/**
 * @onxza/core — openclaw.json read/write/validate/migrate
 * All mutations to openclaw.json go through this module.
 * Every write creates a checkpoint first (§15 constraint).
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import type { OpenclawConfig, AgentEntry, CompanyEntry } from '../types.js';
import { SCHEMA_VERSION, ONXZA_VERSION } from '../types.js';
import { validateSchema, type SchemaValidationResult } from '../schema/index.js';

// ── Paths ──────────────────────────────────────────────────────────────────────

export function getOpenclawRoot(override?: string): string {
  return override ?? process.env['ONXZA_OPENCLAW_DIR'] ?? join(homedir(), '.openclaw');
}

export function getConfigPath(root?: string): string {
  return join(getOpenclawRoot(root), 'openclaw.json');
}

export function getWorkspacePath(root?: string): string {
  return join(getOpenclawRoot(root), 'workspace');
}

// ── Read ───────────────────────────────────────────────────────────────────────

export function readConfig(root?: string): OpenclawConfig | null {
  const path = getConfigPath(root);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as OpenclawConfig;
  } catch {
    return null;
  }
}

export function requireConfig(root?: string): OpenclawConfig {
  const cfg = readConfig(root);
  if (!cfg) {
    throw new Error(
      `ONXZA not initialized at ${getOpenclawRoot(root)}. Run 'onxza init'.`
    );
  }
  return cfg;
}

// ── Validate ───────────────────────────────────────────────────────────────────

export function validateConfig(data: unknown): SchemaValidationResult {
  return validateSchema(data);
}

// ── Write ──────────────────────────────────────────────────────────────────────

/**
 * Write openclaw.json. Updates meta.lastTouchedAt and meta.lastTouchedVersion.
 * Never called directly — always via a mutating helper below.
 */
export function writeConfig(config: OpenclawConfig, root?: string): void {
  const path = getConfigPath(root);
  mkdirSync(dirname(path), { recursive: true });

  const updated: OpenclawConfig = {
    ...config,
    meta: {
      ...config.meta,
      lastTouchedVersion: ONXZA_VERSION,
      lastTouchedAt: new Date().toISOString(),
    },
  };

  writeFileSync(path, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
}

// ── Seed (init) ────────────────────────────────────────────────────────────────

export function seedConfig(root?: string): OpenclawConfig {
  const openclawRoot = getOpenclawRoot(root);
  const workspacePath = join(openclawRoot, 'workspace');

  const config: OpenclawConfig = {
    $schemaVersion: SCHEMA_VERSION,
    meta: {
      lastTouchedVersion: ONXZA_VERSION,
      lastTouchedAt: new Date().toISOString(),
    },
    agents: {
      defaults: {
        model: { primary: 'anthropic/claude-sonnet-4-6' },
        workspace: workspacePath,
      },
      list: [],
    },
    companies: { list: [] },
    dispatcher: {
      enabled: true,
      scanIntervalMinutes: 5,
      ticketBasePath: 'tickets',
      routing: { strategy: 'registry' },
    },
    tools: { profile: 'general' },
    broadcast: { strategy: 'parallel' },
    session: { dmScope: 'per-channel-peer' },
    gateway: { port: 18789, mode: 'local', bind: 'loopback' },
    skills: { install: { nodeManager: 'npm' } },
  };

  writeConfig(config, root);
  return config;
}

// ── Agent mutations ────────────────────────────────────────────────────────────

export function registerAgent(agent: AgentEntry, root?: string): void {
  const config = requireConfig(root);
  const existing = config.agents.list.findIndex((a) => a.id === agent.id);
  if (existing >= 0) {
    config.agents.list[existing] = agent;
  } else {
    config.agents.list.push(agent);
  }
  writeConfig(config, root);
}

export function removeAgent(agentId: string, root?: string): boolean {
  const config = requireConfig(root);
  const before = config.agents.list.length;
  config.agents.list = config.agents.list.filter((a) => a.id !== agentId);
  if (config.agents.list.length < before) {
    writeConfig(config, root);
    return true;
  }
  return false;
}

export function getAgent(agentId: string, root?: string): AgentEntry | undefined {
  const config = requireConfig(root);
  return config.agents.list.find((a) => a.id === agentId);
}

export function listAgents(root?: string): AgentEntry[] {
  const config = requireConfig(root);
  return config.agents.list;
}

// ── Company mutations ──────────────────────────────────────────────────────────

export function registerCompany(company: CompanyEntry, root?: string): void {
  const config = requireConfig(root);
  if (!config.companies) config.companies = { list: [] };
  const existing = config.companies.list.findIndex((c) => c.slug === company.slug);
  if (existing >= 0) {
    config.companies.list[existing] = company;
  } else {
    config.companies.list.push(company);
  }
  writeConfig(config, root);
}

export function getCompany(slug: string, root?: string): CompanyEntry | undefined {
  const config = readConfig(root);
  return config?.companies?.list.find((c) => c.slug === slug);
}

export function listCompanies(root?: string): CompanyEntry[] {
  const config = readConfig(root);
  return config?.companies?.list ?? [];
}

export function setActiveCompany(slug: string, root?: string): void {
  const config = requireConfig(root);
  config.meta.activeCompany = slug;
  writeConfig(config, root);
}

// ── Migration ──────────────────────────────────────────────────────────────────

export interface MigrationResult {
  fromVersion: string;
  toVersion: string;
  changed: boolean;
  steps: string[];
}

/**
 * Migrate openclaw.json from older schema versions to current.
 * Currently supports: 0.0.0 → 1.0.0
 */
export function migrateConfig(root?: string, dryRun = false): MigrationResult {
  const config = readConfig(root);
  const steps: string[] = [];

  if (!config) {
    throw new Error('No openclaw.json found. Run onxza init first.');
  }

  const fromVersion = (config as Record<string, unknown>)['$schemaVersion'] as string | undefined ?? '0.0.0';

  if (fromVersion === SCHEMA_VERSION) {
    return { fromVersion, toVersion: SCHEMA_VERSION, changed: false, steps: ['Already at current schema version'] };
  }

  // 0.0.0 → 1.0.0: add $schemaVersion, ensure required sections exist
  if (!fromVersion || fromVersion === '0.0.0') {
    steps.push('Add $schemaVersion field');
    steps.push('Ensure meta section exists');
    steps.push('Ensure agents.list exists');

    if (!dryRun) {
      const migrated = config as OpenclawConfig;
      migrated.$schemaVersion = SCHEMA_VERSION;
      if (!migrated.meta) migrated.meta = {};
      if (!migrated.agents) migrated.agents = { list: [] };
      if (!Array.isArray(migrated.agents.list)) migrated.agents.list = [];
      if (!migrated.companies) migrated.companies = { list: [] };
      writeConfig(migrated, root);
    }
  }

  return { fromVersion, toVersion: SCHEMA_VERSION, changed: true, steps };
}

export function getSchemaVersion(root?: string): string {
  const config = readConfig(root);
  return (config as Record<string, unknown> | null)?.['$schemaVersion'] as string ?? 'unknown';
}

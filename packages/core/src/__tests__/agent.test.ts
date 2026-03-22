/**
 * @onxza/core — Agent module tests
 * Tests: parseAgentName, resolveModel, inferDefaultModel, sharedLearningsPaths
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import { describe, it, expect } from 'vitest';

import {
  parseAgentName,
  resolveModel,
  inferDefaultModel,
  sharedLearningsReadPaths,
  sharedLearningsWritePath,
} from '../agent/index.js';

// ── parseAgentName ─────────────────────────────────────────────────────────────

describe('parseAgentName', () => {
  it('parses a valid 3-part agent name', () => {
    const result = parseAgentName('DTP_ONXZA_Backend');
    expect(result.valid).toBe(true);
    expect(result.parsed?.companySlug).toBe('DTP');
    expect(result.parsed?.department).toBe('ONXZA');
    expect(result.parsed?.role).toBe('Backend');
  });

  it('generates correct kebab-case agentId', () => {
    const result = parseAgentName('DTP_ONXZA_Backend');
    expect(result.parsed?.agentId).toBe('dtp-onxza-backend');
  });

  it('generates correct workspaceDirName', () => {
    const result = parseAgentName('DTP_ONXZA_Backend');
    expect(result.parsed?.workspaceDirName).toBe('workspace-dtp-onxza-backend');
  });

  it('parses multi-segment role names (e.g. BlogWriter)', () => {
    const result = parseAgentName('WDC_Content_BlogWriter');
    expect(result.valid).toBe(true);
    expect(result.parsed?.companySlug).toBe('WDC');
    expect(result.parsed?.department).toBe('Content');
    expect(result.parsed?.role).toBe('BlogWriter');
    expect(result.parsed?.agentId).toBe('wdc-content-blogwriter');
  });

  it('rejects names with fewer than 3 parts', () => {
    const result = parseAgentName('DTP_Backend');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('format');
  });

  it('rejects empty name', () => {
    const result = parseAgentName('');
    expect(result.valid).toBe(false);
  });

  it('rejects lowercase company segment', () => {
    const result = parseAgentName('dtp_ONXZA_Backend');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PascalCase');
  });

  it('rejects lowercase department segment', () => {
    const result = parseAgentName('DTP_onxza_Backend');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PascalCase');
  });

  it('stores raw name on parsed object', () => {
    const result = parseAgentName('DTP_ONXZA_Architect');
    expect(result.parsed?.raw).toBe('DTP_ONXZA_Architect');
  });

  it('handles longer company slugs like MGA, MGP, WDC', () => {
    const mga = parseAgentName('MGA_Sales_Director');
    expect(mga.valid).toBe(true);
    expect(mga.parsed?.companySlug).toBe('MGA');

    const wdc = parseAgentName('WDC_Affiliate_Manager');
    expect(wdc.valid).toBe(true);
    expect(wdc.parsed?.companySlug).toBe('WDC');
  });
});

// ── resolveModel ──────────────────────────────────────────────────────────────

describe('resolveModel', () => {
  it('returns already-qualified model as-is', () => {
    expect(resolveModel('anthropic/claude-sonnet-4-6')).toBe('anthropic/claude-sonnet-4-6');
    expect(resolveModel('openai/gpt-4o')).toBe('openai/gpt-4o');
    expect(resolveModel('ollama/llama3')).toBe('ollama/llama3');
  });

  it('resolves claude prefix to anthropic/', () => {
    expect(resolveModel('claude-sonnet-4-6')).toBe('anthropic/claude-sonnet-4-6');
    expect(resolveModel('claude-opus-4-6')).toBe('anthropic/claude-opus-4-6');
  });

  it('resolves gpt prefix to openai/', () => {
    expect(resolveModel('gpt-4o')).toBe('openai/gpt-4o');
  });

  it('resolves o1/o3/o4 prefix to openai/', () => {
    expect(resolveModel('o1-mini')).toBe('openai/o1-mini');
    expect(resolveModel('o3')).toBe('openai/o3');
    expect(resolveModel('o4-mini')).toBe('openai/o4-mini');
  });

  it('resolves unknown models to ollama/', () => {
    expect(resolveModel('llama3')).toBe('ollama/llama3');
    expect(resolveModel('mistral')).toBe('ollama/mistral');
  });
});

// ── inferDefaultModel ─────────────────────────────────────────────────────────

describe('inferDefaultModel', () => {
  it('returns claude-opus for architect roles', () => {
    expect(inferDefaultModel('Architect')).toBe('anthropic/claude-opus-4-6');
  });

  it('returns claude-opus for security roles', () => {
    expect(inferDefaultModel('Security')).toBe('anthropic/claude-opus-4-6');
  });

  it('returns claude-opus for legal roles', () => {
    expect(inferDefaultModel('Legal')).toBe('anthropic/claude-opus-4-6');
  });

  it('returns claude-sonnet for orchestrator roles', () => {
    expect(inferDefaultModel('Orchestrator')).toBe('anthropic/claude-sonnet-4-6');
  });

  it('returns claude-sonnet for PM roles', () => {
    expect(inferDefaultModel('PM')).toBe('anthropic/claude-sonnet-4-6');
  });

  it('returns claude-sonnet for CEO roles', () => {
    expect(inferDefaultModel('CEO')).toBe('anthropic/claude-sonnet-4-6');
  });

  it('returns claude-sonnet for COO roles', () => {
    expect(inferDefaultModel('COO')).toBe('anthropic/claude-sonnet-4-6');
  });

  it('returns claude-sonnet as default for unrecognized roles', () => {
    expect(inferDefaultModel('Backend')).toBe('anthropic/claude-sonnet-4-6');
    expect(inferDefaultModel('Blogger')).toBe('anthropic/claude-sonnet-4-6');
    expect(inferDefaultModel('DataAnalyst')).toBe('anthropic/claude-sonnet-4-6');
  });

  it('is case-insensitive for role matching', () => {
    expect(inferDefaultModel('architect')).toBe('anthropic/claude-opus-4-6');
    expect(inferDefaultModel('ARCHITECT')).toBe('anthropic/claude-opus-4-6');
  });
});

// ── sharedLearningsPaths ──────────────────────────────────────────────────────

describe('sharedLearningsReadPaths', () => {
  it('returns company path when no department provided', () => {
    const paths = sharedLearningsReadPaths('DTP');
    expect(paths).toContain('shared-learnings/DTP/');
  });

  it('includes department path when provided', () => {
    const paths = sharedLearningsReadPaths('DTP', 'ONXZA');
    expect(paths).toContain('shared-learnings/DTP/');
    expect(paths).toContain('shared-learnings/DTP/onxza/');
  });

  it('lowercases department in path', () => {
    const paths = sharedLearningsReadPaths('WDC', 'Content');
    expect(paths).toContain('shared-learnings/WDC/content/');
  });
});

describe('sharedLearningsWritePath', () => {
  it('returns write path for company', () => {
    expect(sharedLearningsWritePath('DTP')).toBe('shared-learnings/DTP/');
    expect(sharedLearningsWritePath('WDC')).toBe('shared-learnings/WDC/');
  });
});

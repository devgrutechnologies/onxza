/**
 * @onxza/core — TORI-QMD Validator (TypeScript port)
 * Validates agent workspace files and ONXZA markdown documents.
 * Rules per ARCHITECTURE-v0.1.md §6.2 and validate-tori-qmd.py.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import { readFileSync, existsSync } from 'fs';
import { basename, join } from 'path';
import type {
  ToriValidationResult,
  ToriValidationError,
  ToriFileType,
} from '../types.js';
import { CREDIT_LINE } from '../types.js';

// ── File type detection ────────────────────────────────────────────────────────

export function detectFileType(filePath: string): ToriFileType {
  const name = basename(filePath);
  const normalized = filePath.replace(/\\/g, '/');

  if (name === 'AGENTS.md') return 'AGENTS.md';
  if (name === 'SOUL.md') return 'SOUL.md';
  if (name === 'IDENTITY.md') return 'IDENTITY.md';
  if (name === 'MEMORY.md') return 'MEMORY.md';
  if (name === 'TOOLS.md') return 'TOOLS.md';
  if (name === 'HEARTBEAT.md') return 'HEARTBEAT.md';
  if (name.toLowerCase() === 'vision.md') return 'vision.md';
  if (normalized.includes('/memory/') && name.endsWith('.md')) return 'memory-file';
  if (normalized.includes('/skills/') && name.endsWith('.md')) return 'skill-file';
  if (normalized.includes('/patterns/') && name.endsWith('.md')) return 'pattern-file';
  return 'generic';
}

// ── Frontmatter parsing ────────────────────────────────────────────────────────

export function parseFrontmatter(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  let inFm = false;

  for (const line of lines) {
    const stripped = line.trim();
    if (stripped === '---') {
      if (!inFm) { inFm = true; continue; }
      else break;
    }
    if (!inFm) continue;
    const m = stripped.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*):\s*(.*)$/);
    if (m?.[1] && m[2] !== undefined) {
      result[m[1]] = m[2].trim();
    }
  }
  return result;
}

// ── Credit line check ──────────────────────────────────────────────────────────

const CREDIT_SHORT = 'Imagined by Aaron Gear';

export function hasCreditLine(content: string): boolean {
  return content.includes(CREDIT_SHORT);
}

// ── Required sections ──────────────────────────────────────────────────────────

function hasSection(content: string, section: string): boolean {
  return content.includes(`## ${section}`) || content.includes(`# ${section}`);
}

// ── Validators per file type ───────────────────────────────────────────────────

function validateAgentsMd(content: string): ToriValidationError[] {
  const errors: ToriValidationError[] = [];
  if (!hasCreditLine(content)) {
    errors.push({
      rule: 'credit-line',
      message: 'Missing credit line: "Imagined by Aaron Gear..."',
      fix: `Add the official credit line to AGENTS.md: *${CREDIT_LINE}*`,
    });
  }
  if (!content.includes('**Company:**') && !content.includes('Company:')) {
    errors.push({
      rule: 'company-header',
      message: 'Missing Company field',
      fix: 'Add: **Company:** <company-name>',
    });
  }
  if (!content.includes('**Model:**') && !content.includes('Model:')) {
    errors.push({
      rule: 'model-header',
      message: 'Missing Model field',
      fix: 'Add: **Model:** <model-reference>',
    });
  }
  return errors;
}

function validateIdentityMd(content: string): ToriValidationError[] {
  const errors: ToriValidationError[] = [];
  const requiredFields = ['Full Name', 'Company', 'Department', 'Role', 'Model', 'Persistence'];
  for (const field of requiredFields) {
    if (!content.includes(`**${field}:**`) && !content.includes(`${field}:`)) {
      errors.push({
        rule: `identity-${field.toLowerCase().replace(/\s+/g, '-')}`,
        message: `Missing required field: ${field}`,
        fix: `Add: **${field}:** <value>`,
      });
    }
  }
  return errors;
}

function validateMemoryMd(content: string): ToriValidationError[] {
  const errors: ToriValidationError[] = [];
  const requiredSections = ['Company Context', 'Active Projects', 'Key Learnings', 'Session History'];
  for (const section of requiredSections) {
    if (!hasSection(content, section)) {
      errors.push({
        rule: `memory-section-${section.toLowerCase().replace(/\s+/g, '-')}`,
        message: `Missing required section: ## ${section}`,
        fix: `Add section: ## ${section}`,
      });
    }
  }
  // Check initialized date
  if (!/\*\*Initialized:\*\*/.test(content) && !/Initialized:/.test(content)) {
    errors.push({
      rule: 'memory-initialized',
      message: 'Missing Initialized date',
      fix: 'Add: **Initialized:** YYYY-MM-DD',
    });
  }
  return errors;
}

function validateVisionMd(content: string): ToriValidationError[] {
  const errors: ToriValidationError[] = [];
  const fm = parseFrontmatter(content);

  if (!hasCreditLine(content)) {
    errors.push({
      rule: 'credit-line',
      message: 'Missing credit line',
      fix: `Add credit line: *${CREDIT_LINE}*`,
    });
  }

  const status = fm['status'] ?? '';
  if (!status) {
    // Also check markdown bold status
    const hasBoldStatus = /\*\*Status:\*\*/.test(content);
    if (!hasBoldStatus) {
      errors.push({
        rule: 'vision-status',
        message: 'Missing status field (expected in frontmatter or as **Status:** ...)',
        fix: 'Add: status: CDP-REVIEW  (or APPROVED — IMMUTABLE)',
      });
    }
  }
  return errors;
}

function validateMemoryFile(content: string): ToriValidationError[] {
  const errors: ToriValidationError[] = [];
  const fm = parseFrontmatter(content);
  const requiredFm = ['memory_id', 'agent', 'created', 'tags', 'summary'];
  for (const field of requiredFm) {
    if (!fm[field]) {
      errors.push({
        rule: `memory-fm-${field}`,
        message: `Missing frontmatter field: ${field}`,
        fix: `Add to frontmatter: ${field}: <value>`,
      });
    }
  }
  return errors;
}

function validateSkillFile(content: string): ToriValidationError[] {
  const errors: ToriValidationError[] = [];
  const fm = parseFrontmatter(content);

  if (!fm['version']) {
    errors.push({
      rule: 'skill-version',
      message: 'Missing version in frontmatter',
      fix: 'Add: **Version:** 1.0.0 (or version: 1.0.0 in frontmatter)',
    });
  }
  if (!fm['owner'] && !content.includes('**Owner:**')) {
    errors.push({
      rule: 'skill-owner',
      message: 'Missing owner field',
      fix: 'Add: **Owner:** <agent-id>',
    });
  }
  if (!hasCreditLine(content)) {
    errors.push({
      rule: 'credit-line',
      message: 'Missing credit line',
      fix: `Add credit line: *${CREDIT_LINE}*`,
    });
  }
  return errors;
}

function validatePatternFile(content: string): ToriValidationError[] {
  return validateMemoryFile(content);
}

function validateGeneric(content: string): ToriValidationError[] {
  // Generic: just check credit line for project/onxza files
  return [];
}

// ── Main validator ─────────────────────────────────────────────────────────────

/**
 * Validate a single markdown file.
 * Returns a ToriValidationResult.
 */
export function validateFile(filePath: string): ToriValidationResult {
  if (!existsSync(filePath)) {
    return {
      filePath,
      fileType: 'generic',
      pass: false,
      errors: [{
        rule: 'file-exists',
        message: `File not found: ${filePath}`,
        fix: 'Create the file',
      }],
    };
  }

  const content = readFileSync(filePath, 'utf-8');
  const fileType = detectFileType(filePath);

  let errors: ToriValidationError[] = [];

  switch (fileType) {
    case 'AGENTS.md':    errors = validateAgentsMd(content); break;
    case 'SOUL.md':      /* no rules beyond existence */ break;
    case 'IDENTITY.md':  errors = validateIdentityMd(content); break;
    case 'MEMORY.md':    errors = validateMemoryMd(content); break;
    case 'TOOLS.md':     /* no rules */ break;
    case 'HEARTBEAT.md': /* no rules */ break;
    case 'vision.md':    errors = validateVisionMd(content); break;
    case 'memory-file':  errors = validateMemoryFile(content); break;
    case 'skill-file':   errors = validateSkillFile(content); break;
    case 'pattern-file': errors = validatePatternFile(content); break;
    default:             errors = validateGeneric(content); break;
  }

  return {
    filePath,
    fileType,
    pass: errors.length === 0,
    errors,
  };
}

/**
 * Validate an agent workspace directory (all 6 required files).
 */
export function validateAgentWorkspace(workspaceDir: string): ToriValidationResult[] {
  const files = ['AGENTS.md', 'SOUL.md', 'IDENTITY.md', 'MEMORY.md', 'TOOLS.md', 'HEARTBEAT.md'];
  return files.map((f) => validateFile(join(workspaceDir, f)));
}

/**
 * Returns true only if all provided validation results pass.
 */
export function allPass(results: ToriValidationResult[]): boolean {
  return results.every((r) => r.pass);
}

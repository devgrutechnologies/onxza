/**
 * @onxza/core — Shared Learnings promotion pipeline
 * specialist → company → global per ARCHITECTURE-v0.1.md §6.4.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  statSync,
} from 'fs';
import { join, basename, relative } from 'path';
import type { LearningFile, PromotionTarget, PromotionResult } from '../types.js';
import { getWorkspacePath } from '../config/index.js';

// ── Paths ──────────────────────────────────────────────────────────────────────

export function getSharedLearningsDir(root?: string): string {
  return join(getWorkspacePath(root), 'shared-learnings');
}

export function getCompanyLearningsDir(company: string, subdir: 'skills' | 'patterns' | 'tools' | 'archived' = 'patterns', root?: string): string {
  if (company === 'global') {
    return join(getSharedLearningsDir(root), 'global', subdir);
  }
  return join(getSharedLearningsDir(root), company, subdir);
}

// ── Frontmatter parsing ────────────────────────────────────────────────────────

function parseFm(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  let inFm = false;
  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFm) { inFm = true; continue; }
      else break;
    }
    if (!inFm) continue;
    const m = line.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*):\s*(.*)$/);
    if (m?.[1] && m[2] !== undefined) result[m[1]] = m[2].trim();
  }
  return result;
}

// ── File type detection ────────────────────────────────────────────────────────

function detectLearningType(filePath: string, fm: Record<string, string>): LearningFile['type'] {
  if (fm['type']) {
    const t = fm['type'];
    if (t === 'skill') return 'skill';
    if (t === 'pattern' || t === 'correction' || t === 'escalation_log' || t === 'model_observation' || t === 'workflow') return 'pattern';
    if (t === 'tool_note') return 'tool';
  }
  const norm = filePath.replace(/\\/g, '/');
  if (norm.includes('/skills/')) return 'skill';
  if (norm.includes('/patterns/')) return 'pattern';
  if (norm.includes('/tools/')) return 'tool';
  return 'unknown';
}

// ── List learnings ─────────────────────────────────────────────────────────────

export interface ListLearningsOptions {
  company?: string;
  tier?: 'company' | 'global';
  type?: LearningFile['type'];
  root?: string;
}

export function listLearnings(options: ListLearningsOptions = {}): LearningFile[] {
  const { company, tier, type, root } = options;
  const learningsDir = getSharedLearningsDir(root);

  if (!existsSync(learningsDir)) return [];

  const results: LearningFile[] = [];

  let searchDirs: string[] = [];
  if (company) {
    searchDirs = [join(learningsDir, company)];
  } else if (tier === 'global') {
    searchDirs = [join(learningsDir, 'global')];
  } else {
    searchDirs = readdirSync(learningsDir)
      .filter((e) => !e.startsWith('.'))
      .map((e) => join(learningsDir, e))
      .filter((d) => {
        try { return statSync(d).isDirectory(); } catch { return false; }
      });
  }

  for (const baseDir of searchDirs) {
    walkMd(baseDir, (filePath) => {
      if (basename(filePath) === 'README.md') return;
      const content = readFileSync(filePath, 'utf-8');
      const fm = parseFm(content);
      const relPath = relative(getWorkspacePath(root), filePath);
      const companyPart = relPath.replace('shared-learnings/', '').split('/')[0] ?? 'unknown';
      const lTier: LearningFile['tier'] = companyPart === 'global' ? 'global' : 'company';
      const lType = detectLearningType(filePath, fm);

      if (type && lType !== type) return;

      results.push({
        path: filePath,
        relativePath: relPath,
        company: companyPart,
        tier: lTier,
        type: lType,
        frontmatter: fm,
        preview: content.replace(/^---[\s\S]*?---/m, '').trim().slice(0, 200),
      });
    });
  }

  return results;
}

function walkMd(dir: string, cb: (path: string) => void): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules') continue;
    const full = join(dir, entry);
    try {
      const s = statSync(full);
      if (s.isDirectory()) walkMd(full, cb);
      else if (entry.endsWith('.md')) cb(full);
    } catch { /* skip */ }
  }
}

// ── Promote ────────────────────────────────────────────────────────────────────

export function promoteLearning(
  filePath: string,
  to: PromotionTarget,
  options: { company?: string; agentId?: string; root?: string } = {}
): PromotionResult {
  const { company, agentId = 'unknown', root } = options;

  if (!existsSync(filePath)) {
    const abs = join(getWorkspacePath(root), filePath);
    if (!existsSync(abs)) {
      return { success: false, sourcePath: filePath, destinationPath: '', tier: to, error: `File not found: ${filePath}` };
    }
    return promoteLearning(abs, to, options);
  }

  const content = readFileSync(filePath, 'utf-8');
  const fm = parseFm(content);
  const lType = detectLearningType(filePath, fm);
  const subdir = lType === 'skill' ? 'skills' : lType === 'tool' ? 'tools' : 'patterns';

  let destDir: string;
  if (to === 'global') {
    destDir = getCompanyLearningsDir('global', subdir as 'skills' | 'patterns' | 'tools', root);
  } else {
    if (!company) {
      return { success: false, sourcePath: filePath, destinationPath: '', tier: to, error: '--company required for company-tier promotion' };
    }
    destDir = getCompanyLearningsDir(company, subdir as 'skills' | 'patterns' | 'tools', root);
  }

  mkdirSync(destDir, { recursive: true });
  const destPath = join(destDir, basename(filePath));

  // Inject promotion metadata
  const now = new Date().toISOString();
  let updatedContent = content;
  const setFm = (key: string, value: string) => {
    if (new RegExp(`^${key}:`,'m').test(updatedContent)) {
      updatedContent = updatedContent.replace(new RegExp(`^${key}:.*`, 'm'), `${key}: ${value}`);
    } else {
      updatedContent = updatedContent.replace(/^---\n([\s\S]*?)\n---/, `---\n$1\n${key}: ${value}\n---`);
    }
  };

  setFm('tier', to);
  setFm('promoted_from', relative(getWorkspacePath(root), filePath));
  setFm('promoted_at', now);
  setFm('promoted_by', agentId);
  setFm('status', 'promoted');

  writeFileSync(destPath, updatedContent, 'utf-8');

  return {
    success: true,
    sourcePath: filePath,
    destinationPath: destPath,
    tier: to,
  };
}

// ── Validate learning file ─────────────────────────────────────────────────────

export interface LearningValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateLearningFile(filePath: string): LearningValidationResult {
  if (!existsSync(filePath)) {
    return { valid: false, errors: [`File not found: ${filePath}`] };
  }

  const content = readFileSync(filePath, 'utf-8');
  const fm = parseFm(content);
  const lType = detectLearningType(filePath, fm);
  const errors: string[] = [];

  if (lType === 'pattern') {
    const required = ['memory_id', 'agent', 'created', 'tags', 'summary'];
    for (const f of required) {
      if (!fm[f]) errors.push(`Missing frontmatter field: ${f}`);
    }
  } else if (lType === 'skill') {
    if (!fm['version'] && !content.includes('**Version:**')) errors.push('Missing version field');
    if (!fm['owner'] && !content.includes('**Owner:**')) errors.push('Missing owner field');
    if (!content.includes('Imagined by Aaron Gear')) errors.push('Missing credit line');
  }

  return { valid: errors.length === 0, errors };
}

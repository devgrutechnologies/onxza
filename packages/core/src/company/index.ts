/**
 * @onxza/core — Company add / list / switch
 * Implements ARCHITECTURE-v0.1.md §5.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { CompanyEntry } from '../types.js';
import {
  requireConfig,
  getOpenclawRoot,
  getWorkspacePath,
  registerCompany,
  listCompanies,
  setActiveCompany,
} from '../config/index.js';
import { createCheckpoint } from '../checkpoint/index.js';

// ── Slug derivation ────────────────────────────────────────────────────────────

const SLUG_RE = /^[A-Z][A-Za-z0-9]{0,31}$/;

/**
 * Auto-derive a company slug from the full name.
 * "DevGru Technology Products" → "DTP"
 * "World Destination Club" → "WDC"
 * Falls back to first 3 uppercase letters if > 4 words.
 */
export function deriveSlug(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length <= 4) {
    const initials = words.map((w) => w[0]?.toUpperCase() ?? '').join('');
    if (SLUG_RE.test(initials)) return initials;
  }
  // Fallback: first 3 letters uppercased
  const fallback = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  return fallback || 'CO';
}

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!SLUG_RE.test(slug)) {
    return {
      valid: false,
      error: `Company slug must match ^[A-Z][A-Za-z0-9]{0,31}$ — got: "${slug}"`,
    };
  }
  return { valid: true };
}

// ── Add company ────────────────────────────────────────────────────────────────

export interface AddCompanyOptions {
  slug?: string;
  parent?: string;
  visionPath?: string;
  root?: string;
}

export interface AddCompanyResult {
  success: boolean;
  company?: CompanyEntry;
  directoriesCreated?: string[];
  checkpointId?: string;
  error?: string;
}

export function addCompany(name: string, options: AddCompanyOptions = {}): AddCompanyResult {
  const { slug: slugOverride, parent, visionPath, root } = options;

  // 1. Validate name
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Company name is required.' };
  }

  // 2. Derive or validate slug
  const slug = slugOverride ?? deriveSlug(name);
  const slugValidation = validateSlug(slug);
  if (!slugValidation.valid) {
    return { success: false, error: slugValidation.error };
  }

  // 3. Check uniqueness
  const existing = listCompanies(root).find((c) => c.slug === slug);
  if (existing) {
    return {
      success: false,
      error: `Company slug '${slug}' already registered (${existing.name}).`,
    };
  }

  // 4. Create shared-learnings directories
  const workspacePath = getWorkspacePath(root);
  const dirs = [
    join(workspacePath, 'shared-learnings', slug),
    join(workspacePath, 'shared-learnings', slug, 'skills'),
    join(workspacePath, 'shared-learnings', slug, 'patterns'),
    join(workspacePath, 'shared-learnings', slug, 'tools'),
  ];

  const directoriesCreated: string[] = [];
  for (const d of dirs) {
    mkdirSync(d, { recursive: true });
    directoriesCreated.push(d);
  }

  // 5. Register in openclaw.json
  const company: CompanyEntry = {
    slug,
    name: name.trim(),
    parent,
    visionPath,
    sharedLearningsPath: `shared-learnings/${slug}`,
    created: new Date().toISOString().slice(0, 10),
  };

  registerCompany(company, root);

  // 6. Checkpoint
  let checkpointId: string | undefined;
  try {
    const cp = createCheckpoint({
      slug: `company-add-${slug.toLowerCase()}`,
      trigger: `onxza company add ${name}`,
      agentId: 'onxza-cli',
      description: `Company registered: ${name} (${slug})`,
      root,
    });
    checkpointId = cp.id;
  } catch { /* non-fatal */ }

  return { success: true, company, directoriesCreated, checkpointId };
}

// ── List companies ─────────────────────────────────────────────────────────────

export interface CompanySummary extends CompanyEntry {
  agentCount: number;
}

export function listCompaniesSummary(root?: string): CompanySummary[] {
  const config = requireConfig(root);
  const companies = config.companies?.list ?? [];
  const agents = config.agents.list;

  return companies.map((c) => ({
    ...c,
    agentCount: agents.filter((a) => a.company === c.slug).length,
  }));
}

// ── Switch active company ──────────────────────────────────────────────────────

export function switchCompany(slug: string, root?: string): void {
  const companies = listCompanies(root);
  const found = companies.find((c) => c.slug === slug);
  if (!found) {
    throw new Error(
      `Company '${slug}' not registered. Run 'onxza company list' to see available companies.`
    );
  }
  setActiveCompany(slug, root);
}

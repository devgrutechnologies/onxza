/**
 * TORI-QMD Validator — Server-side implementation
 *
 * Validates ONXZA skill tarballs for:
 *   1. Required files (SKILL.md mandatory)
 *   2. SKILL.md frontmatter fields (version, owner, created/last_updated, credit_line)
 *   3. Credit line exact match
 *   4. No internal/company-specific data leakage
 *   5. Semver compliance on version field
 *
 * TICKET-20260318-DTP-013 — skills marketplace backend
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

'use strict';

const semver = require('semver');

const CREDIT_LINE =
  'Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). ' +
  'Powered by DevGru US Inc. DBA DevGru Technology Products. ' +
  'Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.';

// Patterns that signal internal company data that must not be published
const INTERNAL_DATA_PATTERNS = [
  /SUPABASE_SERVICE_KEY/i,
  /API_KEY\s*=\s*[^\s]{8,}/i,
  /SECRET\s*=\s*[^\s]{8,}/i,
  /PASSWORD\s*=\s*[^\s]{4,}/i,
  /devgru\.us\/internal/i,
  /workspace-dtp-/i,
  /workspace-mga-/i,
  /workspace-wdc-/i,
  /tickets\/open\//i,
  /tickets\/in-progress\//i,
];

/**
 * Parse YAML frontmatter from a markdown string.
 * Returns an object with meta (key-value pairs) and body.
 *
 * @param {string} content
 * @returns {{ meta: Record<string, string>, body: string } | null}
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) meta[key] = val;
  }
  return { meta, body: match[2] };
}

/**
 * Validate a parsed SKILL.md.
 *
 * @param {string} content - raw file content
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSkillMd(content) {
  const errors = [];

  const parsed = parseFrontmatter(content);
  if (!parsed) {
    return { valid: false, errors: ['SKILL.md must have YAML frontmatter (--- block at top)'] };
  }

  const { meta } = parsed;

  // Required fields
  const required = ['version', 'owner', 'credit_line'];
  for (const field of required) {
    if (!meta[field]) {
      errors.push(`SKILL.md frontmatter missing required field: ${field}`);
    }
  }

  // Either created or last_updated must be present
  if (!meta['created'] && !meta['last_updated']) {
    errors.push('SKILL.md frontmatter must have either "created" or "last_updated"');
  }

  // Semver check
  if (meta['version'] && !semver.valid(meta['version'])) {
    errors.push(`SKILL.md version "${meta['version']}" is not valid semver (e.g. 1.0.0)`);
  }

  // Credit line check — normalize whitespace for comparison
  const normalize = (s) => s.replace(/\s+/g, ' ').trim();
  if (meta['credit_line']) {
    if (normalize(meta['credit_line']) !== normalize(CREDIT_LINE)) {
      errors.push(
        'SKILL.md credit_line does not match the required ONXZA credit line.\n' +
        `  Expected: ${CREDIT_LINE}\n` +
        `  Got:      ${meta['credit_line']}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Scan file contents for internal/company-specific data leakage.
 *
 * @param {string} filename
 * @param {string} content
 * @returns {string[]} - list of violation descriptions
 */
function scanForInternalData(filename, content) {
  const violations = [];
  for (const pattern of INTERNAL_DATA_PATTERNS) {
    if (pattern.test(content)) {
      violations.push(`${filename}: contains internal/sensitive data matching pattern: ${pattern}`);
    }
  }
  return violations;
}

/**
 * Validate a skill archive represented as a map of filename → content.
 *
 * @param {Record<string, string>} files - filename (relative) to content
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSkillArchive(files) {
  const errors = [];

  // Must contain a SKILL.md at root or one level deep
  const skillMdKey = Object.keys(files).find(
    (f) => f === 'SKILL.md' || f.endsWith('/SKILL.md')
  );
  if (!skillMdKey) {
    return {
      valid: false,
      errors: ['Archive must contain a SKILL.md file'],
    };
  }

  // Validate SKILL.md content
  const skillMdResult = validateSkillMd(files[skillMdKey]);
  errors.push(...skillMdResult.errors);

  // Scan all files for internal data
  for (const [filename, content] of Object.entries(files)) {
    // Skip binary detection — only scan text-like files
    if (typeof content !== 'string') continue;
    const violations = scanForInternalData(filename, content);
    errors.push(...violations);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extract metadata from a validated SKILL.md.
 *
 * @param {string} content
 * @returns {Record<string, string>}
 */
function extractSkillMetadata(content) {
  const parsed = parseFrontmatter(content);
  if (!parsed) return {};
  return parsed.meta;
}

module.exports = {
  CREDIT_LINE,
  parseFrontmatter,
  validateSkillMd,
  validateSkillArchive,
  scanForInternalData,
  extractSkillMetadata,
};

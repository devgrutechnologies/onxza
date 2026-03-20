'use strict';

/**
 * ONXZA Agent Naming Convention Utilities
 *
 * Agent name format: [Company]_[Dept]_[Role]   (PascalCase, underscores)
 * Agent id format:   [company]-[dept]-[role]    (lowercase, hyphens)
 * Workspace dir:     workspace-[company]-[dept]-[role]
 *
 * Special cases:
 *   MG_Parent_* → mg-parent-*  (Parent Infrastructure agents)
 *   main → workspace (Marcus primary, never modified by CLI)
 *
 * ARCHITECTURE.md §7.3 · skill-agent-creation-global-standard.md
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

// Known company prefixes (extensible via company store)
const KNOWN_COMPANIES = new Set(['MG', 'WDC', 'MGA', 'DTP', 'MGP']);

/**
 * Validate an agent name against the [Company]_[Dept]_[Role] convention.
 * Returns { valid: boolean, error?: string, parts?: { company, dept, role } }
 */
function validateAgentName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Agent name is required.' };
  }

  const parts = name.split('_');
  if (parts.length < 3) {
    return {
      valid: false,
      error: `Agent name must follow [Company]_[Dept]_[Role] format (e.g. WDC_Content_BlogWriter). Got: "${name}"`,
    };
  }

  const [company, dept, ...roleParts] = parts;
  const role = roleParts.join('_'); // Allow multi-word roles: WDC_Content_Blog_Writer

  // Company: 2–10 uppercase letters
  if (!/^[A-Z][A-Za-z0-9]{1,9}$/.test(company)) {
    return {
      valid: false,
      error: `Company segment "${company}" must start with uppercase and be 2–10 alphanumeric characters (e.g. WDC, DTP, MGA).`,
    };
  }

  // Dept: at least 2 chars, PascalCase
  if (!/^[A-Z][a-zA-Z0-9]+$/.test(dept)) {
    return {
      valid: false,
      error: `Department segment "${dept}" must be PascalCase (e.g. Content, Onxza, Marketing).`,
    };
  }

  // Role: at least 2 chars, PascalCase (each part)
  for (const rp of roleParts) {
    if (!/^[A-Z][a-zA-Z0-9]+$/.test(rp)) {
      return {
        valid: false,
        error: `Role segment "${rp}" must be PascalCase (e.g. BlogWriter, Router, QaEngineer).`,
      };
    }
  }

  return {
    valid: true,
    parts: { company, dept, role },
    isKnownCompany: KNOWN_COMPANIES.has(company.toUpperCase()),
  };
}

/**
 * Convert agent name to openclaw.json id.
 * WDC_Content_BlogWriter → wdc-content-blogwriter
 * MG_Parent_Marcus       → mg-parent-marcus
 */
function nameToId(name) {
  return name
    .replace(/_/g, '-')
    .toLowerCase();
}

/**
 * Convert agent name to workspace directory name.
 * WDC_Content_BlogWriter → workspace-wdc-content-blogwriter
 */
function nameToWorkspaceDir(name, opencrawDir) {
  const path = require('path');
  const os   = require('os');
  const base = opencrawDir || require('path').join(require('os').homedir(), '.openclaw');
  return path.join(base, `workspace-${nameToId(name)}`);
}

/**
 * Convert id back to display name guess (best-effort, not authoritative).
 * wdc-content-blogwriter → WDC_Content_Blogwriter
 */
function idToDisplayName(id) {
  return id
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('_');
}

module.exports = {
  validateAgentName,
  nameToId,
  nameToWorkspaceDir,
  idToDisplayName,
  KNOWN_COMPANIES,
};

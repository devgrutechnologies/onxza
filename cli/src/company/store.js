'use strict';

/**
 * ONXZA Company Store
 *
 * Manages company registration and active context for the CLI.
 *
 * Companies are derived from two sources:
 *   1. openclaw.json agents.list → prefix of each agent id determines company
 *   2. shared-learnings/ subdirectories (non-"global") → canonical company list
 *
 * Active company context is persisted to ~/.onxza/context.json so it
 * survives CLI invocations.
 *
 * Shared-learnings directory structure for a company:
 *   shared-learnings/<COMPANY>/
 *     ├── skills/
 *     ├── patterns/
 *     └── tools/
 *
 * ARCHITECTURE.md §3, §9.2 · TICKET-20260318-DTP-007
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ONXZA_HOME = process.env.ONXZA_HOME
  || path.join(os.homedir(), '.onxza');

const CONTEXT_FILE = path.join(ONXZA_HOME, 'context.json');

const WORKSPACE = process.env.ONXZA_WORKSPACE
  || path.join(os.homedir(), '.openclaw', 'workspace');

const SHARED_LEARNINGS = path.join(WORKSPACE, 'shared-learnings');

const OPENCLAW_JSON = process.env.ONXZA_OPENCLAW_JSON
  || path.join(os.homedir(), '.openclaw', 'openclaw.json');

// Subdirectories that every company gets on creation
const COMPANY_SUBDIRS = ['skills', 'patterns', 'tools'];

// Company codes that are system-level and not real companies
const SYSTEM_SCOPES = new Set(['global']);

// ---------------------------------------------------------------------------
// Context persistence
// ---------------------------------------------------------------------------

function loadContext() {
  try {
    return JSON.parse(fs.readFileSync(CONTEXT_FILE, 'utf8'));
  } catch {
    return { activeCompany: null };
  }
}

function saveContext(ctx) {
  if (!fs.existsSync(ONXZA_HOME)) {
    fs.mkdirSync(ONXZA_HOME, { recursive: true });
  }
  fs.writeFileSync(CONTEXT_FILE, JSON.stringify(ctx, null, 2) + '\n', 'utf8');
}

function getActiveCompany() {
  return loadContext().activeCompany || null;
}

function setActiveCompany(name) {
  const ctx = loadContext();
  ctx.activeCompany = name ? name.toUpperCase() : null;
  saveContext(ctx);
}

// ---------------------------------------------------------------------------
// Company discovery
// ---------------------------------------------------------------------------

/**
 * Extract company prefix from an agent id.
 * "dtp-onxza-cli"   → "DTP"
 * "wdc-ceo"         → "WDC"
 * "mga-coo"         → "MGA"
 * "mg-parent-*"     → "MG"
 * "mgp-*"           → "MGP"
 */
function agentIdToCompany(agentId) {
  const id = (agentId || '').toLowerCase();
  if (id.startsWith('dtp-'))        return 'DTP';
  if (id.startsWith('wdc-'))        return 'WDC';
  if (id.startsWith('mga-'))        return 'MGA';
  if (id.startsWith('mg-parent-'))  return 'MG';
  if (id.startsWith('mgp-'))        return 'MGP';
  return null;
}

/**
 * Load openclaw.json and extract the agents list.
 */
function loadAgentList() {
  try {
    const data = JSON.parse(fs.readFileSync(OPENCLAW_JSON, 'utf8'));
    return (data.agents && Array.isArray(data.agents.list)) ? data.agents.list : [];
  } catch {
    return [];
  }
}

/**
 * Discover companies from shared-learnings subdirectories.
 * Returns Set of uppercase company codes.
 */
function discoverFromSharedLearnings() {
  const found = new Set();
  if (!fs.existsSync(SHARED_LEARNINGS)) return found;
  for (const entry of fs.readdirSync(SHARED_LEARNINGS)) {
    if (SYSTEM_SCOPES.has(entry.toLowerCase())) continue;
    const full = path.join(SHARED_LEARNINGS, entry);
    if (fs.statSync(full).isDirectory()) {
      found.add(entry.toUpperCase());
    }
  }
  return found;
}

/**
 * Discover companies from openclaw.json agent ids.
 */
function discoverFromAgents(agentList) {
  const found = new Set();
  for (const a of agentList) {
    const co = agentIdToCompany(a.id);
    if (co) found.add(co);
  }
  return found;
}

/**
 * Count agents per company from the agent list.
 */
function agentCountByCompany(agentList) {
  const counts = {};
  for (const a of agentList) {
    const co = agentIdToCompany(a.id);
    if (co) counts[co] = (counts[co] || 0) + 1;
  }
  return counts;
}

/**
 * Count projects per company from the workspace/projects directory.
 * Projects are counted by looking for company-name mentions in project dirs
 * or by scanning the vision.md for a matching company field.
 */
function projectCountByCompany() {
  const counts = {};
  const projectsDir = path.join(WORKSPACE, 'projects');
  if (!fs.existsSync(projectsDir)) return counts;

  for (const proj of fs.readdirSync(projectsDir)) {
    // Simple heuristic: check if a vision.md exists with company field
    const visionPath = path.join(projectsDir, proj, 'vision.md');
    if (!fs.existsSync(visionPath)) continue;
    try {
      const content = fs.readFileSync(visionPath, 'utf8');
      const m = content.match(/^company:\s*(\S+)/im);
      if (m) {
        const co = m[1].trim().toUpperCase();
        counts[co] = (counts[co] || 0) + 1;
      }
    } catch { /* skip unreadable */ }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Company operations
// ---------------------------------------------------------------------------

/**
 * List all known companies with enriched metadata.
 * @returns {object[]} array of CompanyInfo
 */
function listCompanies() {
  const agentList    = loadAgentList();
  const fromAgents   = discoverFromAgents(agentList);
  const fromDirs     = discoverFromSharedLearnings();
  const agentCounts  = agentCountByCompany(agentList);
  const projectCounts = projectCountByCompany();
  const activeCompany = getActiveCompany();

  // Union of all discovered companies
  const allCodes = new Set([...fromAgents, ...fromDirs]);

  return Array.from(allCodes).sort().map((code) => ({
    code,
    agents:         agentCounts[code]  || 0,
    projects:       projectCounts[code] || 0,
    sharedLearnings: fs.existsSync(path.join(SHARED_LEARNINGS, code)),
    active:         activeCompany === code,
  }));
}

/**
 * Check if a company code already exists.
 * @param {string} code - uppercase company code
 */
function companyExists(code) {
  const UP = code.toUpperCase();
  const companies = listCompanies();
  return companies.some((c) => c.code === UP);
}

/**
 * Add a new company:
 *   1. Create shared-learnings/<CODE>/{skills,patterns,tools}/
 *   2. Write a README.md in each subdirectory
 *   3. Register company in openclaw.json under a companies key
 *
 * @param {string} name - company name or code
 * @param {object} opts - { fullName, description }
 * @returns {{ code: string, paths: string[] }}
 */
function addCompany(name, opts = {}) {
  const code     = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
  const fullName = opts.fullName || name;
  const desc     = opts.description || `${fullName} company under ONXZA`;

  if (!code) throw new Error('Company code cannot be empty after sanitization.');

  // 1. Create shared-learnings directory structure
  const companyDir = path.join(SHARED_LEARNINGS, code);
  const createdPaths = [];

  for (const sub of COMPANY_SUBDIRS) {
    const subDir = path.join(companyDir, sub);
    fs.mkdirSync(subDir, { recursive: true });
    createdPaths.push(subDir);

    // Write a README in each subdirectory
    const readmePath = path.join(subDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      fs.writeFileSync(readmePath, generateSubdirReadme(code, sub, fullName), 'utf8');
    }
  }

  // 2. Write company-level README
  const companyReadme = path.join(companyDir, 'README.md');
  if (!fs.existsSync(companyReadme)) {
    fs.writeFileSync(companyReadme, generateCompanyReadme(code, fullName, desc), 'utf8');
    createdPaths.unshift(companyReadme);
  }

  // 3. Register in openclaw.json companies section
  registerInOpenclawJson(code, fullName, desc);

  return { code, fullName, paths: createdPaths };
}

/**
 * Register a company in openclaw.json.
 * Adds/updates a `companies` array without disturbing other keys.
 * Note: This is a controlled write to openclaw.json — reversible, auditable.
 */
function registerInOpenclawJson(code, fullName, description) {
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(OPENCLAW_JSON, 'utf8'));
  } catch {
    data = {};
  }

  if (!Array.isArray(data.companies)) data.companies = [];

  // Upsert
  const idx = data.companies.findIndex((c) => c.code === code);
  const entry = { code, fullName, description, addedAt: new Date().toISOString() };
  if (idx >= 0) {
    data.companies[idx] = { ...data.companies[idx], ...entry };
  } else {
    data.companies.push(entry);
  }

  fs.writeFileSync(OPENCLAW_JSON, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// README templates
// ---------------------------------------------------------------------------

function generateCompanyReadme(code, fullName, description) {
  const date = new Date().toISOString().split('T')[0];
  return `# Shared Learnings — ${code}

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Company:** ${fullName}  
**Code:** ${code}  
**Created:** ${date}

${description}

## Structure

\`\`\`
${code}/
├── skills/       Domain-specific skill documents for ${code} agents
├── patterns/     Reusable reasoning patterns discovered by ${code} agents
└── tools/        Tool usage notes, quirks, and best practices
\`\`\`

## Aggregation Flow

${code} specialist agents → write/update here → ${code} AgentDeveloper aggregates → MG_Parent_AgentDeveloper evaluates for global promotion → ONXZA skills library candidate
`;
}

function generateSubdirReadme(code, subdir, fullName) {
  const subdirDescriptions = {
    skills:   `Domain-specific skill documents for ${fullName} (${code}) agents. Each skill is a markdown file with YAML frontmatter. Must pass TORI-QMD before use.`,
    patterns: `Reusable reasoning patterns discovered by ${fullName} (${code}) agents. Includes corrections, workflow improvements, and escalation learnings.`,
    tools:    `Tool usage notes, API quirks, rate limit observations, and integration learnings for ${fullName} (${code}) agents.`,
  };
  const date = new Date().toISOString().split('T')[0];
  return `# ${code} — ${subdir.charAt(0).toUpperCase() + subdir.slice(1)}

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products.*

**Scope:** ${code}/${subdir}  
**Created:** ${date}

${subdirDescriptions[subdir] || ''}
`;
}

// ---------------------------------------------------------------------------
// Remove company
// ---------------------------------------------------------------------------

/**
 * Remove a company registration from openclaw.json.
 * Does NOT delete shared-learnings directory (data preservation by default).
 * Pass `opts.deleteFiles = true` to also remove the shared-learnings dir.
 *
 * @param {string} code - uppercase company code
 * @param {object} opts - { deleteFiles: boolean }
 * @returns {{ code: string, removedFrom: string[], deletedPaths: string[] }}
 */
function removeCompany(code, opts = {}) {
  const UP = code.toUpperCase();
  const removedFrom  = [];
  const deletedPaths = [];

  // 1. Remove from openclaw.json companies[]
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(OPENCLAW_JSON, 'utf8'));
  } catch {
    data = {};
  }
  if (Array.isArray(data.companies)) {
    const before = data.companies.length;
    data.companies = data.companies.filter((c) => c.code !== UP);
    if (data.companies.length < before) {
      fs.writeFileSync(OPENCLAW_JSON, JSON.stringify(data, null, 2) + '\n', 'utf8');
      removedFrom.push('openclaw.json companies[]');
    }
  }

  // 2. Clear active company context if it was this company
  if (getActiveCompany() === UP) {
    setActiveCompany(null);
    removedFrom.push('context.json (active company cleared)');
  }

  // 3. Optionally delete shared-learnings directory
  if (opts.deleteFiles) {
    const companyDir = path.join(SHARED_LEARNINGS, UP);
    if (fs.existsSync(companyDir)) {
      fs.rmSync(companyDir, { recursive: true, force: true });
      deletedPaths.push(companyDir);
    }
  }

  return { code: UP, removedFrom, deletedPaths };
}

/**
 * Get detailed status for a single company.
 * @param {string} code - uppercase company code
 * @returns {object} status including agent count, open tickets, active flag
 */
function getCompanyStatus(code) {
  const UP = code.toUpperCase();
  const companies = listCompanies();
  const co = companies.find((c) => c.code === UP);
  if (!co) return null;

  // Count open tickets assigned to agents of this company
  const ticketsDir = path.join(WORKSPACE, 'tickets', 'open');
  let openTickets = 0;
  let myTickets   = 0;
  if (fs.existsSync(ticketsDir)) {
    for (const f of fs.readdirSync(ticketsDir)) {
      if (!f.endsWith('.md')) continue;
      try {
        const content = fs.readFileSync(path.join(ticketsDir, f), 'utf8');
        openTickets++;
        // Check if assigned to any agent of this company (prefix check)
        const m = content.match(/assigned_to:\s*(\S+)/i);
        if (m && m[1].toUpperCase().startsWith(UP + '-')) myTickets++;
        // Also check for DTP_ONXZA_CLI style
        if (m && m[1].toUpperCase().startsWith(UP + '_')) myTickets++;
      } catch { /* skip */ }
    }
  }

  return {
    ...co,
    openTickets:    myTickets,
    totalOpenTickets: openTickets,
    sharedLearningsPath: path.join(SHARED_LEARNINGS, UP),
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  listCompanies,
  addCompany,
  removeCompany,
  getCompanyStatus,
  companyExists,
  getActiveCompany,
  setActiveCompany,
  agentIdToCompany,
  SHARED_LEARNINGS,
  CONTEXT_FILE,
};

'use strict';

/**
 * ONXZA Agent Reader
 *
 * Reads agent data from openclaw.json and enriches it with live state
 * from each agent's MEMORY.md (TASK_STATE, TASK_ID, current model).
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const OPENCLAW_JSON = process.env.ONXZA_OPENCLAW_JSON
  || path.join(os.homedir(), '.openclaw', 'openclaw.json');

const OPENCLAW_DIR = path.dirname(OPENCLAW_JSON);

// ---------------------------------------------------------------------------
// Load agents from openclaw.json
// ---------------------------------------------------------------------------

function loadOpenclawJson() {
  try {
    return JSON.parse(fs.readFileSync(OPENCLAW_JSON, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Extract model short name from full model string.
 * "anthropic/claude-sonnet-4-6" → "sonnet-4-6"
 * "openai/gpt-4o" → "gpt-4o"
 */
function shortModel(modelStr) {
  if (!modelStr) return '—';
  const parts = String(modelStr).split('/');
  return parts[parts.length - 1];
}

/**
 * Derive company from agent id.
 * "dtp-onxza-cli" → "DTP"
 * "wdc-ceo" → "WDC"
 * "mga-coo" → "MGA"
 * "mg-parent-marcus" → "MG"
 */
function deriveCompany(agentId) {
  const id = (agentId || '').toLowerCase();
  if (id.startsWith('dtp-'))       return 'DTP';
  if (id.startsWith('wdc-'))       return 'WDC';
  if (id.startsWith('mga-'))       return 'MGA';
  if (id.startsWith('mg-parent-')) return 'MG';
  if (id.startsWith('mgp-'))       return 'MGP';
  return '—';
}

// ---------------------------------------------------------------------------
// Read live task state from MEMORY.md
// ---------------------------------------------------------------------------

/**
 * Parse TASK_STATE and TASK_ID from a MEMORY.md file.
 * Returns { taskState: 'ACTIVE'|'IDLE'|'UNKNOWN', taskId: string|null }
 */
function readMemoryState(workspaceDir) {
  const memPath = path.join(workspaceDir, 'MEMORY.md');
  if (!fs.existsSync(memPath)) return { taskState: 'UNKNOWN', taskId: null };

  try {
    const content = fs.readFileSync(memPath, 'utf8');
    const stateMatch = content.match(/TASK_STATE:\s*(ACTIVE|IDLE)/i);
    const idMatch    = content.match(/TASK_ID:\s*(\S+)/i);
    return {
      taskState: stateMatch ? stateMatch[1].toUpperCase() : 'IDLE',
      taskId:    idMatch    ? idMatch[1]                  : null,
    };
  } catch {
    return { taskState: 'UNKNOWN', taskId: null };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load all registered agents with enriched live state.
 * @returns {object[]} array of AgentInfo objects
 */
function loadAgents() {
  const config = loadOpenclawJson();
  if (!config) return [];

  const agentList = config.agents && Array.isArray(config.agents.list)
    ? config.agents.list
    : [];

  return agentList.map((entry) => {
    const id        = entry.id || 'unknown';
    const workspace = entry.workspace
      ? (entry.workspace.startsWith('~')
          ? entry.workspace.replace('~', os.homedir())
          : entry.workspace)
      : path.join(OPENCLAW_DIR, `workspace-${id}`);

    const model   = shortModel(entry.model && entry.model.primary);
    const company = deriveCompany(id);

    const { taskState, taskId } = readMemoryState(workspace);

    return {
      id,
      company,
      model,
      workspace,
      taskState,   // 'ACTIVE' | 'IDLE' | 'UNKNOWN'
      taskId,      // current ticket ID or null
    };
  });
}

/**
 * Summarise agents by company and task state.
 * @param {object[]} agents
 * @returns {object} summary
 */
function summariseAgents(agents) {
  const total   = agents.length;
  const active  = agents.filter((a) => a.taskState === 'ACTIVE').length;
  const idle    = agents.filter((a) => a.taskState === 'IDLE').length;
  const unknown = agents.filter((a) => a.taskState === 'UNKNOWN').length;

  const byCompany = {};
  for (const a of agents) {
    const co = a.company || '—';
    if (!byCompany[co]) byCompany[co] = { total: 0, active: 0, idle: 0 };
    byCompany[co].total++;
    if (a.taskState === 'ACTIVE') byCompany[co].active++;
    else if (a.taskState === 'IDLE') byCompany[co].idle++;
  }

  return { total, active, idle, unknown, byCompany };
}

module.exports = { loadAgents, summariseAgents, loadOpenclawJson, deriveCompany, shortModel };

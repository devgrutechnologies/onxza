'use strict';

/**
 * ONXZA Agent Scaffold
 *
 * Orchestrates the full agent creation flow:
 *   1. Validate naming convention
 *   2. Check for existing agent
 *   3. Create workspace directory
 *   4. Write all 6 template files
 *   5. Run TORI-QMD on all 6 files
 *   6. Register in openclaw.json
 *   7. Create checkpoint
 *
 * ARCHITECTURE.md §12.5 · TICKET-20260318-DTP-003
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execFileSync, execSync } = require('child_process');

const { validateAgentName, nameToId, nameToWorkspaceDir } = require('./naming');
const { generateFiles } = require('./templates');
const { validateFile: toriValidate } = require('../skills/tori');

const OPENCLAW_DIR  = process.env.ONXZA_OPENCLAW_DIR || path.join(os.homedir(), '.openclaw');
const OPENCLAW_JSON = process.env.ONXZA_OPENCLAW_JSON || path.join(OPENCLAW_DIR, 'openclaw.json');
const WORKSPACE     = process.env.ONXZA_WORKSPACE     || path.join(OPENCLAW_DIR, 'workspace');
const CHECKPOINT_SCRIPT = path.join(WORKSPACE, 'scripts', 'create-checkpoint.py');

// DEFAULT MODEL ASSIGNMENT (per skill-agent-creation-global-standard.md)
const DEFAULT_MODEL_BY_ROLE_HINT = {
  security:     'anthropic/claude-opus-4-6',
  legal:        'anthropic/claude-opus-4-6',
  architect:    'anthropic/claude-opus-4-6',
  orchestrator: 'anthropic/claude-sonnet-4-6',
  pm:           'anthropic/claude-sonnet-4-6',
  ceo:          'anthropic/claude-sonnet-4-6',
  coo:          'anthropic/claude-sonnet-4-6',
  cmo:          'anthropic/claude-sonnet-4-6',
  cfo:          'anthropic/claude-haiku-4-5',
  writer:       'anthropic/claude-haiku-4-5',
  researcher:   'anthropic/claude-haiku-4-5',
  qa:           'anthropic/claude-haiku-4-5',
  router:       'anthropic/claude-haiku-4-5',
  indexer:      'anthropic/claude-haiku-4-5',
};

function inferDefaultModel(role) {
  const lower = role.toLowerCase();
  for (const [hint, model] of Object.entries(DEFAULT_MODEL_BY_ROLE_HINT)) {
    if (lower.includes(hint)) return model;
  }
  return 'anthropic/claude-sonnet-4-6'; // safe default
}

// ---------------------------------------------------------------------------
// openclaw.json helpers
// ---------------------------------------------------------------------------

function loadOpenclawJson() {
  try {
    return JSON.parse(fs.readFileSync(OPENCLAW_JSON, 'utf8'));
  } catch {
    return { agents: { list: [] } };
  }
}

function saveOpenclawJson(data) {
  fs.writeFileSync(OPENCLAW_JSON, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function agentAlreadyRegistered(agentId) {
  const data = loadOpenclawJson();
  const list = data.agents && Array.isArray(data.agents.list) ? data.agents.list : [];
  return list.some((a) => a.id === agentId);
}

function registerAgent(agentId, workspaceDir, model) {
  const data = loadOpenclawJson();
  if (!data.agents) data.agents = {};
  if (!Array.isArray(data.agents.list)) data.agents.list = [];

  // Check for duplicate
  if (data.agents.list.some((a) => a.id === agentId)) return;

  data.agents.list.push({
    id:        agentId,
    workspace: workspaceDir,
    model:     { primary: model },
  });

  saveOpenclawJson(data);
}

// ---------------------------------------------------------------------------
// Checkpoint
// ---------------------------------------------------------------------------

function createCheckpoint(slug) {
  if (!fs.existsSync(CHECKPOINT_SCRIPT)) {
    return { created: false, reason: 'checkpoint script not found' };
  }
  try {
    const out = execFileSync('python3', [CHECKPOINT_SCRIPT, slug], {
      encoding: 'utf8',
      timeout: 15000,
    });
    // Output: "checkpoint created: YYYYMMDD-HHMMSS-slug"
    const m = out.match(/checkpoint created:\s*(\S+)/i);
    return { created: true, id: m ? m[1] : out.trim() };
  } catch (err) {
    return { created: false, reason: err.message };
  }
}

// ---------------------------------------------------------------------------
// Main scaffold function
// ---------------------------------------------------------------------------

/**
 * Create a new agent workspace end-to-end.
 *
 * @param {object} params
 * @param {string} params.name           - Agent name: Company_Dept_Role
 * @param {string} params.model          - Primary model (optional — inferred if omitted)
 * @param {string} params.persistence    - 'persistent' | 'temporary'
 * @param {string} params.domain         - One-sentence domain description
 * @param {string} params.reportsTo      - Agent this one reports to
 * @param {string} params.companyFull    - Full company name
 * @param {boolean} params.dryRun        - If true, show plan without writing
 * @param {function} params.onProgress   - Progress callback (message: string)
 * @returns {object} result
 */
function scaffoldAgent(params) {
  const {
    name,
    model: modelOverride,
    persistence = 'persistent',
    domain = '',
    reportsTo = '',
    companyFull = '',
    dryRun = false,
    onProgress = () => {},
  } = params;

  // 1. Validate naming convention
  const validation = validateAgentName(name);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const { company, dept, role } = validation.parts;
  const agentId      = nameToId(name);
  const workspaceDir = nameToWorkspaceDir(name, OPENCLAW_DIR);
  const model        = modelOverride || inferDefaultModel(role);

  // 2. Check for existing agent
  if (fs.existsSync(workspaceDir) || agentAlreadyRegistered(agentId)) {
    return {
      success: false,
      error: `Agent "${name}" already exists (workspace: ${workspaceDir}).`,
    };
  }

  const fileParams = {
    name, id: agentId, company, dept, role, model,
    persistence, domain, reportsTo, workspaceDir,
    companyFull: companyFull || company,
  };

  // Dry run — return plan without writing anything
  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      agentId,
      workspaceDir,
      model,
      files: Object.keys(generateFiles(fileParams)).map((f) => path.join(workspaceDir, f)),
      willRegister: OPENCLAW_JSON,
      willCheckpoint: true,
    };
  }

  // 3. Create workspace directory
  onProgress(`Creating workspace: ${workspaceDir}`);
  fs.mkdirSync(workspaceDir, { recursive: true });

  // 4. Write all 6 files
  const files = generateFiles(fileParams);
  const writtenFiles = [];

  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(workspaceDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    writtenFiles.push(filePath);
    onProgress(`  Wrote ${filename}`);
  }

  // 5. TORI-QMD validation on all 6 files
  onProgress('Running TORI-QMD validation...');
  const toriResults = [];
  let toriAllPass = true;

  for (const filePath of writtenFiles) {
    const result = toriValidate(filePath);
    toriResults.push({ file: path.basename(filePath), pass: result.pass, message: result.message });
    if (!result.pass) toriAllPass = false;
  }

  if (!toriAllPass) {
    // Clean up on failure — remove partial workspace
    fs.rmSync(workspaceDir, { recursive: true, force: true });
    return {
      success: false,
      error: 'TORI-QMD validation failed. Workspace removed.',
      toriResults,
    };
  }
  onProgress('TORI-QMD: all 6 files PASS');

  // 6. Register in openclaw.json
  onProgress('Registering in openclaw.json...');
  registerAgent(agentId, workspaceDir, model);

  // 7. Create checkpoint
  onProgress('Creating checkpoint...');
  const checkpoint = createCheckpoint(`agent-create-${agentId}`);
  if (checkpoint.created) {
    onProgress(`Checkpoint: ${checkpoint.id}`);
  }

  return {
    success: true,
    agentId,
    workspaceDir,
    model,
    persistence,
    files: writtenFiles,
    toriResults,
    checkpoint,
    registered: true,
  };
}

module.exports = { scaffoldAgent, inferDefaultModel, agentAlreadyRegistered };

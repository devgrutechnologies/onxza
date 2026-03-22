/**
 * @onxza/core — Agent name parsing, workspace scaffolding, validation, and listing.
 * Implements onxza agent create / validate / list per ARCHITECTURE-v0.1.md §4.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import type {
  ParsedAgentName,
  AgentEntry,
  AgentTemplateContext,
  CreateAgentOptions,
  CreateAgentResult,
} from '../types.js';
import { CREDIT_LINE } from '../types.js';
import {
  requireConfig,
  getOpenclawRoot,
  registerAgent,
  getCompany,
  listAgents,
} from '../config/index.js';
import { renderAllAgentTemplates } from '../template/index.js';
import { validateAgentWorkspace, allPass } from '../tori/index.js';
import { createCheckpoint } from '../checkpoint/index.js';

// ── Name parsing ───────────────────────────────────────────────────────────────

const PASCAL_CASE_RE = /^[A-Z][A-Za-z0-9]*$/;

export interface AgentNameValidation {
  valid: boolean;
  error?: string;
  parsed?: ParsedAgentName;
}

/**
 * Parse and validate an agent name like DTP_ONXZA_Architect.
 * Returns validation result with parsed components on success.
 */
export function parseAgentName(name: string): AgentNameValidation {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Agent name is required.' };
  }

  const parts = name.trim().split('_');
  if (parts.length < 3) {
    return {
      valid: false,
      error: `Agent name must follow [Company]_[Dept]_[Role] format (e.g. WDC_Content_BlogWriter). Got: "${name}"`,
    };
  }

  const [companySlug, department, ...roleParts] = parts;
  const role = roleParts.join('_');

  if (!companySlug || !PASCAL_CASE_RE.test(companySlug)) {
    return {
      valid: false,
      error: `Company segment must be PascalCase (e.g. DTP, WDC). Got: "${companySlug}"`,
    };
  }
  if (!department || !PASCAL_CASE_RE.test(department)) {
    return {
      valid: false,
      error: `Department segment must be PascalCase (e.g. ONXZA, Content). Got: "${department}"`,
    };
  }
  if (!role || !PASCAL_CASE_RE.test(role.split('_')[0] ?? '')) {
    return {
      valid: false,
      error: `Role segment must be PascalCase (e.g. Architect, BlogWriter). Got: "${role}"`,
    };
  }

  // Convert to kebab-case ID
  const agentId = name.replace(/_/g, '-').toLowerCase();
  const workspaceDirName = `workspace-${agentId}`;

  return {
    valid: true,
    parsed: {
      raw: name,
      agentId,
      companySlug,
      department,
      role,
      workspaceDirName,
    },
  };
}

// ── Model resolution ───────────────────────────────────────────────────────────

/**
 * Resolve a model reference to provider/model format.
 * Resolves shorthand model names: claude prefix -> anthropic, gpt/o1/o3/o4 prefix -> openai, else -> ollama
 */
export function resolveModel(model: string): string {
  if (model.includes('/')) return model; // already qualified
  if (/^claude/i.test(model)) return `anthropic/${model}`;
  if (/^(gpt|o1|o3|o4)/i.test(model)) return `openai/${model}`;
  return `ollama/${model}`;
}

/**
 * Infer a default model from the agent role name.
 */
export function inferDefaultModel(role: string): string {
  const lower = role.toLowerCase();
  if (/architect|security|legal/.test(lower)) return 'anthropic/claude-opus-4-6';
  if (/orchestrator|pm|ceo|coo/.test(lower)) return 'anthropic/claude-sonnet-4-6';
  return 'anthropic/claude-sonnet-4-6';
}

// ── Shared learnings paths ─────────────────────────────────────────────────────

export function sharedLearningsReadPaths(companySlug: string, department?: string): string {
  const paths = [`shared-learnings/${companySlug}/`];
  if (department) {
    paths.push(`shared-learnings/${companySlug}/${department.toLowerCase()}/`);
  }
  return paths.join(', ');
}

export function sharedLearningsWritePath(companySlug: string): string {
  return `shared-learnings/${companySlug}/`;
}

// ── Create ─────────────────────────────────────────────────────────────────────

export function createAgent(
  agentName: string,
  options: CreateAgentOptions = {},
  root?: string
): CreateAgentResult {
  const {
    model,
    persistence = 'persistent',
    reportsTo = '',
    companyFullName: companyFullOverride,
    validate = true,
    dryRun = false,
  } = options;

  // 1. Parse name
  const nameResult = parseAgentName(agentName);
  if (!nameResult.valid || !nameResult.parsed) {
    return { success: false, error: nameResult.error };
  }
  const parsed = nameResult.parsed;

  // 2. Check for duplicate
  const config = requireConfig(root);
  if (config.agents.list.some((a) => a.id === parsed.agentId)) {
    return {
      success: false,
      error: `Agent '${parsed.agentId}' already registered in openclaw.json. Use a different name.`,
    };
  }

  // 3. Resolve company
  const company = getCompany(parsed.companySlug, root);
  if (!company) {
    return {
      success: false,
      error: `Company '${parsed.companySlug}' not registered. Run 'onxza company add' first.`,
    };
  }

  const companyFullName = companyFullOverride ?? company.name;

  // 4. Resolve model
  const resolvedModel = model
    ? resolveModel(model)
    : resolveModel(inferDefaultModel(parsed.role));

  // 5. Build context
  const openclawRoot = getOpenclawRoot(root);
  const workspaceDir = join(openclawRoot, parsed.workspaceDirName);
  const today = new Date().toISOString().slice(0, 10);

  const context: AgentTemplateContext = {
    AGENT_NAME: parsed.raw,
    AGENT_ID: parsed.agentId,
    COMPANY_SLUG: parsed.companySlug,
    COMPANY_FULL_NAME: companyFullName,
    DEPARTMENT: parsed.department,
    ROLE: parsed.role,
    MODEL: resolvedModel,
    PERSISTENCE_CLASS: persistence,
    REPORTS_TO: reportsTo || `${parsed.companySlug}_CEO`,
    CREATED_DATE: today,
    WORKSPACE_DIR: workspaceDir,
    SHARED_LEARNINGS_READ: sharedLearningsReadPaths(parsed.companySlug, parsed.department),
    SHARED_LEARNINGS_WRITE: sharedLearningsWritePath(parsed.companySlug),
    CREDIT_LINE,
  };

  // Dry run: return plan without writing
  if (dryRun) {
    const files = ['AGENTS.md', 'SOUL.md', 'IDENTITY.md', 'MEMORY.md', 'TOOLS.md', 'HEARTBEAT.md'];
    return {
      success: true,
      agentId: parsed.agentId,
      workspaceDir,
      filesCreated: files.map((f) => join(workspaceDir, f)),
      dryRun: true,
    };
  }

  // 6. Create workspace directory
  mkdirSync(workspaceDir, { recursive: true });

  // 7. Render and write templates
  let renderedFiles: Record<string, string>;
  try {
    renderedFiles = renderAllAgentTemplates(context);
  } catch (err) {
    rmSync(workspaceDir, { recursive: true, force: true });
    return { success: false, error: `Template rendering failed: ${String(err)}` };
  }

  const filesCreated: string[] = [];
  for (const [filename, content] of Object.entries(renderedFiles)) {
    const filePath = join(workspaceDir, filename);
    writeFileSync(filePath, content, 'utf-8');
    filesCreated.push(filePath);
  }

  // 8. TORI-QMD validation
  let toriResults;
  if (validate) {
    toriResults = validateAgentWorkspace(workspaceDir);
    if (!allPass(toriResults)) {
      // Clean up on validation failure
      rmSync(workspaceDir, { recursive: true, force: true });
      return {
        success: false,
        error: 'TORI-QMD validation failed. Workspace directory removed.',
        toriResults,
      };
    }
  }

  // 9. Register in openclaw.json
  const agentEntry: AgentEntry = {
    id: parsed.agentId,
    workspace: workspaceDir,
    model: { primary: resolvedModel },
    company: parsed.companySlug,
    persistence,
  };
  registerAgent(agentEntry, root);

  // 10. Create checkpoint
  let checkpointId: string | undefined;
  try {
    const cp = createCheckpoint({
      slug: `agent-create-${parsed.agentId}`,
      trigger: `onxza agent create ${parsed.agentId}`,
      agentId: 'onxza-cli',
      description: `Agent workspace created: ${parsed.raw}`,
      root,
    });
    checkpointId = cp.id;
  } catch { /* non-fatal */ }

  return {
    success: true,
    agentId: parsed.agentId,
    workspaceDir,
    filesCreated,
    toriResults,
    checkpointId,
  };
}

// ── Validate ───────────────────────────────────────────────────────────────────

export interface AgentValidationResult {
  agentId: string;
  checks: Array<{ name: string; pass: boolean; detail?: string }>;
  pass: boolean;
}

export function validateAgent(agentId: string, root?: string): AgentValidationResult {
  const config = requireConfig(root);
  const checks: AgentValidationResult['checks'] = [];

  // 1. Registered in openclaw.json
  const entry = config.agents.list.find((a) => a.id === agentId);
  checks.push({
    name: 'Registered in openclaw.json',
    pass: !!entry,
    detail: entry ? `Found entry` : 'Not registered',
  });

  if (!entry) {
    return { agentId, checks, pass: false };
  }

  // 2. Workspace directory exists
  const wsExists = existsSync(entry.workspace);
  checks.push({
    name: 'Workspace directory exists',
    pass: wsExists,
    detail: entry.workspace,
  });

  if (!wsExists) {
    return { agentId, checks, pass: false };
  }

  // 3–6. TORI-QMD on all 6 files
  const toriResults = validateAgentWorkspace(entry.workspace);
  for (const r of toriResults) {
    const fname = r.filePath.split('/').pop() ?? r.filePath;
    checks.push({
      name: `TORI-QMD: ${fname}`,
      pass: r.pass,
      detail: r.pass ? 'PASS' : r.errors.map((e) => e.message).join('; '),
    });
  }

  // 7. Model is well-formed
  const modelOk = !!(entry.model?.primary && entry.model.primary.includes('/'));
  checks.push({
    name: 'Model reference well-formed',
    pass: modelOk,
    detail: entry.model?.primary ?? '(not set)',
  });

  // 8. Company slug valid
  const companyOk = !entry.company || !!getCompany(entry.company, root);
  checks.push({
    name: 'Company slug references valid company',
    pass: companyOk,
    detail: entry.company ?? '(not set)',
  });

  const pass = checks.every((c) => c.pass);
  return { agentId, checks, pass };
}

// ── List ───────────────────────────────────────────────────────────────────────

export function listAgentsSummary(
  root?: string,
  filters?: { company?: string; status?: string; model?: string }
): AgentEntry[] {
  let agents = listAgents(root);

  if (filters?.company) {
    agents = agents.filter(
      (a) => a.company?.toLowerCase() === filters.company?.toLowerCase()
    );
  }
  if (filters?.model) {
    agents = agents.filter((a) =>
      a.model?.primary?.toLowerCase().includes(filters.model?.toLowerCase() ?? '')
    );
  }

  return agents;
}

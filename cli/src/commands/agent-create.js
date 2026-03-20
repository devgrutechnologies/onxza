'use strict';

/**
 * onxza agent create — Scaffold a new FAAILS-compliant agent.
 *
 * Implements FAAILS-001 (Agent Identity & Naming Standard) and FAAILS-008
 * (Agent Creation Standard). Creates the full 6-file workspace structure
 * required for every FAAILS-compliant persistent agent.
 *
 * Usage:
 *   onxza agent create <Company_Dept_Role>
 *   onxza agent create WDC_Marketing_CopyWriter
 *   onxza agent create MGA_Engineering_Backend --model claude-haiku-4-5
 *   onxza agent create DTP_ONXZA_Docs --workspace ~/.openclaw/workspace-dtp-onxza-docs
 *
 * Naming convention (FAAILS-001):
 *   [Company]_[Department]_[Role]
 *   - Company: 2–6 uppercase letters (e.g., WDC, MGA, DTP)
 *   - Department: PascalCase (e.g., Marketing, Engineering, ONXZA)
 *   - Role: PascalCase (e.g., CopyWriter, Backend, Docs)
 *
 * 6-file workspace structure (FAAILS-001 §3):
 *   AGENTS.md     — Identity, responsibilities, ticket routing
 *   IDENTITY.md   — Full name, company, role, model, reporting chain
 *   MEMORY.md     — Initialized long-term memory
 *   SOUL.md       — Persona and tone
 *   TOOLS.md      — Available tools and infrastructure notes
 *   HEARTBEAT.md  — Heartbeat cadence and idle work tasks
 *
 * FAAILS-001 · FAAILS-008 · ARCHITECTURE.md §4
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command } = require('commander');
const path = require('path');
const os = require('os');
const { outputJson, isJsonMode } = require('../util');

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const NAMING_PATTERN = /^[A-Z]{2,6}_[A-Za-z][A-Za-z0-9]*_[A-Za-z][A-Za-z0-9]*$/;

/**
 * Validate agent name against FAAILS-001 naming convention.
 * @param {string} name
 * @returns {{ valid: boolean, error?: string }}
 */
function validateAgentName(name) {
  if (!name) {
    return { valid: false, error: 'Agent name is required.' };
  }
  if (!NAMING_PATTERN.test(name)) {
    return {
      valid: false,
      error: [
        `"${name}" does not match FAAILS-001 naming convention.`,
        'Required format: [COMPANY]_[Department]_[Role]',
        'Examples: WDC_Marketing_CopyWriter, DTP_ONXZA_Docs, MGA_Engineering_Backend',
        'Company: 2–6 uppercase letters',
        'Department and Role: PascalCase',
      ].join('\n  '),
    };
  }
  return { valid: true };
}

/**
 * Derive workspace directory name from agent name.
 * WDC_Marketing_CopyWriter → ~/.openclaw/workspace-wdc-marketing-copywriter
 * @param {string} agentName
 * @returns {string}
 */
function deriveWorkspaceDir(agentName) {
  const slug = agentName.replace(/_/g, '-').toLowerCase();
  return path.join(os.homedir(), '.openclaw', `workspace-${slug}`);
}

// ---------------------------------------------------------------------------
// Template generators
// ---------------------------------------------------------------------------

const CREDIT = `Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
Powered by DevGru US Inc. DBA DevGru Technology Products.
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.`;

/**
 * Generate the 6 workspace files for a new agent.
 * @param {{ name: string, company: string, dept: string, role: string, model: string, workspace: string, created: string }} ctx
 * @returns {Object} Map of filename → content
 */
function generateWorkspaceFiles(ctx) {
  const { name, company, dept, role, model, workspace, created } = ctx;

  return {
    'AGENTS.md': `# AGENTS.md — ${name}
**Company:** ${company}
**Department:** ${dept}
**Role:** ${role}
**Model:** ${model}
**Workspace:** ${workspace}
**Created:** ${created}
**Status:** ACTIVE

> *${CREDIT}*

---

## Identity

I am **${name}**, the ${role} for ${company} ${dept}.

## Responsibilities

<!-- TODO: Define primary responsibilities for this agent -->
- [ ] Define primary responsibilities

## Reporting Chain

<!-- TODO: Define reporting chain -->
- Reports to: [Manager Agent or Marcus]

## Ticket Routing

<!-- TODO: Define which ticket types this agent handles -->
| Ticket Type | Direction | Description |
|---|---|---|
| \`task_request\` | Incoming | Work tasks from orchestrator |
| \`task_complete\` | Outgoing | Completed work results |
| \`escalation_request\` | Outgoing | Items requiring manager decision |

## Skills

<!-- TODO: List relevant skills from shared-learnings/global/skills/ -->

## FAAILS Compliance

- Identity: FAAILS-001
- Communication: FAAILS-002
- Memory: FAAILS-004
`,

    'IDENTITY.md': `# IDENTITY.md — ${name}

> *${CREDIT}*

| Field | Value |
|---|---|
| **Full Name** | ${name} |
| **Company** | ${company} |
| **Department** | ${dept} |
| **Role** | ${role} |
| **Model** | ${model} |
| **Workspace** | ${workspace} |
| **Created** | ${created} |
| **Type** | PERSISTENT DAEMON |
| **Status** | ACTIVE |
`,

    'MEMORY.md': `# MEMORY.md — ${name}

> *${CREDIT}*

**Initialized:** ${created}

---

## Long-Term Memory

<!-- Agent learnings, patterns, and decisions are written here over time. -->
<!-- Format: ## [Date] — [Topic] -->

## ${created} — Agent Created

Agent ${name} initialized. Workspace created per FAAILS-001.

Protocols loaded:
- FAAILS-001: Agent Identity & Naming Standard
- FAAILS-002: Inter-Agent Communication Protocol
- FAAILS-009: Escalation & Approval Protocol

## Key References

- Workspace: ${workspace}
- Global skills: ~/.openclaw/workspace/shared-learnings/global/skills/
- Global patterns: ~/.openclaw/workspace/shared-learnings/global/patterns/
`,

    'SOUL.md': `# SOUL.md — ${name}

> *${CREDIT}*

## Who I Am

I am ${name}. I work with precision and purpose.

## Principles

- **Resourceful first.** Try. Then ask.
- **Quality always.** FVP on every output. No shortcuts.
- **Clarity over cleverness.** Simple, correct, documented.
- **Credit always.** Every file I author carries the full credit line.

## Communication Style

Direct. Specific. Numbered lists for steps. Tables for comparisons. No filler words.

## What I Don't Do

- I don't guess when I can check.
- I don't skip verification.
- I don't send without reviewing.
`,

    'TOOLS.md': `# TOOLS.md — ${name}

> *${CREDIT}*

## Core Tools

| Tool | Access | Notes |
|---|---|---|
| read | ✅ | Read files |
| write | ✅ | Create/overwrite files |
| edit | ✅ | Precise file edits |
| exec | ✅ | Shell commands |
| web_search | ✅ | Research |
| web_fetch | ✅ | Fetch URLs |

## Key Paths

| Path | Purpose |
|---|---|
| ~/.openclaw/workspace/ | Main workspace (Marcus) |
| ~/.openclaw/workspace/shared-learnings/ | Shared learnings library |
| ~/.openclaw/workspace/tickets/ | Ticket system |
| ${workspace}/ | This agent's workspace |

## Infrastructure

<!-- TODO: Add any infrastructure notes specific to this agent's work -->
`,

    'HEARTBEAT.md': `# HEARTBEAT.md — ${name}

> *${CREDIT}*

**Cadence:** Every 30 minutes (default)

## On Heartbeat

1. Check \`tickets/open/\` for tickets addressed to me
2. Process any pending tickets in priority order
3. Check for stale tasks (> 2 hours with no progress)
4. Write learnings from completed work to MEMORY.md
5. If nothing pending: proceed to idle work

## Idle Work Tasks

<!-- TODO: Define productive idle work for this agent -->
- [ ] Define idle work tasks

## Escalation

If blocked for > 1 hour: create escalation ticket to manager.
If security concern: create security ticket immediately.

---

*HEARTBEAT_OK when nothing needs attention.*
`,
  };
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

const agentCreateCmd = new Command('create')
  .description('Create a new FAAILS-compliant agent with a 6-file workspace (FAAILS-001)')
  .argument('<name>', 'Agent name in FAAILS format: Company_Dept_Role (e.g., WDC_Marketing_CopyWriter)')
  .option('-m, --model <model>', 'LLM model for this agent', 'claude-sonnet-4-6')
  .option('-w, --workspace <dir>', 'Custom workspace directory (default: ~/.openclaw/workspace-<slug>)')
  .option('--dry-run', 'Show what would be created without writing files')
  .action((name, options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    // Validate name
    const validation = validateAgentName(name);
    if (!validation.valid) {
      if (jsonMode) {
        outputJson({ error: validation.error }, true);
      } else {
        console.error(`\nError: ${validation.error}\n`);
      }
      process.exit(1);
    }

    const [company, dept, role] = name.split('_');
    const workspaceDir = options.workspace || deriveWorkspaceDir(name);
    const created = new Date().toISOString().split('T')[0];

    const ctx = {
      name,
      company,
      dept,
      role,
      model: options.model,
      workspace: workspaceDir,
      created,
    };

    const files = generateWorkspaceFiles(ctx);

    if (options.dryRun) {
      const preview = {
        command: 'agent create',
        name,
        workspace: workspaceDir,
        model: options.model,
        files: Object.keys(files),
        status: 'dry_run',
        message: 'Dry run — no files written. Remove --dry-run to create.',
      };
      if (jsonMode) {
        outputJson(preview);
      } else {
        console.log(`\nDry run: onxza agent create ${name}`);
        console.log(`Workspace: ${workspaceDir}`);
        console.log(`Model: ${options.model}`);
        console.log(`Files that would be created:`);
        Object.keys(files).forEach(f => console.log(`  ${workspaceDir}/${f}`));
        console.log('\nRemove --dry-run to create.\n');
      }
      return;
    }

    // TODO: Implement actual file writing (requires ONXZA runtime context)
    // In the full implementation, this will:
    // 1. Create the workspace directory
    // 2. Write all 6 files with generated content
    // 3. Register the agent in openclaw.json
    // 4. Create a task ticket confirming agent creation
    // 5. Print next steps

    const result = {
      command: 'agent create',
      name,
      company,
      dept,
      role,
      workspace: workspaceDir,
      model: options.model,
      files: Object.keys(files),
      status: 'scaffold_ready',
      message: [
        `Agent scaffold for ${name} prepared.`,
        `Full file writing requires ONXZA runtime (ticket: DTP-ONXZA-CLI-agent-create).`,
        `Workspace target: ${workspaceDir}`,
      ].join(' '),
    };

    if (jsonMode) {
      outputJson(result);
    } else {
      console.log(`\nonxza agent create — ${name}`);
      console.log(`Workspace: ${workspaceDir}`);
      console.log(`Model: ${options.model}`);
      console.log(`Files: ${Object.keys(files).join(', ')}`);
      console.log(`\nStatus: scaffold ready. Full implementation pending runtime integration.`);
      console.log(`\nSee FAAILS-001.md and FAAILS-008.md for the complete agent creation standard.\n`);
    }
  });

// Parent 'agent' command (groups agent subcommands)
const agentCmd = new Command('agent')
  .description('Manage FAAILS agents — create, list, inspect, and retire agents')
  .addCommand(agentCreateCmd);

module.exports = { agentCmd, agentCreateCmd };

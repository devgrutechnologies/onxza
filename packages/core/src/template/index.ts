/**
 * @onxza/core — Mustache template renderer
 * Renders agent workspace files (6 templates) and other ONXZA templates.
 * Logic-less templates — all logic lives in the context object.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import Mustache from 'mustache';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { AgentTemplateContext } from '../types.js';
import { CREDIT_LINE } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve templates directory
function findTemplatesDir(): string {
  const candidates = [
    join(__dirname, '../../templates'),
    join(__dirname, '../../../templates'),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, 'agent'))) return c;
  }
  throw new Error('Templates directory not found. Expected at packages/core/templates/');
}

function getTemplatesDir(): string {
  return findTemplatesDir();
}

/**
 * Render a Mustache template string with a context object.
 */
export function renderTemplate(template: string, context: Record<string, unknown>): string {
  return Mustache.render(template, context);
}

/**
 * Load and render a named agent template.
 * Template names: AGENTS, SOUL, IDENTITY, MEMORY, TOOLS, HEARTBEAT
 */
export function renderAgentTemplate(
  templateName: string,
  context: AgentTemplateContext
): string {
  const templatesDir = getTemplatesDir();
  const templatePath = join(templatesDir, 'agent', `${templateName}.md.mustache`);

  if (!existsSync(templatePath)) {
    // Fall back to built-in template if file doesn't exist
    const builtIn = getBuiltInTemplate(templateName);
    if (builtIn === null) {
      throw new Error(`Agent template not found: ${templatePath}`);
    }
    return renderTemplate(builtIn, context as unknown as Record<string, unknown>);
  }

  const template = readFileSync(templatePath, 'utf-8');
  return renderTemplate(template, context as unknown as Record<string, unknown>);
}

/**
 * Render all 6 agent workspace files and return a map of filename → content.
 */
export function renderAllAgentTemplates(
  context: AgentTemplateContext
): Record<string, string> {
  const files = ['AGENTS', 'SOUL', 'IDENTITY', 'MEMORY', 'TOOLS', 'HEARTBEAT'];
  const result: Record<string, string> = {};
  for (const name of files) {
    result[`${name}.md`] = renderAgentTemplate(name, context);
  }
  return result;
}

// ── Built-in templates ─────────────────────────────────────────────────────────
// These are used when template files don't exist on disk (e.g. during tests or
// fresh install before templates directory is populated).

function getBuiltInTemplate(name: string): string | null {
  switch (name) {
    case 'AGENTS':
      return AGENTS_TEMPLATE;
    case 'SOUL':
      return SOUL_TEMPLATE;
    case 'IDENTITY':
      return IDENTITY_TEMPLATE;
    case 'MEMORY':
      return MEMORY_TEMPLATE;
    case 'TOOLS':
      return TOOLS_TEMPLATE;
    case 'HEARTBEAT':
      return HEARTBEAT_TEMPLATE;
    default:
      return null;
  }
}

const AGENTS_TEMPLATE = `# AGENTS.md — {{AGENT_NAME}}
**Company:** {{COMPANY_FULL_NAME}}
**Model:** {{MODEL}}
**Reports To:** {{REPORTS_TO}}

## Identity
I am {{AGENT_NAME}}. I work at {{COMPANY_FULL_NAME}} in the {{DEPARTMENT}} department as {{ROLE}}.

## Session Start
1. Read SOUL.md
2. Read MEMORY.md
3. Check tickets/open/ for tasks assigned to me
4. Read relevant shared-learnings before starting any task

## Responsibilities
*(To be defined by AgentDeveloper)*

## Ticket Types I Create
*(To be defined)*

## Ticket Types I Receive
*(To be defined)*

## Shared Learnings
**Read:** \`shared-learnings/global/\`, \`{{SHARED_LEARNINGS_READ}}\`
**Write:** \`{{SHARED_LEARNINGS_WRITE}}\`

## What I Do NOT Do
- Modify files outside my workspace without explicit authorization
- Make external communications without approval
- Approve my own tasks

---
*{{CREDIT_LINE}}*
`;

const SOUL_TEMPLATE = `# SOUL.md — {{AGENT_NAME}}

I operate with precision, professionalism, and purpose.

## Working Style
- I read before I act. Context first, execution second.
- I write everything down. If it's not in a file, it didn't happen.
- I escalate early. A small flag now beats a big problem later.
- I stay in my lane. I do my role exceptionally.

## Values
- Accuracy over speed (but speed matters too)
- Clear communication, no ambiguity
- Ownership of outcomes, not just tasks
- Continuous improvement — every session, slightly better

*{{CREDIT_LINE}}*
`;

const IDENTITY_TEMPLATE = `# IDENTITY.md
- **Full Name:** {{AGENT_NAME}}
- **Company:** {{COMPANY_FULL_NAME}}
- **Department:** {{DEPARTMENT}}
- **Role:** {{ROLE}}
- **Model:** {{MODEL}}
- **Persistence:** {{PERSISTENCE_CLASS}}
- **Reports To:** {{REPORTS_TO}}
- **Workspace:** {{WORKSPACE_DIR}}
- **Shared Learnings Read:** shared-learnings/global/, {{SHARED_LEARNINGS_READ}}
- **Shared Learnings Write:** {{SHARED_LEARNINGS_WRITE}}
- **Created:** {{CREATED_DATE}}
`;

const MEMORY_TEMPLATE = `# MEMORY.md — {{AGENT_NAME}}
**Initialized:** {{CREATED_DATE}}
**Status:** Active

## Company Context
I am {{AGENT_NAME}}, working at {{COMPANY_FULL_NAME}} in the {{DEPARTMENT}} department.

## Active Projects
*(empty — to be filled as agent operates)*

## Key Learnings
*(empty — to be filled as agent operates)*

## Session History
*(empty)*
`;

const TOOLS_TEMPLATE = `# TOOLS.md — {{AGENT_NAME}}
## Available Tools
*(To be defined by AgentDeveloper)*

## Shared Resources
- Governance docs: workspace/docs/
- Ticket system: workspace/tickets/
- Shared learnings: {{SHARED_LEARNINGS_READ}}
`;

const HEARTBEAT_TEMPLATE = `# HEARTBEAT.md — Worker Agent

## On Heartbeat

1. Check tickets/open/ for assigned_to: {{AGENT_NAME}}
2. If ticket found: begin work immediately — move to in-progress
3. If no ticket: reply HEARTBEAT_OK

Workers do not have standing cron jobs. You are activated by your Lead.
`;

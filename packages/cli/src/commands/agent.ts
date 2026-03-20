/**
 * onxza agent — Agent lifecycle sub-commands.
 *
 * Sub-commands:
 *   create <Company_Dept_Role>     Scaffold new agent workspace
 *   list                           List all registered agents
 *   validate <agent-id>            Validate all 6 agent workspace files
 *
 * Spec: ARCHITECTURE-v0.1.md §4, §7.3, §7.4
 *
 * Core dependency: @onxza/core/agent — NOT YET BUILT.
 * Scaffold: all flags, argument contracts, help text, and output shapes are complete.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command } from 'commander';
import {
  setOutputContext, outputJson, table, success, error, step, blank,
  exitValidationError,
} from '../util/output.js';

// ---------------------------------------------------------------------------
// agent create
// ---------------------------------------------------------------------------

function makeAgentCreateCommand(): Command {
  return new Command('create')
    .description('Scaffold a new agent workspace (6 files, TORI-QMD, register, checkpoint)')
    .argument('<Company_Dept_Role>',
      'Agent name in [Company]_[Dept]_[Role] format, e.g. WDC_Content_BlogWriter')
    .option('--model <ref>',
      'Primary LLM model (e.g. claude-sonnet-4-6). Inferred from role if omitted.')
    .option('--persistence <class>',
      'Persistence class: persistent | temporary', 'persistent')
    .option('--reports-to <agent-name>',
      'Name of the agent this one reports to (prompted if omitted)')
    .option('--no-validate',
      'Skip TORI-QMD validation after file creation (dangerous)')
    .option('--json', 'Machine-readable JSON output')
    .action(async (agentName: string, opts) => {
      setOutputContext({ json: !!opts.json });

      // Naming validation (§4.2)
      const parts = agentName.split('_');
      if (parts.length !== 3) {
        exitValidationError(
          `Invalid agent name: "${agentName}"\n` +
          `  Must follow [Company]_[Dept]_[Role] — exactly 2 underscores.\n` +
          `  Example: onxza agent create WDC_Content_BlogWriter`
        );
      }
      const [company, dept, role] = parts as [string, string, string];
      const pascalRe = /^[A-Z][A-Za-z0-9]*$/;
      for (const [seg, label] of [[company, 'Company'], [dept, 'Department'], [role, 'Role']] as const) {
        if (!pascalRe.test(seg)) {
          exitValidationError(
            `${label} segment "${seg}" must be PascalCase (e.g. WDC, Content, BlogWriter).\n` +
            `  Each segment must start with an uppercase letter.`
          );
        }
      }

      // TODO: wire to @onxza/core when backend delivers packages/core/src/agent/create.ts
      // import { createAgent } from '@onxza/core';
      // const result = await createAgent({ agentName, model: opts.model, persistence: opts.persistence, reportsTo: opts.reportsTo, validate: opts.validate !== false });

      _notYetImplemented('agent create', {
        agentName,
        derivedId: agentName.replace(/_/g, '-').toLowerCase(),
        company, dept, role,
        model:       opts.model ?? '(inferred from role)',
        persistence: opts.persistence,
        reportsTo:   opts.reportsTo ?? '(will prompt)',
        validate:    opts.validate !== false,
        plannedSteps: [
          '1. Validate agent name and segments',
          '2. Check for duplicate in openclaw.json',
          '3. Resolve company from openclaw.json companies.list',
          '4. Prompt for missing values (--reports-to)',
          '5. Create workspace directory',
          '6. Render 6 Mustache templates',
          '7. Run TORI-QMD validation on all 6 files',
          '8. Register agent in openclaw.json agents.list',
          '9. Create checkpoint',
          '10. Print summary',
        ],
      });
    });
}

// ---------------------------------------------------------------------------
// agent list
// ---------------------------------------------------------------------------

function makeAgentListCommand(): Command {
  return new Command('list')
    .description('List all registered agents')
    .option('--company <slug>', 'Filter by company slug (e.g. DTP, WDC)')
    .option('--json',           'Output agents array as JSON')
    .action(async (opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { listAgents } from '@onxza/core';
      // const agents = await listAgents({ company: opts.company });

      _notYetImplemented('agent list', {
        filter: { company: opts.company ?? null },
        outputShape: {
          json: '{ agents: AgentEntry[], total: number }',
          table: 'ID | Company | Model | Persistence | Status',
        },
      });
    });
}

// ---------------------------------------------------------------------------
// agent validate
// ---------------------------------------------------------------------------

function makeAgentValidateCommand(): Command {
  return new Command('validate')
    .description('Validate all 6 agent workspace files (8 checks per ARCHITECTURE-v0.1.md §7.4)')
    .argument('<agent-id>', 'Agent ID (kebab-case, e.g. dtp-onxza-architect) or workspace path')
    .option('--json', 'Machine-readable JSON output')
    .action(async (agentId: string, opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { validateAgent } from '@onxza/core';
      // const result = await validateAgent({ agentId });

      _notYetImplemented('agent validate', {
        agentId,
        checks: [
          '1. All 6 files exist (AGENTS.md, SOUL.md, IDENTITY.md, MEMORY.md, TOOLS.md, HEARTBEAT.md)',
          '2. AGENTS.md passes TORI-QMD (credit line)',
          '3. IDENTITY.md has all required fields',
          '4. MEMORY.md has required sections',
          '5. Agent ID exists in openclaw.json agents.list',
          '6. Workspace path in openclaw.json matches actual directory',
          '7. Model reference is well-formed (provider/name)',
          '8. Company slug (if set) references a valid company',
        ],
        outputShape: '{ agentId, pass: boolean, checks: { name, pass, detail }[] }',
      });
    });
}

// ---------------------------------------------------------------------------
// Root: onxza agent
// ---------------------------------------------------------------------------

export function makeAgentCommand(): Command {
  const cmd = new Command('agent')
    .description('Manage ONXZA agents');

  cmd.addCommand(makeAgentCreateCommand());
  cmd.addCommand(makeAgentListCommand());
  cmd.addCommand(makeAgentValidateCommand());

  return cmd;
}

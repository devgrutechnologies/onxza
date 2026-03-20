'use strict';

/**
 * onxza learnings — Shared Learnings promotion pipeline.
 *
 * Subcommands:
 *   onxza learnings push <file> --company <name> [--type <type>] [--agent <id>]
 *   onxza learnings review [--company <name>] [--type <type>]
 *   onxza learnings promote <file> --to <global|company> [--company <name>] [--agent <id>]
 *   onxza learnings list [--company <name>] [--tier <tier>] [--type <type>]
 *   onxza learnings validate <file>
 *   onxza learnings new <slug> --company <name> --type <type> [--agent <id>]
 *
 * Delegates to manage-learnings.py (Tier 3, zero LLM).
 * The `new` subcommand creates a templated scaffold for a new learning.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command } = require('commander');
const { execFileSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { outputJson, isJsonMode } = require('../util');

const SCRIPT    = path.join(os.homedir(), '.openclaw', 'workspace', 'scripts', 'manage-learnings.py');
const WORKSPACE = path.join(os.homedir(), '.openclaw', 'workspace');

const VALID_TYPES    = ['pattern', 'correction', 'tool_note', 'escalation_log', 'model_observation', 'workflow', 'skill'];
const VALID_COMPANIES = ['DTP', 'WDC', 'MGA', 'global'];
const CREDIT_LINE    = 'Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products.';

function runScript(args) {
  try {
    const output = execFileSync('python3', [SCRIPT, ...args], {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    return { output, exitCode: 0 };
  } catch (err) {
    return { output: err.stdout || '', stderr: err.stderr || '', exitCode: err.status || 1 };
  }
}

// ─── parent ───────────────────────────────────────────────────────────────────

const learningsCmd = new Command('learnings')
  .description('Shared Learnings promotion pipeline — push, review, and promote knowledge across tiers')
  .addHelpText('after', `
Learning types: ${VALID_TYPES.join(' | ')}
Companies:      ${VALID_COMPANIES.join(' | ')}

Examples:
  onxza learnings new my-pattern --company DTP --type pattern
  onxza learnings push ./my-pattern.md --company DTP --type pattern --agent wdc-coo
  onxza learnings review
  onxza learnings review --company WDC
  onxza learnings promote shared-learnings/DTP/patterns/my-pattern.md --to global --agent dtp-pm
  onxza learnings list --company DTP
  onxza learnings list --tier global --type skill
  onxza learnings validate ./my-learning.md
`);

// ─── learnings new ────────────────────────────────────────────────────────────

learningsCmd
  .command('new <slug>')
  .description('Scaffold a new learning file from template')
  .requiredOption('--company <name>', `Company tier: ${VALID_COMPANIES.join(' | ')}`)
  .requiredOption('--type <type>', `Learning type: ${VALID_TYPES.join(' | ')}`)
  .option('--agent <id>', 'Agent creating this learning', 'unknown')
  .option('--title <title>', 'Title for the learning (defaults to slug)')
  .option('--summary <text>', 'One-line summary', 'No summary provided')
  .option('--out <dir>', 'Output directory (defaults to current directory)', '.')
  .action((slug, options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    if (!VALID_COMPANIES.includes(options.company)) {
      const err = { error: `Invalid company. Choose: ${VALID_COMPANIES.join(', ')}` };
      if (jsonMode) { outputJson(err); } else { console.error(`Error: ${err.error}`); }
      process.exit(1);
    }
    if (!VALID_TYPES.includes(options.type)) {
      const err = { error: `Invalid type. Choose: ${VALID_TYPES.join(', ')}` };
      if (jsonMode) { outputJson(err); } else { console.error(`Error: ${err.error}`); }
      process.exit(1);
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const title = options.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const memoryId = `${options.company.toUpperCase()}-${slug.toUpperCase().replace(/-/g, '_')}-001`;

    const content = `---
memory_id: ${memoryId}
type: ${options.type}
agent: ${options.agent}
company: ${options.company}
tier: ${options.company.toLowerCase()}
created: ${dateStr}
promoted_from: none
promoted_at: none
tags: ${options.type}, ${options.company.toLowerCase()}
summary: ${options.summary}
status: draft
---

# ${title}

> *${CREDIT_LINE}*

## Summary
${options.summary}

## Learning

[Describe what was discovered — what happened, when, and why it matters to the system.]

## Context
[When does this apply? What situation or task triggered this learning?]

## What to Do
[Concrete steps, approach, or recommendation.]

## What NOT to Do
[Anti-patterns, mistakes made, or approaches that failed.]

## Evidence
[Ticket ID, task reference, or brief description of the situation that generated this learning.]

## Version History
| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | ${dateStr} | Initial draft |
`;

    const filename = `${slug}.md`;
    const outPath = path.resolve(options.out, filename);

    if (fs.existsSync(outPath)) {
      const err = { error: `File already exists: ${outPath}` };
      if (jsonMode) { outputJson(err); } else { console.error(`Error: ${err.error}`); }
      process.exit(1);
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content, 'utf-8');

    if (jsonMode) {
      outputJson({ status: 'ok', file: outPath, company: options.company, type: options.type });
    } else {
      console.log(`\n✓ Learning scaffolded: ${outPath}`);
      console.log(`  Type    : ${options.type}`);
      console.log(`  Company : ${options.company}`);
      console.log(`\n  Edit the file, then push it:`);
      console.log(`  onxza learnings push ${filename} --company ${options.company} --type ${options.type} --agent ${options.agent}`);
      console.log();
    }
  });

// ─── learnings push ───────────────────────────────────────────────────────────

learningsCmd
  .command('push <file>')
  .description('Submit a learning file to a company-tier shared-learnings directory')
  .requiredOption('--company <name>', `Company: ${VALID_COMPANIES.join(' | ')}`)
  .option('--type <type>', `Learning type (default: pattern): ${VALID_TYPES.join(' | ')}`, 'pattern')
  .option('--agent <id>', 'Agent submitting the learning', 'unknown')
  .action((file, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const fullPath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    const args = ['--push', fullPath, '--company', options.company, '--type', options.type, '--agent', options.agent];
    if (jsonMode) args.push('--json');
    const { output, stderr, exitCode } = runScript(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ─── learnings review ─────────────────────────────────────────────────────────

learningsCmd
  .command('review')
  .description('Show pending skill_approval_request tickets (PM review queue)')
  .option('--company <name>', 'Filter by company')
  .option('--type <type>', 'Filter by learning type')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--review'];
    if (options.company) args.push('--company', options.company);
    if (options.type)    args.push('--type', options.type);
    if (jsonMode)        args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── learnings promote ────────────────────────────────────────────────────────

learningsCmd
  .command('promote <file>')
  .description('Promote a company-tier learning to global (or cross-company)')
  .requiredOption('--to <tier>', 'Target tier: global | company')
  .option('--company <name>', 'Target company (required when --to company)')
  .option('--agent <id>', 'Agent performing the promotion', 'unknown')
  .action((file, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const fullPath = path.isAbsolute(file) ? file : path.join(WORKSPACE, file);
    const args = ['--promote', fullPath, '--to', options.to, '--agent', options.agent];
    if (options.company) args.push('--company', options.company);
    if (jsonMode) args.push('--json');
    const { output, stderr, exitCode } = runScript(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ─── learnings list ───────────────────────────────────────────────────────────

learningsCmd
  .command('list')
  .description('List all shared learning files with metadata')
  .option('--company <name>', 'Filter by company')
  .option('--tier <tier>', 'Filter by tier: global | company')
  .option('--type <type>', 'Filter by learning type')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--list'];
    if (options.company) args.push('--company', options.company);
    if (options.tier)    args.push('--tier', options.tier);
    if (options.type)    args.push('--type', options.type);
    if (jsonMode)        args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── learnings validate ───────────────────────────────────────────────────────

learningsCmd
  .command('validate <file>')
  .description('Run TORI-QMD validation on a learning file before pushing')
  .action((file, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const fullPath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    const args = ['--validate', fullPath];
    if (jsonMode) args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

module.exports = learningsCmd;

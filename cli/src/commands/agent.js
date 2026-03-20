'use strict';

/**
 * onxza agent — Agent lifecycle command group.
 *
 * Sub-commands:
 *   create <Company_Dept_Role>  Scaffold new agent workspace (6 files, TORI-QMD, register, checkpoint)
 *   list                        List all registered agents with live status
 *   validate <agent-id>         Run TORI-QMD on all 6 files in an agent workspace
 *
 * ARCHITECTURE.md §7, §12.3, §12.5 · TICKET-20260318-DTP-003 (create)
 *                                   · TICKET-20260318-DTP-004 (list, validate)
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const { Command }  = require('commander');
const path         = require('path');
const os           = require('os');
const { outputJson, isJsonMode } = require('../util');
const { validateAgentName, nameToId, idToDisplayName } = require('../agents/naming');
const { scaffoldAgent, inferDefaultModel, agentAlreadyRegistered } = require('../agents/scaffold');
const { validateFile: toriValidate } = require('../skills/tori');
const { loadAgents, summariseAgents } = require('../system/agents');

const AGENT_FILES = ['AGENTS.md', 'SOUL.md', 'IDENTITY.md', 'MEMORY.md', 'TOOLS.md', 'HEARTBEAT.md'];

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

const createCmd = new Command('create')
  .description('Scaffold a new agent workspace (validates naming, writes 6 files, TORI-QMD, registers, checkpoints)')
  .argument('<Company_Dept_Role>', 'Agent name in [Company]_[Dept]_[Role] format (e.g. WDC_Content_BlogWriter)')
  .option('--model <model>', 'Primary LLM model (inferred from role if omitted)')
  .option('--persistence <class>', 'Persistence class: persistent | temporary (default: persistent)', 'persistent')
  .option('--domain <text>', 'One-sentence description of the agent\'s domain')
  .option('--reports-to <agent>', 'Agent or role this agent reports to (default: Company_Dept_PM)')
  .option('--company-full <name>', 'Full company name for file headers (e.g. "DevGru Technology Products")')
  .option('--dry-run', 'Show plan without creating any files')
  .action((agentName, options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    // Validate naming convention first
    const validation = validateAgentName(agentName);
    if (!validation.valid) {
      if (jsonMode) {
        outputJson({ status: 'validation_error', error: validation.error });
      } else {
        console.log(`\n  ✗ Invalid agent name: ${validation.error}`);
        console.log('  Example: onxza agent create WDC_Content_BlogWriter\n');
      }
      process.exitCode = 1;
      return;
    }

    const agentId = nameToId(agentName);
    const inferredModel = options.model || inferDefaultModel(validation.parts.role);

    if (!jsonMode) {
      console.log('');
      if (options.dryRun) {
        console.log(`  Dry run — agent: ${agentName}`);
      } else {
        console.log(`  Creating agent: ${agentName}`);
      }
      console.log(`  ID: ${agentId}`);
      console.log(`  Model: ${inferredModel}${options.model ? '' : ' (inferred)'}`);
      console.log(`  Persistence: ${options.persistence}`);
      console.log('');
    }

    const result = scaffoldAgent({
      name:        agentName,
      model:       inferredModel,
      persistence: options.persistence,
      domain:      options.domain || '',
      reportsTo:   options.reportsTo || '',
      companyFull: options.companyFull || '',
      dryRun:      !!options.dryRun,
      onProgress:  jsonMode ? () => {} : (msg) => console.log(`  ${msg}`),
    });

    if (!result.success) {
      if (jsonMode) {
        outputJson({ status: 'error', error: result.error, toriResults: result.toriResults });
      } else {
        console.log(`\n  ✗ ${result.error}`);
        if (result.toriResults) {
          for (const r of result.toriResults.filter((r) => !r.pass)) {
            console.log(`    TORI FAIL: ${r.file} — ${r.message}`);
          }
        }
        console.log('');
      }
      process.exitCode = 1;
      return;
    }

    if (result.dryRun) {
      if (jsonMode) {
        outputJson({ status: 'dry_run', ...result });
      } else {
        console.log('  Would create:');
        for (const f of result.files) console.log(`    ${f}`);
        console.log(`  Would register in: ${result.willRegister}`);
        console.log(`  Would create checkpoint: yes`);
        console.log('');
      }
      return;
    }

    // Success
    if (jsonMode) {
      outputJson({
        status:      'created',
        agentId:     result.agentId,
        workspaceDir: result.workspaceDir,
        model:       result.model,
        persistence: result.persistence,
        files:       result.files.map((f) => path.basename(f)),
        tori:        result.toriResults.map((r) => ({ file: r.file, pass: r.pass })),
        checkpoint:  result.checkpoint,
        registered:  result.registered,
      });
    } else {
      console.log('');
      console.log(`  ✓ Agent created: ${agentName}`);
      console.log(`    ID:        ${result.agentId}`);
      console.log(`    Workspace: ${result.workspaceDir}`);
      console.log(`    Model:     ${result.model}`);
      if (result.checkpoint && result.checkpoint.created) {
        console.log(`    Checkpoint: ${result.checkpoint.id}`);
      }
      console.log('');
      console.log('  TORI-QMD:');
      for (const r of result.toriResults) {
        const icon = r.pass ? '✓' : '✗';
        console.log(`    ${icon} ${r.file}`);
      }
      console.log('');
      console.log('  Next steps:');
      console.log(`    onxza agent validate ${result.agentId}   # Re-validate any time`);
      console.log(`    onxza status --agent ${result.agentId}    # Check live state`);
      console.log('');
    }
  });

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

const listCmd = new Command('list')
  .description('List all registered agents with current status')
  .option('--company <name>', 'Filter by company (e.g. DTP, WDC, MGA)')
  .option('--status <state>', 'Filter by task state: active | idle | unknown')
  .option('--model <model>', 'Filter by model name (partial match)')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    let agents = loadAgents();

    // Filters
    if (options.company) {
      agents = agents.filter((a) => a.company.toLowerCase() === options.company.toLowerCase());
    }
    if (options.status) {
      agents = agents.filter((a) => a.taskState.toLowerCase() === options.status.toLowerCase());
    }
    if (options.model) {
      agents = agents.filter((a) => a.model.toLowerCase().includes(options.model.toLowerCase()));
    }

    if (jsonMode) {
      outputJson({
        status: 'ok',
        count:  agents.length,
        agents: agents.map((a) => ({
          id:        a.id,
          company:   a.company,
          model:     a.model,
          taskState: a.taskState,
          taskId:    a.taskId,
          workspace: a.workspace,
        })),
      });
      return;
    }

    if (agents.length === 0) {
      console.log('\n  No agents found.\n');
      return;
    }

    const summary = summariseAgents(agents);
    console.log('');
    console.log(`  Agents (${agents.length})  —  ${summary.active} active, ${summary.idle} idle`);
    console.log('  ──────────────────────────────────────────────────────────────────────');

    const idW    = 36;
    const coW    = 7;
    const modelW = 20;
    const stateW = 9;

    console.log(`  ${''.padEnd(2)}${'ID'.padEnd(idW)}${'CO'.padEnd(coW)}${'MODEL'.padEnd(modelW)}${'STATE'.padEnd(stateW)}TASK`);
    console.log('  ' + '─'.repeat(idW + coW + modelW + stateW + 20));

    for (const a of agents) {
      const stateIcon  = a.taskState === 'ACTIVE' ? '●' : a.taskState === 'UNKNOWN' ? '?' : '○';
      const id         = (a.id || '').slice(0, idW - 1).padEnd(idW);
      const co         = (a.company || '—').slice(0, coW - 1).padEnd(coW);
      const model      = (a.model || '—').slice(0, modelW - 1).padEnd(modelW);
      const state      = (a.taskState || '—').slice(0, stateW - 1).padEnd(stateW);
      const task       = a.taskId ? a.taskId.slice(0, 30) : '—';
      console.log(`  ${stateIcon} ${id}${co}${model}${state}${task}`);
    }
    console.log('');
  });

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------

const validateCmd = new Command('validate')
  .description('Run TORI-QMD validation on all 6 files in an agent workspace')
  .argument('<agent-id>', 'Agent ID (e.g. wdc-content-blogwriter) or workspace path')
  .action((agentId, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const fs       = require('fs');
    const os       = require('os');
    const path     = require('path');

    const OPENCLAW_DIR = process.env.ONXZA_OPENCLAW_DIR || path.join(os.homedir(), '.openclaw');

    // Resolve workspace path — accept either an agent id or a direct path
    let workspaceDir;
    if (agentId.startsWith('/') || agentId.startsWith('~') || agentId.startsWith('.')) {
      workspaceDir = agentId.replace(/^~/, os.homedir());
    } else {
      // Try openclaw.json first for registered workspace path
      try {
        const data = JSON.parse(fs.readFileSync(path.join(OPENCLAW_DIR, 'openclaw.json'), 'utf8'));
        const entry = (data.agents && Array.isArray(data.agents.list))
          ? data.agents.list.find((a) => a.id === agentId)
          : null;
        workspaceDir = entry
          ? (entry.workspace.startsWith('~') ? entry.workspace.replace('~', os.homedir()) : entry.workspace)
          : path.join(OPENCLAW_DIR, `workspace-${agentId}`);
      } catch {
        workspaceDir = path.join(OPENCLAW_DIR, `workspace-${agentId}`);
      }
    }

    if (!fs.existsSync(workspaceDir)) {
      const err = { status: 'not_found', agentId, workspaceDir, error: `Workspace not found: ${workspaceDir}` };
      if (jsonMode) { outputJson(err); } else { console.log(`\n  ✗ ${err.error}\n`); }
      process.exitCode = 1;
      return;
    }

    const results = [];
    let allPass = true;

    for (const filename of AGENT_FILES) {
      const filePath = path.join(workspaceDir, filename);
      if (!fs.existsSync(filePath)) {
        results.push({ file: filename, pass: false, message: `MISSING: ${filePath}` });
        allPass = false;
      } else {
        const r = toriValidate(filePath);
        results.push({ file: filename, pass: r.pass, message: r.message });
        if (!r.pass) allPass = false;
      }
    }

    if (jsonMode) {
      outputJson({
        status:      allPass ? 'pass' : 'fail',
        agentId,
        workspaceDir,
        allPass,
        results,
      });
      return;
    }

    console.log('');
    console.log(`  TORI-QMD: ${agentId}`);
    console.log(`  ${workspaceDir}`);
    console.log('  ──────────────────────────────────────────────');
    for (const r of results) {
      const icon = r.pass ? '✓' : '✗';
      console.log(`  ${icon} ${r.file.padEnd(14)}  ${r.pass ? 'PASS' : r.message}`);
    }
    console.log('');
    if (allPass) {
      console.log('  ✓ All 6 files PASS TORI-QMD');
    } else {
      console.log(`  ✗ ${results.filter((r) => !r.pass).length} file(s) FAILED`);
      process.exitCode = 1;
    }
    console.log('');
  });

// ---------------------------------------------------------------------------
// retire / convert / training / checklist  (TICKET-20260318-DTP-029)
// ---------------------------------------------------------------------------

const LIFECYCLE_SCRIPT = path.join(
  os.homedir(), '.openclaw', 'workspace', 'scripts', 'agent-lifecycle.py'
);

function runLifecycle(args) {
  const { execFileSync } = require('child_process');
  try {
    const out = execFileSync('python3', [LIFECYCLE_SCRIPT, ...args], {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    return { output: out, exitCode: 0 };
  } catch (err) {
    return { output: err.stdout || '', stderr: err.stderr || '', exitCode: err.status || 1 };
  }
}

// ── retire ──

const retireCmd = new Command('retire')
  .description('Retire an agent — archive learnings, remove from registry, preserve workspace for audit')
  .argument('<agent-id>', 'Agent ID to retire (e.g. wdc-affiliate-gyg)')
  .option('--force', 'Override blocking checklist items (not recommended mid-task)')
  .addHelpText('after', `
Retirement pipeline:
  1. Pre-flight checklist (task state IDLE, no open tickets)
  2. Checkpoint before any change
  3. Archive shared learnings to shared-learnings/[company]/patterns/archived/
  4. Write RETIRED.md to workspace
  5. Remove from openclaw.json
  6. Audit trail entry
  7. Write notification for Marcus/Aaron

The workspace is PRESERVED — not deleted — for audit purposes.
`)
  .action((agentId, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--retire', agentId];
    if (options.force) args.push('--force');
    if (jsonMode) args.push('--json');
    const { output, stderr, exitCode } = runLifecycle(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ── convert ──

const convertCmd = new Command('convert')
  .description('Convert a temporary agent to a persistent daemon')
  .argument('<agent-id>', 'Agent ID to convert')
  .option('--to <type>', 'Target persistence class (currently only "persistent" supported)', 'persistent')
  .addHelpText('after', `
Conversion pipeline (ARCHITECTURE.md §7.4 Conversion Rule):
  1. Checkpoint
  2. Verify 6-file workspace (reports missing files)
  3. Update IDENTITY.md persistence class
  4. Re-register in openclaw.json as persistent
  5. Audit trail + notify Aaron

Use this when a temporary project becomes ongoing.
`)
  .action((agentId, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    if (options.to !== 'persistent') {
      const msg = 'Only --to persistent is supported in v0.1';
      if (jsonMode) { outputJson({ error: msg }); } else { console.error(`Error: ${msg}`); }
      process.exit(1);
    }
    const args = ['--convert', agentId];
    if (jsonMode) args.push('--json');
    const { output, stderr, exitCode } = runLifecycle(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ── training ──

const trainingCmd = new Command('training')
  .description('Show training mode status — first 10 tasks tracked, quality metrics per agent')
  .argument('[agent-id]', 'Specific agent ID (omit for all agents)')
  .addHelpText('after', `
Training mode (ARCHITECTURE.md §7.5):
  Every agent starts in training mode for their first 10 tasks.
  Quality reviews are tracked in logs/quality/autonomy-scores.jsonl.

  Status:
    NEVER_RUN    — 0 sessions recorded
    IN_TRAINING  — sessions exist, < 10 reviews completed
    GRADUATED    — 10+ reviews completed
`)
  .action((agentId, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--training-status'];
    if (agentId) args.push(agentId);
    if (jsonMode) args.push('--json');
    const { output, stderr, exitCode } = runLifecycle(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ── checklist ──

const checklistCmd = new Command('checklist')
  .description('Print pre-retirement checklist for an agent (dry-run, no changes made)')
  .argument('<agent-id>', 'Agent ID to check')
  .action((agentId, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--checklist', agentId];
    if (jsonMode) args.push('--json');
    const { output, stderr, exitCode } = runLifecycle(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ---------------------------------------------------------------------------
// Root command
// ---------------------------------------------------------------------------

const agentCmd = new Command('agent')
  .description('Manage ONXZA agents')
  .passThroughOptions();

agentCmd.addCommand(createCmd);
agentCmd.addCommand(listCmd);
agentCmd.addCommand(validateCmd);
agentCmd.addCommand(retireCmd);
agentCmd.addCommand(convertCmd);
agentCmd.addCommand(trainingCmd);
agentCmd.addCommand(checklistCmd);

module.exports = agentCmd;

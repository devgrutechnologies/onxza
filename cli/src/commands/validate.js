'use strict';

/**
 * onxza validate — TORI-QMD validation command + secret scanning.
 *
 * onxza validate <path>        Validate a single .md file
 * onxza validate --all         Validate all .md files in workspace + run secret scan
 * onxza validate --agent <dir> Validate all 6 agent workspace files
 *
 * Delegates to validate-tori-qmd.py. Pure Python stdlib, no LLM.
 * Secret scanning integrated per TICKET-20260318-DTP-037.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful
 * Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command } = require('commander');
const { spawnSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { outputJson, isJsonMode } = require('../util');
const { scanDirectory, formatResults } = require('../guardrails/secret-scanner');

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_WORKSPACE = path.join(os.homedir(), '.openclaw', 'workspace');
const VALIDATOR_SCRIPT  = path.join(DEFAULT_WORKSPACE, 'scripts', 'validate-tori-qmd.py');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Locate python3 binary. Exits with error if not found.
 */
function findPython() {
  for (const candidate of ['python3', 'python']) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf-8' });
    if (result.status === 0) return candidate;
  }
  return null;
}

/**
 * Run validate-tori-qmd.py with the given args and return { stdout, stderr, status }.
 */
function runValidator(extraArgs, jsonMode) {
  const python = findPython();
  if (!python) {
    return {
      error: 'python_not_found',
      message: 'python3 not found. Install Python 3 to use TORI-QMD validation.',
    };
  }

  if (!fs.existsSync(VALIDATOR_SCRIPT)) {
    return {
      error: 'validator_not_found',
      message: `Validator not found: ${VALIDATOR_SCRIPT}`,
    };
  }

  const args = [VALIDATOR_SCRIPT, ...extraArgs];
  if (jsonMode) args.push('--json');

  const result = spawnSync(python, args, { encoding: 'utf-8' });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
    error:  result.error ? result.error.message : null,
  };
}

// ── Command ───────────────────────────────────────────────────────────────────

const validateCmd = new Command('validate')
  .description('Run TORI-QMD validation on .md files before commit or delivery')
  .argument('[path]', 'Path to a single .md file or directory')
  .option('--all [workspace]',  'Validate all .md files in workspace (default: ~/.openclaw/workspace)')
  .option('--agent <dir>',      'Validate all 6 agent workspace files in a workspace directory')
  .option('-v, --verbose',      'Show PASS results as well as failures')
  .addHelpText('after', `
Examples:
  onxza validate AGENTS.md
  onxza validate --all
  onxza validate --all ~/.openclaw/workspace
  onxza validate --agent ~/.openclaw/workspace-dtp-onxza-verification
  onxza validate --json AGENTS.md
  `)
  .action((filePath, options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    let validatorArgs = [];
    let runSecretScan = false;
    let scanWorkspace = DEFAULT_WORKSPACE;

    if (options.agent) {
      // Validate all 6 files in an agent workspace directory
      validatorArgs = ['--agent', path.resolve(options.agent)];

    } else if (options.all !== undefined) {
      // Batch validate entire workspace + secret scan
      const workspace = typeof options.all === 'string'
        ? path.resolve(options.all)
        : DEFAULT_WORKSPACE;
      validatorArgs = ['--all', workspace];
      if (options.verbose) validatorArgs.push('--verbose');
      runSecretScan = true;
      scanWorkspace = workspace;

    } else if (filePath) {
      // Single file
      validatorArgs = [path.resolve(filePath)];
      if (options.verbose) validatorArgs.push('--verbose');

    } else {
      cmd.help();
      return;
    }

    // ─── Phase 1: TORI-QMD Validation ───────────────────────────────────

    if (runSecretScan && !jsonMode) {
      console.log('\n═══════════════════════════════════════');
      console.log('  ONXZA Full Validation Suite');
      console.log('═══════════════════════════════════════\n');
      console.log('  [1/2] TORI-QMD Format Validation...\n');
    }

    const run = runValidator(validatorArgs, jsonMode);
    let overallFailed = false;

    // Handle exec errors (python not found, validator missing)
    if (run.error) {
      if (jsonMode) {
        outputJson({ error: run.error, message: run.message });
      } else {
        console.error(`  ✗ ${run.message}`);
      }
      process.exitCode = 1;
      return;
    }

    // Forward TORI-QMD output
    if (!jsonMode) {
      if (run.stdout) process.stdout.write(run.stdout);
      if (run.stderr) process.stderr.write(run.stderr);
    }

    if (run.status) overallFailed = true;

    // ─── Phase 2: Secret Scanning (only with --all) ─────────────────────

    let secretResult = null;

    if (runSecretScan) {
      if (!jsonMode) {
        console.log('\n  [2/2] Secret Scanning...\n');
      }

      secretResult = scanDirectory(scanWorkspace, {
        exclude: ['node_modules', 'checkpoints', '.git'],
        maxFiles: 10000,
      });

      if (secretResult.totalFindings > 0) {
        overallFailed = true;
        if (!jsonMode) {
          process.stdout.write(formatResults(secretResult, { basePath: scanWorkspace }));
        }
      } else if (!jsonMode) {
        console.log('    ✓ Secret scan: Clean — no credentials detected\n');
      }

      // Summary
      if (!jsonMode) {
        console.log('═══════════════════════════════════════');
        if (!overallFailed) {
          console.log('  ✓ ALL VALIDATORS PASSED');
        } else {
          console.log('  ✗ VALIDATION FAILED — see details above');
        }
        console.log('═══════════════════════════════════════\n');
      }
    }

    // JSON output for --all mode
    if (jsonMode && runSecretScan) {
      let toriParsed;
      try {
        toriParsed = JSON.parse(run.stdout);
      } catch {
        toriParsed = { raw: run.stdout.trim() };
      }
      outputJson({
        tori: toriParsed,
        secrets: secretResult ? {
          totalFiles: secretResult.totalFiles,
          findings: secretResult.totalFindings,
          critical: secretResult.criticalCount,
          high: secretResult.highCount,
          results: secretResult.results,
        } : null,
        passed: !overallFailed,
      });
    } else if (jsonMode) {
      // Single file / agent mode — just forward TORI output
      try {
        const parsed = JSON.parse(run.stdout);
        outputJson(parsed);
      } catch {
        process.stdout.write(run.stdout);
      }
    }

    process.exitCode = overallFailed ? 1 : (run.status || 0);
  });

module.exports = validateCmd;

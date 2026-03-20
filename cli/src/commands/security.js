'use strict';

/**
 * onxza security — Security sub-commands.
 *
 * onxza security scan [path]         — Scan for secrets, credentials, tokens
 * onxza security classify <action>   — Classify an action as REVERSIBLE/IRREVERSIBLE
 * onxza security checkpoints         — List existing checkpoints
 *
 * TICKET-20260318-DTP-037 implements security hardening.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command } = require('commander');
const path = require('path');
const os = require('os');
const { outputJson, isJsonMode } = require('../util');
const { scanFile, scanDirectory, formatResults } = require('../guardrails/secret-scanner');
const { classify } = require('../guardrails/irreversibility');
const { listCheckpoints } = require('../guardrails/checkpoint');

// ─── onxza security (parent) ─────────────────────────────────────────────────

const securityCmd = new Command('security')
  .description('ONXZA security tools — secret scanning, action classification, checkpoints')
  .addHelpText('after', `
Examples:
  onxza security scan .
  onxza security scan /path/to/project --exclude test,fixtures
  onxza security scan myfile.js
  onxza security classify "delete all stale pages"
  onxza security checkpoints
`);

// ─── onxza security scan ──────────────────────────────────────────────────────

const scanCmd = new Command('scan')
  .description('Scan files for secrets, credentials, API keys, and tokens')
  .argument('[path]', 'File or directory to scan', '.')
  .option('--exclude <dirs>', 'Comma-separated directories to skip (added to defaults)', '')
  .option('--max-files <n>', 'Maximum files to scan', '10000')
  .action((scanPath, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const resolvedPath = path.resolve(scanPath);
    const exclude = options.exclude ? options.exclude.split(',').map(s => s.trim()) : [];
    const maxFiles = parseInt(options.maxFiles, 10) || 10000;

    const fs = require('fs');
    let result;

    try {
      const stat = fs.statSync(resolvedPath);
      if (stat.isFile()) {
        const fileResult = scanFile(resolvedPath);
        result = {
          results: fileResult.findings.length > 0 ? [fileResult] : [],
          totalFiles: 1,
          filesWithFindings: fileResult.findings.length > 0 ? 1 : 0,
          totalFindings: fileResult.findings.length,
          criticalCount: fileResult.findings.filter(f => f.severity === 'critical').length,
          highCount: fileResult.findings.filter(f => f.severity === 'high').length,
        };
      } else {
        result = scanDirectory(resolvedPath, { exclude, maxFiles });
      }
    } catch (err) {
      const msg = { error: `Cannot scan: ${err.message}` };
      if (jsonMode) { outputJson(msg); } else { console.error(`Error: ${msg.error}`); }
      process.exit(1);
    }

    if (jsonMode) {
      outputJson({
        status: result.totalFindings > 0 ? 'findings_detected' : 'clean',
        ...result,
      });
    } else {
      process.stdout.write(formatResults(result, { basePath: resolvedPath }));
    }

    // Exit with code 1 if critical secrets found (for CI integration)
    if (result.criticalCount > 0) {
      process.exit(1);
    }
  });

// ─── onxza security classify ─────────────────────────────────────────────────

const classifyCmd = new Command('classify')
  .description('Classify an action as REVERSIBLE or IRREVERSIBLE')
  .argument('<action>', 'Action description to classify')
  .action((action, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const result = classify(action);

    if (jsonMode) {
      outputJson(result);
    } else {
      const icon = result.classification === 'IRREVERSIBLE' ? '🔴' : '🟢';
      console.log(`\n  ${icon} ${result.classification}`);
      if (result.reason) console.log(`     Reason:   ${result.reason}`);
      if (result.category) console.log(`     Category: ${result.category}`);
      console.log('');
    }
  });

// ─── onxza security checkpoints ──────────────────────────────────────────────

const checkpointsCmd = new Command('checkpoints')
  .description('List existing checkpoints')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const checkpoints = listCheckpoints();

    if (jsonMode) {
      outputJson({ checkpoints, count: checkpoints.length });
    } else {
      if (checkpoints.length === 0) {
        console.log('\n  No checkpoints found.\n');
      } else {
        console.log(`\n  Checkpoints (${checkpoints.length}):\n`);
        for (const cp of checkpoints) {
          console.log(`    ${cp.id}`);
          if (cp.created) console.log(`      Created: ${cp.created}`);
        }
        console.log('');
      }
    }
  });

// Wire sub-commands
securityCmd.addCommand(scanCmd);
securityCmd.addCommand(classifyCmd);
securityCmd.addCommand(checkpointsCmd);

module.exports = securityCmd;

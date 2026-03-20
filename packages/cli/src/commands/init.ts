/**
 * onxza init — Initialize a new ONXZA installation.
 *
 * Spec: ARCHITECTURE-v0.1.md §3
 *
 * Flags:
 *   --dir <path>      Root directory (default: ~/.openclaw)
 *   --company <name>  First company name (skips interactive prompt)
 *   --no-git          Skip git init and pre-commit hook
 *   --json            Machine-readable JSON output
 *
 * Exit codes:
 *   0  Success
 *   1  Pre-flight check failed
 *   2  Filesystem error
 *
 * Core dependency: @onxza/core/init (NOT YET BUILT — backend building §13 Phase 1 first)
 * Scaffold: Command structure, flags, help text, and output contract are complete.
 *           Logic delegated to @onxza/core when available.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command } from 'commander';
import os from 'os';
import path from 'path';
import {
  setOutputContext,
  step, success, info, warn, error,
  outputJson, box, blank, spinner,
  exitOk, exitValidationError, exitFilesystemError,
} from '../util/output.js';
import { promptText, promptConfirm } from '../util/prompts.js';

export function makeInitCommand(): Command {
  const cmd = new Command('init');

  cmd
    .description('Initialize a new ONXZA installation')
    .option('--dir <path>',     'Root directory for ONXZA installation', path.join(os.homedir(), '.openclaw'))
    .option('--company <name>', 'First company name (skips interactive prompt)')
    .option('--no-git',         'Skip git init and pre-commit hook')
    .option('--json',           'Machine-readable JSON output')
    .action(async (opts) => {
      setOutputContext({ json: !!opts.json });

      const dir        = path.resolve(opts.dir as string);
      const noGit      = !opts.git;
      const companyArg = opts.company as string | undefined;

      // ── Pre-flight: Node.js version ──────────────────────────────────────
      const nodeMajor = parseInt(process.versions.node.split('.')[0]!, 10);
      if (nodeMajor < 18) {
        exitValidationError(
          `Node.js ${process.versions.node} detected. ONXZA requires Node.js >= 18.0.0.\n` +
          `  Upgrade: https://nodejs.org`
        );
      }

      // ── Core not yet built — wire when @onxza/core/init is ready ─────────
      // TODO: replace stub block with:
      //   import { initOnxza } from '@onxza/core';
      //   const result = await initOnxza({ dir, noGit, company: companyArg });

      _notYetImplemented('init', {
        dir,
        git: !noGit,
        company: companyArg,
        plannedSteps: [
          '1. Pre-flight checks (Node version, existing install)',
          '2. Create workspace directory structure',
          '3. Seed openclaw.json (schema v1.0.0)',
          '4. Copy global agent templates from @onxza/core',
          '5. Install TORI-QMD validator script',
          '6. Install checkpoint and audit-logger scripts',
          '7. Initialize audit trail',
          '8. git init + pre-commit hook (unless --no-git)',
          '9. Create initial checkpoint',
          '10. Prompt for first company name',
          '11. Print success summary',
        ],
      });
    });

  return cmd;
}

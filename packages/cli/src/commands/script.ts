/**
 * onxza script — Automation script management command group.
 *
 * Sub-commands:
 *   create <name>   Scaffold a new script with tier metadata
 *   list            Show all scripts with tier, run history, and promotion tips
 *   run <name>      Execute a script in a sandboxed environment
 *
 * Spec: ARCHITECTURE.md §10.2, §12.3 · TICKET-20260318-DTP-025
 *
 * Tier classification:
 *   1 — LLM reasoning required (not yet scriptable)
 *   2 — Script + LLM hybrid (script mechanics, LLM judgment)
 *   3 — Pure script/cron (goal state — zero LLM tokens)
 *
 * Push-to-Tier-3 principle: scripts that run ≥5 times with ≥90% success
 * rate at tier 1 or 2 are flagged as "→ T3 candidate" in `onxza script list`.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command }   from 'commander';
import os            from 'os';
import path          from 'path';
import {
  SCRIPT_TIERS, SCRIPT_LANGUAGES, TIER_DESCRIPTIONS,
  type ScriptTier, type ScriptLanguage,
} from '../script/schema.js';
import {
  listScripts, getScript, registerScript, recordRun,
  scriptExists, isPromotionCandidate, successRate, getRegistryPath, getScriptsDir,
} from '../script/registry.js';
import { scaffoldScript } from '../script/scaffold.js';
import { runScript, checkSafety } from '../script/runner.js';

// ---------------------------------------------------------------------------
// Slug validation
// ---------------------------------------------------------------------------

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

function validateSlug(name: string): string | null {
  if (!SLUG_RE.test(name)) {
    return (
      `Invalid script name "${name}".\n` +
      `  Must be lowercase alphanumeric + hyphens, start with a letter/digit.\n` +
      `  Examples: daily-report, deploy-blogs, check-affiliate-links`
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

function makeScriptCreateCommand(): Command {
  return new Command('create')
    .description('Scaffold a new automation script with tier metadata')
    .argument('<name>', 'Script name (slug: lowercase alphanumeric + hyphens, e.g. daily-report)')
    .option('--tier <n>',            'Automation tier: 1 | 2 | 3 (default: prompted, fallback: 1)', '1')
    .option('--language <lang>',     `Script language: ${SCRIPT_LANGUAGES.join(' | ')} (default: bash)`, 'bash')
    .option('--description <text>',  'Short description of what this script does', '')
    .option('--dry-run',             'Show what would be created without writing any files')
    .option('--json',                'Machine-readable JSON output')
    .addHelpText('after', `
Examples:
  onxza script create daily-report --tier 3 --language bash --description "Generate daily summary"
  onxza script create deploy-blogs --tier 2 --language python
  onxza script create review-content --tier 1 --description "Manual content review task"
`)
    .action((name: string, opts) => {
      const jsonMode = process.argv.includes('--json') || !!opts.json;

      // Slug validation
      const slugErr = validateSlug(name);
      if (slugErr) {
        if (jsonMode) process.stdout.write(JSON.stringify({ status: 'error', error: slugErr }) + '\n');
        else process.stderr.write(`\n  ✗ ${slugErr}\n\n`);
        process.exit(1);
      }

      // Tier validation
      const tier = parseInt(opts.tier as string, 10) as ScriptTier;
      if (![1, 2, 3].includes(tier)) {
        const err = `Invalid tier "${opts.tier}". Use 1, 2, or 3.`;
        if (jsonMode) process.stdout.write(JSON.stringify({ status: 'error', error: err }) + '\n');
        else process.stderr.write(`\n  ✗ ${err}\n\n`);
        process.exit(1);
      }

      // Language validation
      const language = opts.language as ScriptLanguage;
      if (!(SCRIPT_LANGUAGES as readonly string[]).includes(language)) {
        const err = `Invalid language "${language}". Use: ${SCRIPT_LANGUAGES.join(', ')}`;
        if (jsonMode) process.stdout.write(JSON.stringify({ status: 'error', error: err }) + '\n');
        else process.stderr.write(`\n  ✗ ${err}\n\n`);
        process.exit(1);
      }

      // Duplicate check
      if (scriptExists(name)) {
        const err = `Script "${name}" is already registered. Use a different name.`;
        if (jsonMode) process.stdout.write(JSON.stringify({ status: 'already_exists', error: err }) + '\n');
        else process.stderr.write(`\n  ⚠  ${err}\n\n`);
        process.exit(1);
      }

      // Dry-run
      const scriptsDir = getScriptsDir();
      if (opts.dryRun) {
        const result = {
          status: 'dry_run', name, tier, language,
          description: opts.description || '',
          wouldCreate: path.join(scriptsDir, `${name}.${language === 'bash' ? 'sh' : language === 'python' ? 'py' : 'js'}`),
          wouldRegister: getRegistryPath(),
        };
        if (jsonMode) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        else {
          process.stdout.write(`\n  Dry run — script "${name}"\n`);
          process.stdout.write(`  Would create: ${result.wouldCreate}\n`);
          process.stdout.write(`  Would register in: ${result.wouldRegister}\n`);
          process.stdout.write(`  Tier: ${tier} — ${TIER_DESCRIPTIONS[tier]}\n\n`);
        }
        return;
      }

      // Scaffold
      try {
        const scaffold = scaffoldScript(name, tier, language, opts.description as string || '');

        const entry = {
          name, path: scaffold.path, tier, language,
          description: opts.description as string || '',
          created:     new Date().toISOString().split('T')[0]!,
          lastRun:     null, runCount: 0, successCount: 0,
          failCount:   0, avgDurationMs: 0,
        };
        registerScript(entry);

        if (jsonMode) {
          process.stdout.write(JSON.stringify({ status: 'created', ...entry }) + '\n');
        } else {
          process.stdout.write(`\n  ✓ Script created: ${name}\n`);
          process.stdout.write(`    Path:    ${scaffold.path}\n`);
          process.stdout.write(`    Tier:    ${tier} — ${TIER_DESCRIPTIONS[tier]}\n`);
          process.stdout.write(`    Language: ${language}\n`);
          if (entry.description) process.stdout.write(`    Desc:    ${entry.description}\n`);
          process.stdout.write(`\n  Next steps:\n`);
          process.stdout.write(`    Edit the script: ${scaffold.path}\n`);
          process.stdout.write(`    Test it:  onxza script run ${name} --dry-run\n`);
          process.stdout.write(`    Run it:   onxza script run ${name}\n\n`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (jsonMode) process.stdout.write(JSON.stringify({ status: 'error', error: msg }) + '\n');
        else process.stderr.write(`\n  ✗ ${msg}\n\n`);
        process.exit(2);
      }
    });
}

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

function makeScriptListCommand(): Command {
  return new Command('list')
    .description('List all registered scripts with tier, run history, and Tier-3 promotion tips')
    .option('--tier <n>',  'Filter by tier: 1 | 2 | 3')
    .option('--json',      'Output scripts array as JSON')
    .addHelpText('after', `
Examples:
  onxza script list
  onxza script list --tier 3
  onxza script list --json
`)
    .action((opts) => {
      const jsonMode = process.argv.includes('--json') || !!opts.json;
      const filterTier = opts.tier ? parseInt(opts.tier as string, 10) as ScriptTier : undefined;
      const scripts    = listScripts(filterTier);

      if (jsonMode) {
        process.stdout.write(JSON.stringify({
          status: 'ok',
          count:  scripts.length,
          scripts: scripts.map(s => ({
            ...s,
            successRate:        successRate(s),
            promotionCandidate: isPromotionCandidate(s),
          })),
        }, null, 2) + '\n');
        return;
      }

      if (scripts.length === 0) {
        const filter = filterTier ? ` (tier ${filterTier})` : '';
        process.stdout.write(`\n  No scripts registered${filter}.\n`);
        process.stdout.write(`  Run: onxza script create <name> --tier 3 --language bash\n\n`);
        return;
      }

      // Table layout
      const nameW = Math.max(16, ...scripts.map(s => s.name.length)) + 2;
      const descW = 30;

      process.stdout.write('\n');
      process.stdout.write(`  ${_pad('NAME', nameW)}TIER  ${'LANG'.padEnd(8)}${'RUNS'.padEnd(6)}${'SUCCESS%'.padEnd(10)}${'LAST RUN'.padEnd(14)}TIP\n`);
      process.stdout.write(`  ${'─'.repeat(nameW + 4 + 8 + 6 + 10 + 14 + 12)}\n`);

      for (const s of scripts) {
        const rate       = s.runCount > 0 ? `${Math.round(successRate(s) * 100)}%` : '—';
        const lastRun    = s.lastRun ? s.lastRun.slice(0, 10) : 'never';
        const promo      = isPromotionCandidate(s) ? '→ T3 candidate' : '';
        const tierLabel  = `T${s.tier}`;

        process.stdout.write(
          `  ${_pad(s.name, nameW)}${tierLabel.padEnd(6)}${s.language.padEnd(8)}` +
          `${String(s.runCount).padEnd(6)}${rate.padEnd(10)}${lastRun.padEnd(14)}${promo}\n`
        );
      }

      process.stdout.write(`\n  Total: ${scripts.length} script${scripts.length !== 1 ? 's' : ''}\n`);
      const candidates = scripts.filter(isPromotionCandidate);
      if (candidates.length > 0) {
        process.stdout.write(`  ${candidates.length} script${candidates.length !== 1 ? 's' : ''} ready for Tier-3 promotion.\n`);
        process.stdout.write(`  See: ARCHITECTURE.md §10.2 — push-to-Tier-3 principle\n`);
      }
      process.stdout.write('\n');
    });
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

function makeScriptRunCommand(): Command {
  return new Command('run')
    .description('Execute a script in a sandboxed environment and log the result')
    .argument('<name>', 'Script name (from onxza script list)')
    .option('--dry-run',            'Print command that would run without executing')
    .option('--timeout <seconds>',  'Execution timeout in seconds (default: 30)', '30')
    .option('--args <args>',        'Extra arguments to pass to the script (quote if multiple)')
    .option('--json',               'Output run result as JSON')
    .addHelpText('after', `
Examples:
  onxza script run daily-report
  onxza script run daily-report --dry-run
  onxza script run deploy-blogs --timeout 60
  onxza script run check-health --json
`)
    .action(async (name: string, opts) => {
      const jsonMode = process.argv.includes('--json') || !!opts.json;

      const entry = getScript(name);
      if (!entry) {
        const err = `Script "${name}" not found. Run \`onxza script list\` to see registered scripts.`;
        if (jsonMode) process.stdout.write(JSON.stringify({ status: 'not_found', error: err }) + '\n');
        else process.stderr.write(`\n  ✗ ${err}\n\n`);
        process.exit(1);
      }

      const timeout  = Math.max(1, parseInt(opts.timeout as string, 10) || 30);
      const dryRun   = !!opts.dryRun;
      const extraArgs = opts.args
        ? (opts.args as string).split(' ').filter(Boolean)
        : [];

      if (!dryRun && !jsonMode) {
        process.stdout.write(`\n  Running: ${entry.name} (tier ${entry.tier}, ${entry.language})\n`);
        if (timeout !== 30) process.stdout.write(`  Timeout: ${timeout}s\n`);
      }

      const result = await runScript(entry, { dryRun, timeoutSeconds: timeout, extraArgs });

      // Record run history (skip for dry-runs)
      if (!result.dryRun) {
        recordRun(name, result);
      }

      if (jsonMode) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      } else {
        if (result.dryRun) {
          const cmd = (result as typeof result & { cmd?: string }).cmd;
          process.stdout.write(`\n  Dry run — would execute:\n  ${cmd ?? `${entry.language} ${entry.path}`}\n\n`);
          return;
        }
        if (result.blocked) {
          process.stderr.write(`\n  ✗ Blocked: ${result.blockReason}\n`);
          process.stderr.write(`  Safety rule triggered — execution prevented.\n\n`);
          process.exit(1);
        }
        if (result.timedOut) {
          process.stderr.write(`\n  ✗ Timeout after ${timeout}s\n\n`);
        } else if (result.success) {
          process.stdout.write(`  ✓ Completed in ${result.durationMs}ms (exit 0)\n`);
        } else {
          process.stderr.write(`  ✗ Failed (exit ${result.exitCode}) in ${result.durationMs}ms\n`);
        }
        if (result.stdout.trim()) {
          process.stdout.write(`\n  stdout:\n${result.stdout.split('\n').map(l => `    ${l}`).join('\n')}\n`);
        }
        if (result.stderr.trim()) {
          process.stderr.write(`\n  stderr:\n${result.stderr.split('\n').map(l => `    ${l}`).join('\n')}\n`);
        }
        process.stdout.write('\n');
      }

      if (!result.success && !result.dryRun) {
        process.exit(result.exitCode || 1);
      }
    });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _pad(str: string, width: number): string {
  return str.length >= width ? str.slice(0, width) : str + ' '.repeat(width - str.length);
}

// ---------------------------------------------------------------------------
// Root: onxza script
// ---------------------------------------------------------------------------

export function makeScriptCommand(): Command {
  const cmd = new Command('script')
    .description('Manage ONXZA automation scripts (create, list, run)');

  cmd.addCommand(makeScriptCreateCommand());
  cmd.addCommand(makeScriptListCommand());
  cmd.addCommand(makeScriptRunCommand());

  return cmd;
}

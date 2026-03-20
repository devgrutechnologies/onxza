/**
 * onxza config — Configuration management sub-commands.
 *
 * Sub-commands:
 *   validate [--file <path>]       Validate openclaw.json against schema
 *   migrate [--dry-run] [--to <v>] Migrate schema to a target version
 *   version                        Show current schema version
 *
 * Spec: ARCHITECTURE-v0.1.md §7.1, §10 (v0.1 includes)
 *
 * Core dependency: @onxza/core/config, @onxza/core/schema — NOT YET BUILT.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command } from 'commander';
import os from 'os';
import path from 'path';
import { setOutputContext } from '../util/output.js';

const DEFAULT_CONFIG = path.join(os.homedir(), '.openclaw', 'openclaw.json');

// ---------------------------------------------------------------------------
// config validate
// ---------------------------------------------------------------------------

function makeConfigValidateCommand(): Command {
  return new Command('validate')
    .description('Validate openclaw.json against the ONXZA JSON Schema')
    .option('--file <path>',  'Path to openclaw.json', DEFAULT_CONFIG)
    .option('--json',         'Machine-readable JSON output')
    .action(async (opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { validateConfig } from '@onxza/core';
      // const result = await validateConfig({ filePath: opts.file });

      _notYetImplemented('config validate', {
        file: opts.file,
        note: 'Uses Ajv + openclaw.schema.json (JSON Schema Draft 2020-12)',
        outputShape: '{ valid: boolean, errors: AjvError[], schemaVersion: string }',
        exitCodes: { 0: 'valid', 1: 'invalid (schema errors)', 2: 'file not found' },
      });
    });
}

// ---------------------------------------------------------------------------
// config migrate
// ---------------------------------------------------------------------------

function makeConfigMigrateCommand(): Command {
  return new Command('migrate')
    .description('Migrate openclaw.json to a target schema version')
    .option('--to <version>',  'Target schema version (default: latest = 1.0.0)', '1.0.0')
    .option('--dry-run',       'Show migration plan without writing changes')
    .option('--file <path>',   'Path to openclaw.json', DEFAULT_CONFIG)
    .option('--json',          'Machine-readable JSON output')
    .action(async (opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { migrateConfig } from '@onxza/core';
      // v0.1 supports: 0.0.0 → 1.0.0 migration (adds $schemaVersion, companies.list, dispatcher block)
      // const result = await migrateConfig({ filePath: opts.file, targetVersion: opts.to, dryRun: opts.dryRun });

      _notYetImplemented('config migrate', {
        file: opts.file, to: opts.to, dryRun: !!opts.dryRun,
        supportedMigrations: ['0.0.0 → 1.0.0'],
        note: 'Creates checkpoint before any write. Dry-run shows diff only.',
        outputShape: '{ from: string, to: string, steps: MigrationStep[], dryRun: boolean }',
      });
    });
}

// ---------------------------------------------------------------------------
// config version
// ---------------------------------------------------------------------------

function makeConfigVersionCommand(): Command {
  return new Command('version')
    .description('Show the current openclaw.json schema version')
    .option('--file <path>',  'Path to openclaw.json', DEFAULT_CONFIG)
    .option('--json',         'Machine-readable JSON output')
    .action(async (opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { readConfigVersion } from '@onxza/core';
      // const { schemaVersion } = await readConfigVersion({ filePath: opts.file });

      _notYetImplemented('config version', {
        file: opts.file,
        outputShape: '{ schemaVersion: string, latestSupported: string, needsMigration: boolean }',
      });
    });
}

// ---------------------------------------------------------------------------
// Root: onxza config
// ---------------------------------------------------------------------------

export function makeConfigCommand(): Command {
  const cmd = new Command('config')
    .description('Manage openclaw.json configuration');

  cmd.addCommand(makeConfigValidateCommand());
  cmd.addCommand(makeConfigMigrateCommand());
  cmd.addCommand(makeConfigVersionCommand());

  return cmd;
}

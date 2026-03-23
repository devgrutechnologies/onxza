'use strict';

/**
 * onxza config — openclaw.json configuration management.
 *
 * Sub-commands:
 *   validate [--file <path>]   Validate openclaw.json schema
 *   migrate [--dry-run]        Migrate openclaw.json from v0 → v1 schema
 *   version                    Show current schema version
 *
 * ARCHITECTURE.md §7 (config command) · TICKET-20260322-DTP-PROACTIVE-CONFIG
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful
 * Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command } = require('commander');
const { outputJson, isJsonMode } = require('../util');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ---------------------------------------------------------------------------
// Config file resolution
// ---------------------------------------------------------------------------

const OPENCLAW_JSON = process.env.ONXZA_OPENCLAW_JSON
  || path.join(os.homedir(), '.openclaw', 'openclaw.json');

const CURRENT_SCHEMA_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Load and parse openclaw.json. Returns { data, filePath } or throws.
 */
function loadConfig(filePath) {
  const target = filePath || OPENCLAW_JSON;
  if (!fs.existsSync(target)) {
    throw new Error(`openclaw.json not found at: ${target}\nRun 'onxza init' to initialize an ONXZA workspace.`);
  }
  try {
    const raw  = fs.readFileSync(target, 'utf8');
    const data = JSON.parse(raw);
    return { data, filePath: target };
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${target}:\n  ${err.message}`);
    }
    throw err;
  }
}

/**
 * Detect schema version from config data.
 * v1: has schema.version field
 * v0: legacy OpenClaw format (no schema.version)
 */
function detectSchemaVersion(data) {
  if (data.schema && data.schema.version) return data.schema.version;
  if (data.agents && data.agents.list) return '1.0.0';  // onxza-native
  return '0.0.0'; // legacy OpenClaw
}

/**
 * Run validation checks on config data.
 * Returns { pass: boolean, checks: [{name, pass, message}] }
 */
function validateConfig(data, filePath) {
  const checks = [];

  // Check 1: Valid JSON (already done by parse — just report it)
  checks.push({ name: 'Valid JSON', pass: true, message: 'Parsed successfully' });

  // Check 2: Schema version present
  const version = detectSchemaVersion(data);
  const hasSchemaVersion = version !== '0.0.0';
  checks.push({
    name: 'Schema version',
    pass: hasSchemaVersion,
    message: hasSchemaVersion
      ? `Version: ${version}`
      : 'No schema.version field found (legacy format — run onxza config migrate)',
  });

  // Check 3: agents.list is array (if present)
  if (data.agents !== undefined) {
    const listIsArray = Array.isArray(data.agents.list);
    checks.push({
      name: 'agents.list is array',
      pass: listIsArray,
      message: listIsArray
        ? `${data.agents.list.length} agents registered`
        : 'agents.list must be an array',
    });
  }

  // Check 4: companies block (if present)
  if (data.companies !== undefined) {
    const companiesIsObj = typeof data.companies === 'object' && !Array.isArray(data.companies);
    checks.push({
      name: 'companies block',
      pass: companiesIsObj,
      message: companiesIsObj
        ? `${Object.keys(data.companies).length} companies registered`
        : 'companies must be an object (not array)',
    });
  }

  // Check 5: workspace path exists
  if (data.workspace && data.workspace.root) {
    const wsRoot = data.workspace.root.replace('~', os.homedir());
    const wsExists = fs.existsSync(wsRoot);
    checks.push({
      name: 'workspace.root exists',
      pass: wsExists,
      message: wsExists
        ? `Found: ${data.workspace.root}`
        : `Directory not found: ${data.workspace.root}`,
    });
  }

  const allPass = checks.every(c => c.pass);
  return { pass: allPass, checks, filePath };
}

// ---------------------------------------------------------------------------
// validate sub-command
// ---------------------------------------------------------------------------

const validateCmd = new Command('validate')
  .description('Validate openclaw.json schema and required fields')
  .option('--file <path>', 'Path to openclaw.json (default: ~/.openclaw/openclaw.json)')
  .option('--json', 'Output in JSON format')
  .addHelpText('after', `
Examples:
  $ onxza config validate
  $ onxza config validate --file /path/to/openclaw.json
  $ onxza config validate --json`)
  .action((opts) => {
    let loadResult;
    try {
      loadResult = loadConfig(opts.file);
    } catch (err) {
      if (opts.json || isJsonMode(validateCmd)) {
        outputJson({ pass: false, error: err.message });
      } else {
        console.error(`\n  ✗ ${err.message}\n`);
      }
      process.exit(1);
    }

    const result = validateConfig(loadResult.data, loadResult.filePath);
    const jsonMode = opts.json || isJsonMode(validateCmd);

    if (jsonMode) {
      outputJson(result);
      process.exit(result.pass ? 0 : 1);
    }

    // Human output
    console.log(`\n  Validating: ${loadResult.filePath}\n`);
    const pad = 30;
    for (const check of result.checks) {
      const icon   = check.pass ? '✓' : '✗';
      const status = check.pass ? 'PASS' : 'FAIL';
      const label  = check.name.padEnd(pad);
      console.log(`  ${icon} ${label} ${status}  ${check.message}`);
    }

    if (result.pass) {
      console.log(`\n  Result: PASS (${result.checks.length}/${result.checks.length} checks)\n`);
    } else {
      const failed = result.checks.filter(c => !c.pass).length;
      console.error(`\n  Result: FAIL (${result.checks.length - failed}/${result.checks.length} checks passed)\n`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// migrate sub-command
// ---------------------------------------------------------------------------

const migrateCmd = new Command('migrate')
  .description('Migrate openclaw.json schema to current version')
  .option('--dry-run', 'Show changes without writing to disk')
  .option('--to <version>', 'Target schema version (default: 1.0.0)')
  .option('--file <path>', 'Path to openclaw.json (default: ~/.openclaw/openclaw.json)')
  .addHelpText('after', `
Examples:
  $ onxza config migrate --dry-run
  $ onxza config migrate
  $ onxza config migrate --to 1.0.0`)
  .action((opts) => {
    let loadResult;
    try {
      loadResult = loadConfig(opts.file);
    } catch (err) {
      console.error(`\n  ✗ ${err.message}\n`);
      process.exit(1);
    }

    const { data, filePath } = loadResult;
    const fromVersion = detectSchemaVersion(data);
    const toVersion   = opts.to || CURRENT_SCHEMA_VERSION;

    console.log(`\n  openclaw.json schema migration\n`);
    console.log(`  From:  ${fromVersion}`);
    console.log(`  To:    ${toVersion}`);
    console.log(`  File:  ${filePath}\n`);

    if (fromVersion === toVersion) {
      console.log(`  ✓ Already at version ${toVersion}. No migration needed.\n`);
      return;
    }

    if (fromVersion !== '0.0.0') {
      console.log(`  ✗ Only 0.0.0 → 1.0.0 migration is supported in v0.1.\n`);
      process.exit(1);
    }

    // Migration: v0.0.0 → v1.0.0
    // Add schema.version if missing
    const changes = [];

    const migrated = { ...data };

    if (!migrated.schema) {
      migrated.schema = { version: '1.0.0' };
      changes.push('  + Added schema.version: "1.0.0"');
    }

    // Ensure agents.list exists
    if (!migrated.agents) {
      migrated.agents = { list: [] };
      changes.push('  + Added agents: { list: [] }');
    } else if (!Array.isArray(migrated.agents.list)) {
      migrated.agents.list = [];
      changes.push('  + Initialized agents.list = []');
    }

    // Ensure companies exists
    if (!migrated.companies) {
      migrated.companies = {};
      changes.push('  + Added companies: {}');
    }

    if (changes.length === 0) {
      console.log('  ✓ No structural changes needed.\n');
      return;
    }

    console.log('  Changes to apply:');
    for (const c of changes) console.log(c);
    console.log('');

    if (opts.dryRun) {
      console.log('  [dry-run] No changes written to disk.\n');
      return;
    }

    // Write migrated config
    fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2) + '\n', 'utf8');
    console.log(`  ✓ Migration complete. ${filePath} updated.\n`);
  });

// ---------------------------------------------------------------------------
// version sub-command
// ---------------------------------------------------------------------------

const versionCmd = new Command('version')
  .description('Show current openclaw.json schema version')
  .option('--file <path>', 'Path to openclaw.json (default: ~/.openclaw/openclaw.json)')
  .option('--json', 'Output in JSON format')
  .addHelpText('after', `
Examples:
  $ onxza config version
  $ onxza config version --json`)
  .action((opts) => {
    let loadResult;
    try {
      loadResult = loadConfig(opts.file);
    } catch (err) {
      if (opts.json || isJsonMode(versionCmd)) {
        outputJson({ error: err.message });
      } else {
        console.error(`\n  ✗ ${err.message}\n`);
      }
      process.exit(1);
    }

    const version = detectSchemaVersion(loadResult.data);
    const jsonMode = opts.json || isJsonMode(versionCmd);

    if (jsonMode) {
      outputJson({ version, filePath: loadResult.filePath, current: version === CURRENT_SCHEMA_VERSION });
      return;
    }

    const isCurrent = version === CURRENT_SCHEMA_VERSION;
    console.log(`\n  openclaw.json schema version: ${version}`);
    if (!isCurrent) {
      console.log(`  ⚠  Latest version is ${CURRENT_SCHEMA_VERSION}. Run 'onxza config migrate' to upgrade.`);
    } else {
      console.log(`  ✓ Up to date`);
    }
    console.log(`  File: ${loadResult.filePath}\n`);
  });

// ---------------------------------------------------------------------------
// Root config command
// ---------------------------------------------------------------------------

const configCmd = new Command('config')
  .description('Manage openclaw.json configuration — validate, migrate, inspect')
  .addHelpText('after', `
Examples:
  $ onxza config validate
  $ onxza config version
  $ onxza config migrate --dry-run
  $ onxza config migrate`);

configCmd.addCommand(validateCmd);
configCmd.addCommand(migrateCmd);
configCmd.addCommand(versionCmd);

module.exports = configCmd;

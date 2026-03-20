'use strict';

/**
 * onxza company — Company management command group.
 *
 * Sub-commands:
 *   add <name>      Scaffold shared-learnings structure, register in openclaw.json
 *   list            List all companies with agent count and project count
 *   switch <name>   Set active company context (persisted to ~/.onxza/context.json)
 *
 * ARCHITECTURE.md §3, §9.2, §12.3 · TICKET-20260318-DTP-007
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const { Command }  = require('commander');
const { outputJson, isJsonMode } = require('../util');
const companyStore = require('../company/store');

// ---------------------------------------------------------------------------
// add
// ---------------------------------------------------------------------------

const addCmd = new Command('add')
  .description('Add a new company under ONXZA')
  .argument('<name>', 'Company name or code (e.g. "Acme Corp" or "ACME")')
  .option('--full-name <name>', 'Full company name (if code is used as argument)')
  .option('--description <text>', 'Brief description of the company')
  .option('--dry-run', 'Show what would be created without making changes')
  .action((name, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const code     = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    const fullName = options.fullName || name;

    if (!code) {
      const err = { status: 'validation_error', message: 'Company name must contain at least one alphanumeric character.' };
      if (jsonMode) { outputJson(err); } else { console.log(`\n  ✗ ${err.message}\n`); }
      process.exitCode = 1;
      return;
    }

    if (companyStore.companyExists(code)) {
      const msg = `Company "${code}" already exists. Use \`onxza company list\` to view it.`;
      if (jsonMode) {
        outputJson({ status: 'already_exists', code, message: msg });
      } else {
        console.log(`\n  ⚠  ${msg}\n`);
      }
      return;
    }

    const plannedPaths = [
      `shared-learnings/${code}/README.md`,
      `shared-learnings/${code}/skills/README.md`,
      `shared-learnings/${code}/patterns/README.md`,
      `shared-learnings/${code}/tools/README.md`,
    ];

    if (options.dryRun) {
      const result = {
        status: 'dry_run',
        code,
        fullName,
        description: options.description || `${fullName} company under ONXZA`,
        wouldCreate: plannedPaths,
        wouldRegister: 'openclaw.json → companies[]',
      };
      if (jsonMode) {
        outputJson(result);
      } else {
        console.log(`\n  Dry run — company "${code}" (${fullName})`);
        console.log('  Would create:');
        for (const p of plannedPaths) console.log(`    ${p}`);
        console.log('  Would register in openclaw.json companies[]');
        console.log('');
      }
      return;
    }

    try {
      const result = companyStore.addCompany(name, {
        fullName,
        description: options.description,
      });

      if (jsonMode) {
        outputJson({
          status: 'created',
          code:     result.code,
          fullName: result.fullName,
          paths:    result.paths,
        });
      } else {
        console.log('');
        console.log(`  ✓ Company created: ${result.code} (${result.fullName})`);
        console.log('  Created:');
        for (const p of result.paths) console.log(`    ${p}`);
        console.log('  Registered in openclaw.json');
        console.log('');
        console.log(`  Next steps:`);
        console.log(`    onxza company switch ${result.code}     # Set as active context`);
        console.log(`    onxza agent create ${result.code}_Dept_Role  # Add your first agent`);
        console.log('');
      }
    } catch (err) {
      if (jsonMode) {
        outputJson({ status: 'error', message: err.message });
      } else {
        console.log(`\n  ✗ ${err.message}\n`);
      }
      process.exitCode = 1;
    }
  });

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

const listCmd = new Command('list')
  .description('List all companies registered in this ONXZA installation')
  .option('--verbose', 'Show shared-learnings directory status')
  .action((options, cmd) => {
    const jsonMode   = isJsonMode(cmd);
    const companies  = companyStore.listCompanies();
    const active     = companyStore.getActiveCompany();

    if (jsonMode) {
      outputJson({
        status:        'ok',
        count:         companies.length,
        activeCompany: active,
        companies,
      });
      return;
    }

    if (companies.length === 0) {
      console.log('\n  No companies found.');
      console.log('  Run `onxza company add <name>` to register your first company.\n');
      return;
    }

    console.log('');
    console.log(`  Companies (${companies.length})${active ? `  •  Active: ${active}` : ''}`);
    console.log('  ──────────────────────────────────────────────────────────');

    const codeW    = 8;
    const agentW   = 9;
    const projW    = 10;

    console.log(`  ${''.padEnd(2)}${'CODE'.padEnd(codeW)}${'AGENTS'.padEnd(agentW)}${'PROJECTS'.padEnd(projW)}SHARED-LEARNINGS`);
    console.log('  ' + '─'.repeat(codeW + agentW + projW + 20));

    for (const co of companies) {
      const activeMarker = co.active ? '▶ ' : '  ';
      const slStatus     = co.sharedLearnings ? '✓ exists' : '✗ not found';
      console.log(
        `  ${activeMarker}${co.code.padEnd(codeW)}${String(co.agents).padEnd(agentW)}${String(co.projects).padEnd(projW)}${slStatus}`
      );
    }
    console.log('');

    if (!active) {
      console.log('  No active company set. Run `onxza company switch <code>` to set one.');
      console.log('');
    }
  });

// ---------------------------------------------------------------------------
// switch
// ---------------------------------------------------------------------------

const switchCmd = new Command('switch')
  .description('Set the active company context (persisted between CLI sessions)')
  .argument('<name>', 'Company code to activate (e.g. DTP, WDC, MGA)')
  .action((name, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const code     = name.toUpperCase();

    // Validate the company exists
    if (!companyStore.companyExists(code)) {
      const companies = companyStore.listCompanies().map((c) => c.code);
      const err = {
        status:    'not_found',
        code,
        message:   `Company "${code}" not found.`,
        available: companies,
      };
      if (jsonMode) {
        outputJson(err);
      } else {
        console.log(`\n  ✗ Company "${code}" not found.`);
        if (companies.length > 0) {
          console.log(`  Available: ${companies.join(', ')}`);
        }
        console.log('');
      }
      process.exitCode = 1;
      return;
    }

    const previous = companyStore.getActiveCompany();
    companyStore.setActiveCompany(code);

    if (jsonMode) {
      outputJson({
        status:          'switched',
        activeCompany:   code,
        previousCompany: previous,
        persistedTo:     companyStore.CONTEXT_FILE,
      });
    } else {
      console.log('');
      if (previous && previous !== code) {
        console.log(`  ${previous} → ${code}`);
      }
      console.log(`  ✓ Active company: ${code}`);
      console.log(`  Context saved to: ${companyStore.CONTEXT_FILE}`);
      console.log('');
    }
  });

// ---------------------------------------------------------------------------
// Root command
// ---------------------------------------------------------------------------

const companyCmd = new Command('company')
  .description('Manage companies in this ONXZA installation')
  .passThroughOptions();

companyCmd.addCommand(addCmd);
companyCmd.addCommand(listCmd);
companyCmd.addCommand(switchCmd);

module.exports = companyCmd;

'use strict';

/**
 * onxza script — Script management sub-commands.
 *
 * onxza script create [script-name]  — Scaffold a new automation script
 * onxza script list                  — List scripts with tier classification
 * onxza script run [script-name]     — Execute script in sandbox
 *
 * TICKET-20260318-DTP-025 implements script commands.
 */

const { Command } = require('commander');
const { outputJson, isJsonMode } = require('../util');

function stub(name, ticket, detail) {
  return (args, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const result = { command: `script ${name}`, status: 'not_implemented', ticket, detail };
    if (jsonMode) {
      outputJson(result);
    } else {
      console.log(`  onxza script ${name} — Not yet implemented. See ${ticket}.`);
      if (detail) console.log(`  ${detail}`);
    }
  };
}

const scriptCmd = new Command('script')
  .description('Manage ONXZA automation scripts (create, list, run)')
  .option('--json', 'Output in JSON format (machine-readable)');


scriptCmd
  .command('create <script-name>')
  .description('Scaffold a new automation script with tier classification')
  .option('--tier <tier>', 'Automation tier: 1 | 2 | 3', '1')
  .action(stub('create', 'TICKET-DTP-025', 'Tiers: 1=LLM reasoning, 2=script+LLM hybrid, 3=pure script/cron'));

scriptCmd
  .command('list')
  .description('List automation scripts with tier classification and run history')
  .option('--tier <tier>', 'Filter by tier: 1 | 2 | 3')
  .action(stub('list', 'TICKET-DTP-025'));

scriptCmd
  .command('run <script-name>')
  .description('Execute a script in a sandboxed environment')
  .option('--dry-run', 'Validate without executing')
  .action(stub('run', 'TICKET-DTP-025'));

module.exports = scriptCmd;

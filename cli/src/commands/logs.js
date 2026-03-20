'use strict';

/**
 * onxza logs — Tail or search system logs.
 */

const { Command } = require('commander');
const { outputJson, isJsonMode } = require('../util');

const logsCmd = new Command('logs')
  .description('Tail ONXZA system logs')
  .option('--agent <id>', 'Filter logs by agent ID')
  .option('--follow', 'Follow log output (like tail -f)')
  .option('--lines <n>', 'Number of lines to show', '50')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const result = { command: 'logs', status: 'not_implemented', message: 'Log streaming coming in TICKET-DTP-008.' };
    if (jsonMode) {
      outputJson(result);
    } else {
      console.log('  onxza logs — Not yet implemented. Coming in TICKET-DTP-008.');
    }
  });

module.exports = logsCmd;

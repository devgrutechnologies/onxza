'use strict';

/**
 * onxza start — Start the ONXZA daemon/runtime.
 */

const { Command } = require('commander');
const { outputJson, isJsonMode } = require('../util');

const startCmd = new Command('start')
  .description('Start the ONXZA runtime daemon')
  .option('--foreground', 'Run in foreground (do not daemonize)')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const result = {
      command: 'start',
      status: 'not_implemented',
      message: 'onxza start — runtime daemon coming in a future ticket.',
    };
    if (jsonMode) {
      outputJson(result);
    } else {
      console.log('  onxza start — Not yet implemented. Runtime daemon coming soon.');
    }
  });

module.exports = startCmd;

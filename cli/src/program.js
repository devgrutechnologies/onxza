'use strict';

/**
 * ONXZA CLI — Program definition
 *
 * Builds the Commander.js program with all top-level commands registered.
 * Each command lives in src/commands/ for clean separation.
 *
 * Architecture decision: Node.js with Commander.js
 *   - Ships via npm (zero additional toolchain for JS/TS users)
 *   - Cross-platform (macOS, Linux, Windows) without compilation step
 *   - Fast cold start (<100ms) for a thin CLI wrapper
 *   - Single npm install -g onxza gets users running in under 2 minutes
 *   - Rust considered — deferred to v0.3 if performance becomes necessary
 */

const { Command } = require('commander');
const { outputJson } = require('./util');

// Command modules
const initCmd        = require('./commands/init');
const startCmd       = require('./commands/start');
const statusCmd      = require('./commands/status');
const companyCmd     = require('./commands/company');
const agentCmd       = require('./commands/agent');
const skillCmd       = require('./commands/skill');
const scriptCmd      = require('./commands/script');
const logsCmd        = require('./commands/logs');
const ticketsCmd     = require('./commands/tickets');
const dashboardCmd   = require('./commands/dashboard');
const auditCmd       = require('./commands/audit');
const checkpointCmd  = require('./commands/checkpoint');
const visionCmd      = require('./commands/vision');
const learningsCmd   = require('./commands/learnings');
const memoryCmd      = require('./commands/memory');
const sessionCmd     = require('./commands/session');
const pullCmd        = require('./commands/pull');
const securityCmd    = require('./commands/security');
const validateCmd    = require('./commands/validate');
const dispatcherCmd  = require('./commands/dispatcher');

/**
 * Build and return the root Commander program.
 * Exported so tests can call createProgram() without side effects.
 */
function createProgram() {
  const program = new Command();

  program
    .name('onxza')
    .description('ONXZA — AI Company Operating System CLI\n\nRun `onxza [command] --help` for details on any command.')
    .version('0.1.0', '-v, --version', 'Print ONXZA CLI version')
    // Global flag: machine-readable JSON output
    .option('--json', 'Output in JSON format (machine-readable)')
    // enablePositionalOptions allows subcommands that use passThroughOptions to receive their own flags
    // without the parent consuming them first. Required for tickets create/move/show to work correctly.
    .enablePositionalOptions()
    // Widen help output
    .configureHelp({ sortSubcommands: true })
    // Override default -h shorthand so --help is consistent
    .helpOption('-h, --help', 'Show help for a command');

  // Register all sub-commands
  program.addCommand(initCmd);
  program.addCommand(startCmd);
  program.addCommand(statusCmd);
  program.addCommand(companyCmd);
  program.addCommand(agentCmd);
  program.addCommand(skillCmd);
  program.addCommand(scriptCmd);
  program.addCommand(logsCmd);
  program.addCommand(ticketsCmd);
  program.addCommand(dashboardCmd);
  program.addCommand(auditCmd);
  program.addCommand(checkpointCmd);
  program.addCommand(visionCmd);
  program.addCommand(learningsCmd);
  program.addCommand(memoryCmd);
  program.addCommand(sessionCmd);
  program.addCommand(pullCmd);
  program.addCommand(securityCmd);
  program.addCommand(validateCmd);
  program.addCommand(dispatcherCmd);

  return program;
}

module.exports = { createProgram };

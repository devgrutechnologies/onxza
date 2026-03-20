/**
 * ONXZA CLI — Entry Point
 *
 * Wires all commands into a single Commander.js program.
 * Implements the global flags defined in ARCHITECTURE-v0.1.md §7.12.
 *
 * Global flags (all commands):
 *   --json      Machine-readable JSON output
 *   --version   CLI version
 *   --help      Command help
 *   --dir       Override ONXZA root (default: ~/.openclaw)
 *   --verbose   Detailed output
 *   --quiet     Suppress non-error output
 *
 * Tech stack: TypeScript + Commander.js ^12 (ARCHITECTURE-v0.1.md §2.1)
 *
 * Implementation status: SCAFFOLD
 *   All 21 commands wired with correct flags, arguments, help text, and
 *   output contracts. Logic bodies are stubbed pending @onxza/core delivery.
 *   See _notYetImplemented() in each command file.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command, Option }      from 'commander';
import { createRequire }        from 'module';
import { setOutputContext, outputJson, error } from './util/output.js';

// Command constructors
import { makeInitCommand }       from './commands/init.js';
import { makeAgentCommand }      from './commands/agent.js';
import { makeCompanyCommand }    from './commands/company.js';
import { makeConfigCommand }     from './commands/config.js';
import { makeTicketCommand }     from './commands/ticket.js';
import { makeSkillCommand }      from './commands/skill.js';
import { makeCheckpointCommand } from './commands/checkpoint.js';
import { makeStatusCommand }     from './commands/status.js';
import { makeValidateCommand }   from './commands/validate.js';
import { makeMpiCommand }        from './commands/mpi.js';
import { makeScriptCommand }     from './commands/script.js';

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

// Load version from package.json at runtime (avoids hardcoding)
const _require = createRequire(import.meta.url);
let CLI_VERSION = '0.1.0';
try {
  const pkg = _require('../package.json') as { version: string };
  CLI_VERSION = pkg.version;
} catch { /* fallback to hardcoded */ }

// ---------------------------------------------------------------------------
// Build the root program
// ---------------------------------------------------------------------------

export function createProgram(): Command {
  const program = new Command();

  program
    .name('onxza')
    .description(
      'ONXZA — AI Company Operating System\n' +
      'Run agent fleets, manage tickets, enforce quality, orchestrate AI companies.\n\n' +
      'Docs: https://docs.onxza.com  •  GitHub: github.com/devgru-technology-products/onxza'
    )
    .version(CLI_VERSION, '-v, --version', 'Print ONXZA CLI version')
    // Global flags (ARCHITECTURE-v0.1.md §7.12)
    .option('--json',           'Machine-readable JSON output (no prompts, no spinners)')
    .option('--dir <path>',     'Override ONXZA root directory (default: ~/.openclaw)')
    .option('--verbose',        'Detailed output')
    .option('--quiet',          'Suppress non-error output')
    // Allow subcommands to define their own positional args
    .enablePositionalOptions()
    .passThroughOptions(false)
    .helpOption('-h, --help', 'Show help for a command')
    .configureHelp({ sortSubcommands: true });

  // Propagate global options to output context before any command runs
  program.hook('preAction', (thisCmd, actionCmd) => {
    const opts = program.opts<{ json?: boolean; verbose?: boolean; quiet?: boolean }>();
    setOutputContext({
      json:    !!opts.json,
      verbose: !!opts.verbose,
      quiet:   !!opts.quiet,
    });
  });

  // ---------------------------------------------------------------------------
  // Register all commands
  // ---------------------------------------------------------------------------

  program.addCommand(makeInitCommand());
  program.addCommand(makeStatusCommand());
  program.addCommand(makeAgentCommand());
  program.addCommand(makeCompanyCommand());
  program.addCommand(makeConfigCommand());
  program.addCommand(makeTicketCommand());
  program.addCommand(makeSkillCommand());
  program.addCommand(makeCheckpointCommand());
  program.addCommand(makeValidateCommand());
  program.addCommand(makeMpiCommand());
  program.addCommand(makeScriptCommand());

  // ---------------------------------------------------------------------------
  // `onxza version` as explicit command (in addition to --version flag)
  // ARCHITECTURE-v0.1.md §10: `onxza version` is in v0.1 includes
  // ---------------------------------------------------------------------------

  program
    .command('version')
    .description('Print the ONXZA CLI version')
    .option('--json', 'Machine-readable output')
    .action((opts) => {
      if (opts.json) {
        outputJson({ version: CLI_VERSION, name: 'onxza' });
      } else {
        console.log(CLI_VERSION);
      }
    });

  // ---------------------------------------------------------------------------
  // `onxza help` as explicit command (in addition to --help flag)
  // ---------------------------------------------------------------------------
  // Commander auto-generates `help [command]` — we keep the default.

  // ---------------------------------------------------------------------------
  // Unknown command handler
  // ---------------------------------------------------------------------------

  program.on('command:*', (operands: string[]) => {
    error(
      `Unknown command: "${operands[0]}"\n` +
      `  Run "onxza help" to see available commands.`
    );
    process.exit(1);
  });

  return program;
}

// ---------------------------------------------------------------------------
// _notYetImplemented — global stub helper
// Called by all command actions while @onxza/core is being built.
// Prints a clear "scaffold" message with context and the data shape.
// ---------------------------------------------------------------------------

declare global {
  function _notYetImplemented(command: string, context?: Record<string, unknown>): void;
}

(globalThis as Record<string, unknown>)['_notYetImplemented'] = (
  command: string,
  context: Record<string, unknown> = {},
): void => {
  const { json, quiet } = { json: false, quiet: false, ...{ json: process.argv.includes('--json'), quiet: process.argv.includes('--quiet') } };

  const data = {
    status:    'scaffold',
    command:   `onxza ${command}`,
    message:   `Command registered. Logic pending @onxza/core delivery (ARCHITECTURE-v0.1.md §13 Phase 1).`,
    context,
  };

  if (json) {
    outputJson(data);
  } else if (!quiet) {
    console.log('');
    console.log(`  onxza ${command}`);
    console.log(`  ${'─'.repeat(52)}`);
    console.log(`  Status:   SCAFFOLD — wired, logic pending @onxza/core`);
    if (context.plannedSteps && Array.isArray(context.plannedSteps)) {
      console.log(`  Steps:`);
      (context.plannedSteps as string[]).forEach(s => console.log(`    ${s}`));
    }
    if (context.note) console.log(`  Note:     ${context.note}`);
    if (context.deferredTo) console.log(`  Deferred: ${context.deferredTo}`);
    if (context.workaround) console.log(`  Workaround: ${context.workaround}`);
    console.log('');
  }
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const program = createProgram();
program.parse(process.argv);

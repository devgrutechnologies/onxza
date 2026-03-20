/**
 * onxza mpi — Model Performance Index CLI sub-commands.
 *
 * Sub-commands:
 *   report   Query and display MPI metrics
 *   seed     Seed demo data (dev/test only, hidden)
 *
 * `onxza mpi report` flags:
 *   --model <name>              Filter by model (partial match)
 *   --task-type <type>          Filter by task type
 *   --date-range <start:end>    ISO date range YYYY-MM-DD:YYYY-MM-DD
 *   --format <table|json|csv>   Output format (default: table)
 *   --compare <modelA,modelB>   Side-by-side comparison
 *   --export <path>             Write output to file
 *   --min-samples <n>           Min data points per slice (default: 1)
 *
 * Data source: ~/.onxza/mpi/events.jsonl (override: ONXZA_MPI_PATH)
 * Backend swap point: replace readEvents() in store.ts with a query layer
 *                     when TICKET-DTP-019 delivers Supabase integration.
 *
 * Spec: MPI-001.md · TICKET-20260318-DTP-020
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command }   from 'commander';
import fs            from 'fs';
import path          from 'path';
import {
  readEvents,
  getMpiStorePath,
  parseDateRange,
} from '../mpi/store.js';
import {
  aggregateByModelAndType,
  aggregateByModel,
  compareModels,
} from '../mpi/aggregator.js';
import {
  formatTable,
  formatJson,
  formatCsv,
  formatCompare,
} from '../mpi/formatter.js';
import { TASK_TYPES, type TaskType } from '../mpi/schema.js';

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

function makeReportCommand(): Command {
  return new Command('report')
    .description('Query and display Model Performance Index metrics')
    .option(
      '--model <name>',
      'Filter by model name (partial match, e.g. "sonnet" or "claude-haiku-4-5")'
    )
    .option(
      '--task-type <type>',
      `Filter by task type: ${TASK_TYPES.join(' | ')}`
    )
    .option(
      '--date-range <start:end>',
      'ISO date range, e.g. 2026-03-01:2026-03-18'
    )
    .option(
      '--format <format>',
      'Output format: table | json | csv (default: table)',
      'table'
    )
    .option(
      '--compare <modelA,modelB>',
      'Side-by-side comparison of two models, e.g. "claude-haiku-4-5,claude-sonnet-4-6"'
    )
    .option(
      '--export <path>',
      'Write output to a file (json or csv)'
    )
    .option(
      '--min-samples <n>',
      'Minimum number of data points per model/type slice (default: 1)',
      '1'
    )
    .addHelpText('after', `
Examples:
  onxza mpi report
  onxza mpi report --model claude-sonnet
  onxza mpi report --task-type coding --format json
  onxza mpi report --date-range 2026-03-01:2026-03-18
  onxza mpi report --compare claude-haiku-4-5,claude-sonnet-4-6 --task-type analysis
  onxza mpi report --format csv --export ./mpi-report.csv
  onxza mpi report --model opus --min-samples 5
`)
    .action((opts) => {
      const t0 = Date.now();

      // ── Validate --task-type ─────────────────────────────────────────────
      if (opts.taskType && !(TASK_TYPES as readonly string[]).includes(opts.taskType as string)) {
        process.stderr.write(
          `\n  ✗ Invalid task type: "${opts.taskType}"\n` +
          `  Valid values: ${TASK_TYPES.join(', ')}\n\n`
        );
        process.exit(1);
      }

      // ── Validate --format ────────────────────────────────────────────────
      const format = opts.format as string;
      if (!['table', 'json', 'csv'].includes(format)) {
        process.stderr.write(
          `\n  ✗ Invalid format: "${format}". Use: table | json | csv\n\n`
        );
        process.exit(1);
      }

      // ── Parse --date-range ───────────────────────────────────────────────
      let dateStart: string | undefined;
      let dateEnd: string | undefined;

      if (opts.dateRange) {
        const parsed = parseDateRange(opts.dateRange as string);
        if (!parsed) {
          process.stderr.write(
            `\n  ✗ Invalid date range: "${opts.dateRange}"\n` +
            `  Format: YYYY-MM-DD:YYYY-MM-DD  Example: 2026-03-01:2026-03-18\n\n`
          );
          process.exit(1);
        }
        dateStart = parsed.dateStart;
        dateEnd   = parsed.dateEnd;
      }

      const minSamples = Math.max(1, parseInt(opts.minSamples as string, 10) || 1);

      // ── Read + filter ────────────────────────────────────────────────────
      const events = readEvents({
        model:     opts.model as string | undefined,
        taskType:  opts.taskType as TaskType | undefined,
        dateStart,
        dateEnd,
      });

      const filters: Record<string, string | undefined> = {
        model:     opts.model,
        taskType:  opts.taskType,
        dateRange: opts.dateRange,
        format,
        minSamples: String(minSamples),
        store:     getMpiStorePath(),
      };

      // ── Compare mode ─────────────────────────────────────────────────────
      if (opts.compare) {
        const parts = (opts.compare as string).split(',').map(s => s.trim());
        if (parts.length !== 2) {
          process.stderr.write(
            `\n  ✗ --compare requires exactly two model names separated by a comma.\n` +
            `  Example: --compare claude-haiku-4-5,claude-sonnet-4-6\n\n`
          );
          process.exit(1);
        }
        const [ma, mb] = parts as [string, string];
        const { modelA, modelB } = compareModels(events, ma, mb);
        const output = formatCompare(modelA, modelB);

        _output(output, opts.export as string | undefined, 'table');
        _timing(t0);
        return;
      }

      // ── Normal report ─────────────────────────────────────────────────────
      const slices = opts.taskType
        ? aggregateByModelAndType(events, minSamples)
        : (opts.model
            ? aggregateByModelAndType(events, minSamples)
            : aggregateByModel(events, minSamples));

      let output: string;
      switch (format) {
        case 'json': output = formatJson(slices, filters);  break;
        case 'csv':  output = formatCsv(slices);            break;
        default:     output = formatTable(slices, filters); break;
      }

      _output(output, opts.export as string | undefined, format);
      _timing(t0);
    });
}

// ---------------------------------------------------------------------------
// seed (hidden dev command)
// ---------------------------------------------------------------------------

function makeSeedCommand(): Command {
  return new Command('seed')
    .description('Seed demo MPI data (dev/test only)')
    .option('--count <n>', 'Number of events to generate', '50')
    .option('--clear',     'Clear existing data before seeding')
    .addHelpText('before', '  [Dev/test only] Generates realistic MPI events.\n')
    .action((opts) => {
      const count = parseInt(opts.count as string, 10) || 50;
      const storePath = getMpiStorePath();

      if (opts.clear && fs.existsSync(storePath)) {
        fs.unlinkSync(storePath);
        process.stdout.write(`  ✓ Cleared ${storePath}\n`);
      }

      // Dynamic import to avoid loading seed in production
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const { seedMpiData } = require('../mpi/seed.js') as typeof import('../mpi/seed.js');
      seedMpiData(count);
      process.stdout.write(`  ✓ Seeded ${count} MPI events → ${storePath}\n`);
    });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _output(content: string, exportPath: string | undefined, format: string): void {
  if (exportPath) {
    const abs = path.resolve(exportPath);
    fs.writeFileSync(abs, content, 'utf8');
    process.stdout.write(`  ✓ Exported to: ${abs}\n`);
  } else {
    process.stdout.write(content);
  }
}

function _timing(t0: number): void {
  const elapsed = Date.now() - t0;
  if (elapsed > 500) {
    process.stderr.write(`  ${elapsed}ms\n`);
  }
}

// ---------------------------------------------------------------------------
// Root: onxza mpi
// ---------------------------------------------------------------------------

export function makeMpiCommand(): Command {
  const cmd = new Command('mpi')
    .description('Model Performance Index — query and compare model performance metrics');

  cmd.addCommand(makeReportCommand());
  cmd.addCommand(makeSeedCommand().hideHelp());

  return cmd;
}

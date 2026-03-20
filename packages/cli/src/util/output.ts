/**
 * Output formatting utilities for the ONXZA CLI.
 *
 * Centralises chalk colouring, ora spinners, JSON output, and the
 * standard exit-code contract described in ARCHITECTURE-v0.1.md §7.
 *
 * Rules:
 *  - All user-facing text goes through these helpers — never console.log directly.
 *  - --json flag suppresses all formatting; only JSON to stdout.
 *  - --quiet suppresses info/success; errors still print.
 *  - No interactive prompts when --json is active (§15, constraint 7).
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import chalk from 'chalk';
import ora, { type Ora } from 'ora';

// ---------------------------------------------------------------------------
// Context — populated once from Commander options at program parse time
// ---------------------------------------------------------------------------

interface OutputContext {
  json:    boolean;
  verbose: boolean;
  quiet:   boolean;
}

let _ctx: OutputContext = { json: false, verbose: false, quiet: false };

export function setOutputContext(ctx: Partial<OutputContext>): void {
  _ctx = { ..._ctx, ...ctx };
}

export function isJsonMode(): boolean  { return _ctx.json;    }
export function isVerbose(): boolean   { return _ctx.verbose; }
export function isQuiet(): boolean     { return _ctx.quiet;   }

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export function success(msg: string): void {
  if (_ctx.json || _ctx.quiet) return;
  console.log(`  ${chalk.green('✓')} ${msg}`);
}

export function info(msg: string): void {
  if (_ctx.json || _ctx.quiet) return;
  console.log(`  ${chalk.cyan('•')} ${msg}`);
}

export function warn(msg: string): void {
  if (_ctx.json) return;
  console.warn(`  ${chalk.yellow('⚠')}  ${msg}`);
}

export function error(msg: string): void {
  // Errors always print — even in --json mode as a JSON envelope
  if (_ctx.json) {
    outputJson({ status: 'error', error: msg });
  } else {
    console.error(`\n  ${chalk.red('✗')} ${msg}\n`);
  }
}

export function step(msg: string): void {
  if (_ctx.json || _ctx.quiet) return;
  console.log(`\n  ${chalk.bold(msg)}`);
}

export function dim(msg: string): void {
  if (_ctx.json || _ctx.quiet) return;
  console.log(`  ${chalk.dim(msg)}`);
}

export function blank(): void {
  if (_ctx.json || _ctx.quiet) return;
  console.log('');
}

// ---------------------------------------------------------------------------
// JSON output
// ---------------------------------------------------------------------------

export function outputJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Box / summary panel
// ---------------------------------------------------------------------------

export function box(lines: string[]): void {
  if (_ctx.json || _ctx.quiet) return;
  const width = Math.max(50, ...lines.map(l => l.length + 4));
  const top    = `  ╭${'─'.repeat(width)}╮`;
  const bottom = `  ╰${'─'.repeat(width)}╯`;
  console.log(top);
  for (const line of lines) {
    const pad = ' '.repeat(width - line.length - 2);
    console.log(`  │  ${line}${pad}  │`);
  }
  console.log(bottom);
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

export function spinner(text: string): Ora {
  if (_ctx.json || _ctx.quiet) {
    // Return a no-op spinner in non-interactive modes
    return ora({ isSilent: true }).start(text);
  }
  return ora({ text, indent: 2 }).start();
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

interface Column {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'right';
}

export function table(rows: Record<string, string>[], columns: Column[]): void {
  if (_ctx.json) return;

  // Calculate column widths
  const widths = columns.map(col => {
    const dataMax = rows.reduce((mx, r) => Math.max(mx, (r[col.key] ?? '').length), 0);
    return Math.max(col.header.length, col.width ?? 0, dataMax);
  });

  // Header
  const header = columns.map((col, i) => col.header.padEnd(widths[i])).join('  ');
  const divider = widths.map(w => '─'.repeat(w)).join('  ');
  console.log(`\n  ${chalk.bold(header)}`);
  console.log(`  ${chalk.dim(divider)}`);

  // Rows
  for (const row of rows) {
    const line = columns.map((col, i) => {
      const val = row[col.key] ?? '';
      return col.align === 'right' ? val.padStart(widths[i]) : val.padEnd(widths[i]);
    }).join('  ');
    console.log(`  ${line}`);
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Exit helpers — enforce exit code contract (ARCHITECTURE-v0.1.md §3.4, §4.5)
// ---------------------------------------------------------------------------

export function exitOk(): never {
  process.exit(0);
}

export function exitValidationError(msg: string): never {
  error(msg);
  process.exit(1);
}

export function exitFilesystemError(msg: string): never {
  error(msg);
  process.exit(2);
}

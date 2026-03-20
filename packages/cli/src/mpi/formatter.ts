/**
 * MPI Formatter — renders MpiSlice[] in table, JSON, or CSV format.
 *
 * Table: chalk-coloured aligned columns. Pass rate colour-coded:
 *   ≥ 80% → green  |  60–79% → yellow  |  < 60% → red
 *
 * JSON: { generated, filters, slices[], summary }
 * CSV:  RFC 4180, UTF-8, headers on row 1
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { MpiSlice } from './schema.js';
import { summarise } from './aggregator.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function usd(val: number): string {
  return `$${val.toFixed(4)}`;
}

function ms(val: number): string {
  return val >= 1000 ? `${(val / 1000).toFixed(1)}s` : `${Math.round(val)}ms`;
}

function pad(str: string, width: number, right = false): string {
  if (str.length >= width) return str.slice(0, width);
  const sp = ' '.repeat(width - str.length);
  return right ? sp + str : str + sp;
}

// ---------------------------------------------------------------------------
// Table formatter
// ---------------------------------------------------------------------------

export function formatTable(
  slices: MpiSlice[],
  filters: Record<string, string | undefined> = {},
): string {
  // chalk is optional — fall back to no-colour if unavailable
  let green  = (s: string) => s;
  let yellow = (s: string) => s;
  let red    = (s: string) => s;
  let bold   = (s: string) => s;
  let dim    = (s: string) => s;
  let cyan   = (s: string) => s;

  try {
    // Dynamic import-compatible require for CJS context
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const chalk = require('chalk') as typeof import('chalk').default;
    green  = (s) => chalk.green(s);
    yellow = (s) => chalk.yellow(s);
    red    = (s) => chalk.red(s);
    bold   = (s) => chalk.bold(s);
    dim    = (s) => chalk.dim(s);
    cyan   = (s) => chalk.cyan(s);
  } catch { /* no-colour fallback */ }

  function rateColor(rate: number, s: string): string {
    if (rate >= 0.80) return green(s);
    if (rate >= 0.60) return yellow(s);
    return red(s);
  }

  if (slices.length === 0) {
    return '\n  No MPI data found for the given filters.\n  Run `onxza mpi seed` to generate demo data.\n';
  }

  const modelW    = Math.max(30, ...slices.map(s => s.modelUsed.length)) + 1;
  const typeW     = 14;
  const nW        = 8;
  const passW     = 10;
  const loopW     = 8;
  const costW     = 10;
  const timeW     = 10;

  const header =
    pad('MODEL', modelW) +
    pad('TASK TYPE', typeW) +
    pad('N', nW, true) + '  ' +
    pad('PASS%', passW, true) + '  ' +
    pad('AVG LOOPS', loopW, true) + '  ' +
    pad('AVG COST', costW, true) + '  ' +
    pad('AVG TIME', timeW, true);

  const divider = '─'.repeat(modelW + typeW + nW + passW + loopW + costW + timeW + 8);

  const lines: string[] = [
    '',
    bold('  ONXZA Model Performance Index'),
    dim('  ' + new Date().toLocaleString()),
    '',
    '  ' + bold(header),
    '  ' + dim(divider),
  ];

  for (const sl of slices) {
    const passStr = pct(sl.fvpFirstAttemptRate);
    const row =
      pad(sl.modelUsed, modelW) +
      pad(sl.taskType, typeW) +
      pad(String(sl.sampleCount), nW, true) + '  ' +
      pad(passStr, passW, true) + '  ' +
      pad(sl.avgLoopCount.toFixed(2), loopW, true) + '  ' +
      pad(usd(sl.avgCostUsd), costW, true) + '  ' +
      pad(ms(sl.avgTimeMs), timeW, true);

    // Colour the pass rate portion
    const passIdx = modelW + typeW + nW + 2;
    const before  = row.slice(0, passIdx);
    const passCol = row.slice(passIdx, passIdx + passW + 2);
    const after   = row.slice(passIdx + passW + 2);

    lines.push('  ' + cyan(before) + rateColor(sl.fvpFirstAttemptRate, passCol) + after);
  }

  const summary = summarise(slices);
  lines.push('  ' + dim(divider));
  lines.push(
    '  ' + dim(
      `Total: ${summary.totalSamples} samples  |  ` +
      `Overall pass rate: ${pct(summary.overallPassRate)}  |  ` +
      `Avg loops: ${summary.overallAvgLoops.toFixed(2)}  |  ` +
      `Avg cost: ${usd(summary.overallAvgCostUsd)}`
    )
  );
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// JSON formatter
// ---------------------------------------------------------------------------

export function formatJson(
  slices: MpiSlice[],
  filters: Record<string, string | undefined> = {},
): string {
  const output = {
    generated: new Date().toISOString(),
    filters,
    summary:   summarise(slices),
    slices:    slices.map(sl => ({
      ...sl,
      fvpFirstAttemptRatePct: parseFloat((sl.fvpFirstAttemptRate * 100).toFixed(2)),
    })),
  };
  return JSON.stringify(output, null, 2);
}

// ---------------------------------------------------------------------------
// CSV formatter (RFC 4180)
// ---------------------------------------------------------------------------

const CSV_HEADERS = [
  'model', 'taskType', 'sampleCount',
  'fvpFirstAttemptRatePct', 'avgLoopCount',
  'avgConfidenceScore', 'avgCostUsd', 'avgTimeMs', 'routerMatchRatePct',
];

function csvEscape(val: string | number): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function formatCsv(slices: MpiSlice[]): string {
  const rows: string[] = [CSV_HEADERS.join(',')];
  for (const sl of slices) {
    rows.push([
      csvEscape(sl.modelUsed),
      csvEscape(sl.taskType),
      csvEscape(sl.sampleCount),
      csvEscape((sl.fvpFirstAttemptRate * 100).toFixed(2)),
      csvEscape(sl.avgLoopCount.toFixed(3)),
      csvEscape(sl.avgConfidenceScore.toFixed(1)),
      csvEscape(sl.avgCostUsd.toFixed(6)),
      csvEscape(sl.avgTimeMs.toFixed(1)),
      csvEscape((sl.routerMatchRate * 100).toFixed(2)),
    ].join(','));
  }
  return rows.join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------------------
// Compare formatter
// ---------------------------------------------------------------------------

export function formatCompare(
  modelA: MpiSlice,
  modelB: MpiSlice,
): string {
  let bold = (s: string) => s;
  let green = (s: string) => s;
  let yellow = (s: string) => s;
  let dim = (s: string) => s;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const chalk = require('chalk') as typeof import('chalk').default;
    bold   = (s) => chalk.bold(s);
    green  = (s) => chalk.green(s);
    yellow = (s) => chalk.yellow(s);
    dim    = (s) => chalk.dim(s);
  } catch { /* no-colour */ }

  function better(a: number, b: number, higherIsBetter: boolean, fmt: (n: number) => string): [string, string] {
    if (a === b) return [fmt(a), fmt(b)];
    const aIsBetter = higherIsBetter ? a > b : a < b;
    return aIsBetter ? [green(bold(fmt(a))), fmt(b)] : [fmt(a), green(bold(fmt(b)))];
  }

  const [passA, passB] = better(modelA.fvpFirstAttemptRate, modelB.fvpFirstAttemptRate, true, pct);
  const [loopA, loopB] = better(modelA.avgLoopCount, modelB.avgLoopCount, false, n => n.toFixed(2));
  const [costA, costB] = better(modelA.avgCostUsd, modelB.avgCostUsd, false, usd);
  const [timeA, timeB] = better(modelA.avgTimeMs, modelB.avgTimeMs, false, ms);

  const labelW = 22;
  const colW   = 30;

  const mA = modelA.modelUsed.split('/').pop() ?? modelA.modelUsed;
  const mB = modelB.modelUsed.split('/').pop() ?? modelB.modelUsed;

  const lines = [
    '',
    bold('  Model Comparison'),
    '',
    '  ' + ''.padEnd(labelW) + bold(pad(mA, colW)) + bold(pad(mB, colW)),
    '  ' + dim('─'.repeat(labelW + colW * 2)),
    `  ${pad('Samples', labelW)}${pad(String(modelA.sampleCount), colW)}${pad(String(modelB.sampleCount), colW)}`,
    `  ${pad('FVP 1st-attempt pass', labelW)}${pad(passA, colW)}${pad(passB, colW)}`,
    `  ${pad('Avg loops', labelW)}${pad(loopA, colW)}${pad(loopB, colW)}`,
    `  ${pad('Avg cost', labelW)}${pad(costA, colW)}${pad(costB, colW)}`,
    `  ${pad('Avg time', labelW)}${pad(timeA, colW)}${pad(timeB, colW)}`,
    `  ${dim(pad('Router match rate', labelW))}${dim(pad(pct(modelA.routerMatchRate), colW))}${dim(pad(pct(modelB.routerMatchRate), colW))}`,
    '  ' + dim('─'.repeat(labelW + colW * 2)),
    `  ${dim(yellow('Bold green = better value for that metric'))}`,
    '',
  ];

  return lines.join('\n');
}

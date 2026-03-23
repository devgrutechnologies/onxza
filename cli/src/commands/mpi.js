'use strict';

/**
 * onxza mpi — MPI Benchmark command group.
 *
 * Sub-commands:
 *   run        Execute benchmark against a model (per-type + composite scores)
 *   report     Display last results with per-type breakdown
 *   compare    Compare multiple models side-by-side
 *   validate   Validate a task corpus for correctness
 *   list-runs  List all completed benchmark runs
 *
 * Implements MPI-HARNESS-SPEC-v0.1 §3 (CLI Command Surface).
 * FPR gating: flags models below 70% FPR. Addresses Gap 5 from Phase 4 validation.
 * Per-type stratification: coding, reasoning, writing, planning. Addresses Gap 7.
 * Verifier model documented + configurable. Addresses Gap 8.
 *
 * TICKET-20260322-DTP-MPI-PHASE5-HARNESS
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const { Command }  = require('commander');
const fs           = require('fs');
const path         = require('path');
const { outputJson, isJsonMode } = require('../util');

const taskLoader   = require('../lib/mpi/task-loader');
const executor     = require('../lib/mpi/executor');
const scorer       = require('../lib/mpi/scorer');
const adapters     = require('../lib/mpi/adapters');
const { DEFAULT_VERIFIER } = require('../lib/mpi/verifier');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_CORPUS  = path.join(process.cwd(), 'benchmark', 'tasks');
const DEFAULT_OUTPUT  = path.join(process.cwd(), 'results');
const FPR_THRESHOLD   = scorer.FPR_THRESHOLD;

function gateIcon(status) {
  return status === 'PASS' ? '✅' : '⚠️ ';
}

function bar(pct, width = 25) {
  const filled = Math.round((pct / 100) * width);
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, width - filled));
}

function loadRunMetadata(runDir) {
  const summaryPath = path.join(runDir, 'summary.json');
  if (!fs.existsSync(summaryPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function listRunDirs(outputDir) {
  if (!fs.existsSync(outputDir)) return [];
  return fs.readdirSync(outputDir)
    .filter(d => d.startsWith('mpi-run-'))
    .map(d => path.join(outputDir, d))
    .filter(d => fs.statSync(d).isDirectory())
    .sort()
    .reverse(); // newest first
}

function resolveRunDir(outputDir, runId) {
  if (runId) {
    const explicit = path.join(outputDir, runId);
    if (fs.existsSync(explicit)) return explicit;
    // Maybe they passed a partial prefix
    const dirs = listRunDirs(outputDir);
    const match = dirs.find(d => path.basename(d).includes(runId));
    if (match) return match;
    return null;
  }
  const dirs = listRunDirs(outputDir);
  return dirs.length ? dirs[0] : null;
}

function getApiKey(adapter) {
  // Prefer env vars
  if (adapter && adapter.id && adapter.id.toLowerCase().startsWith('claude')) {
    return process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || null;
  }
  if (adapter && adapter.id && (
    adapter.id.toLowerCase().startsWith('gpt') ||
    adapter.id.toLowerCase().startsWith('o1') ||
    adapter.id.toLowerCase().startsWith('o3')
  )) {
    return process.env.OPENAI_API_KEY || null;
  }
  return null;
}

function makeRunId() {
  const now = new Date();
  const ts  = now.toISOString().replace(/[-:T]/g, '').replace(/\..+/, '').slice(0, 15);
  return `mpi-run-${ts}`;
}

// ---------------------------------------------------------------------------
// onxza mpi run
// ---------------------------------------------------------------------------

const runCmd = new Command('run')
  .description('Execute MPI benchmark against a model')
  .requiredOption('--model <model-id>', 'Model to benchmark (e.g. claude-sonnet-4-20250514, gpt-4o)')
  .option('--corpus <path>', 'Path to task corpus directory', DEFAULT_CORPUS)
  .option('--profile <name>', 'Weight profile: production, research, quality-first, custom:...', 'production')
  .option('--output <path>', 'Output directory for results', DEFAULT_OUTPUT)
  .option('--verifier <model-id>', `Verifier model (default: ${DEFAULT_VERIFIER})`, DEFAULT_VERIFIER)
  .option('--verbose', 'Show per-task progress')
  .option('--dry-run', 'Validate setup without executing tasks')
  .option('--json', 'Output results as JSON')
  .action(async (options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    // ── Load corpus ─────────────────────────────────────────────────────────
    if (!jsonMode) {
      console.log(`\n🔬 MPI Benchmark — Loading corpus from: ${options.corpus}`);
    }

    const { tasks, errors: loadErrors } = taskLoader.loadCorpus(options.corpus);
    if (loadErrors.length) {
      if (jsonMode) return outputJson({ error: 'Corpus load errors', details: loadErrors }, 3);
      console.error('\n❌ Corpus load errors:');
      loadErrors.forEach(e => console.error(`   ${e}`));
      process.exit(3);
    }

    const { valid, errors: valErrors, warnings } = taskLoader.validateCorpus(tasks);
    if (!valid) {
      if (jsonMode) return outputJson({ error: 'Corpus validation failed', details: valErrors }, 3);
      console.error('\n❌ Corpus validation failed:');
      valErrors.forEach(e => console.error(`   ${e}`));
      process.exit(3);
    }

    if (!jsonMode) {
      const typeDist = JSON.stringify(Object.fromEntries(
        scorer.TASK_TYPES.map(t => [t, tasks.filter(tk => tk.task_type === t).length])
      ));
      console.log(`✅ Corpus loaded: ${tasks.length} tasks (${typeDist})`);
    }

    // Validate verifier != model being tested
    if (options.verifier === options.model) {
      const fallback = DEFAULT_VERIFIER !== options.model ? DEFAULT_VERIFIER : 'gpt-4o';
      if (!jsonMode) {
        console.warn(`\n⚠️  Verifier model is the same as the benchmarked model.`);
        console.warn(`   Switching verifier to: ${fallback}`);
      }
      options.verifier = fallback;
    }

    // ── Create adapter ───────────────────────────────────────────────────────
    let adapter;
    try {
      adapter = adapters.createAdapter(options.model, {
        apiKey: options.model.startsWith('claude')
          ? (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY)
          : process.env.OPENAI_API_KEY,
      });
    } catch (e) {
      if (jsonMode) return outputJson({ error: e.message }, 1);
      console.error(`\n❌ Model setup error: ${e.message}`);
      process.exit(1);
    }

    if (!jsonMode) {
      const taskDist = scorer.TASK_TYPES.map(t =>
        `${t}: ${tasks.filter(tk => tk.task_type === t).length}`
      ).join(', ');
      console.log(`\n📋 Tasks: ${tasks.length} (${taskDist})`);
      console.log(`🤖 Model:    ${options.model}`);
      console.log(`🔍 Verifier: ${options.verifier}`);
      console.log(`⚖️  Profile:  ${options.profile}`);
      if (options.dryRun) console.log(`🧪 DRY RUN — tasks will not execute`);
      console.log('');
    }

    // ── Execute ──────────────────────────────────────────────────────────────
    const apiKey = options.model.startsWith('claude')
      ? (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY)
      : process.env.OPENAI_API_KEY;

    const results = await executor.executeAll(tasks, adapter, options.verifier, {
      apiKey,
      verbose:    options.verbose,
      dryRun:     options.dryRun,
      onProgress: msg => { if (!jsonMode) process.stdout.write(msg + '\n'); },
    });

    // ── Score ────────────────────────────────────────────────────────────────
    const scores = scorer.computeScores(results, options.profile);

    // FPR gate output
    const composite   = scores.composite;
    const fprFlagged  = composite && composite.fpr < FPR_THRESHOLD;

    // ── Persist results ──────────────────────────────────────────────────────
    const runId    = makeRunId();
    const runDir   = path.join(options.output, runId);
    fs.mkdirSync(runDir, { recursive: true });

    const summary = {
      run_id:          runId,
      model_id:        options.model,
      corpus_path:     options.corpus,
      corpus_size:     tasks.length,
      verifier_model:  options.verifier,
      weight_profile:  options.profile,
      timestamp:       new Date().toISOString(),
      dry_run:         options.dryRun || false,
      scores,
    };

    fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.join(runDir, 'results.json'), JSON.stringify({ run_id: runId, results }, null, 2));

    // Per-task results
    const perTaskDir = path.join(runDir, 'per-task');
    fs.mkdirSync(perTaskDir, { recursive: true });
    for (const r of results) {
      fs.writeFileSync(path.join(perTaskDir, `${r.task_id}.json`), JSON.stringify(r, null, 2));
    }

    if (jsonMode) return outputJson(summary);

    // ── Human-readable output ────────────────────────────────────────────────
    const W = 63;
    const line = '═'.repeat(W);
    const dash = '─'.repeat(W - 2);

    console.log(`\n${line}`);
    console.log(`  MPI BENCHMARK RESULTS — ${options.model}`);
    console.log(`  Run: ${runId}`);
    console.log(`  Profile: ${options.profile} | Verifier: ${options.verifier}`);
    console.log(line);

    if (composite) {
      const ci    = composite.confidence_interval || [0, 0];
      const gate  = composite.fpr_gate_label || composite.fpr_gate;
      const icon  = gateIcon(composite.fpr_gate);

      console.log(`\n  COMPOSITE MPI SCORE:  ${composite.score}  [${ci[0]} – ${ci[1]}]  ${icon} ${gate}`);
      console.log(`  ${dash}`);
      console.log(`  FPR (Quality):    ${composite.fpr}%  │  ${bar(composite.fpr)}`);
      console.log(`  Efficiency:       ${composite.efficiency}%  │  ${bar(composite.efficiency)}`);
      console.log(`  Speed:            ${composite.speed}%  │  ${bar(composite.speed)}`);
      console.log(`  Cost:             ${composite.cost}%  │  ${bar(composite.cost)}`);
      console.log(`  Versatility:      ${composite.versatility}%  │  ${bar(composite.versatility)}`);
    }

    console.log(`\n  PER-TYPE BREAKDOWN:`);
    console.log(`  ${dash}`);
    for (const type of scorer.TASK_TYPES) {
      const s = scores.per_type[type];
      if (!s) { console.log(`  ${type.padEnd(10)} —  (no tasks)`); continue; }
      const ci   = s.confidence_interval || [0, 0];
      const icon = gateIcon(s.fpr_gate);
      console.log(`  ${type.padEnd(10)} ${String(s.score).padStart(5)} [${ci[0]} – ${ci[1]}]  ${icon}  ${bar(s.score, 20)}`);
      if (s.fpr < FPR_THRESHOLD) {
        console.log(`     ⚠️  ${type} FPR (${s.fpr}%) below ${FPR_THRESHOLD}% threshold`);
      }
    }

    if (Object.keys(scores.failure_modes || {}).length) {
      console.log(`\n  FAILURE MODES:`);
      console.log(`  ${dash}`);
      for (const [mode, count] of Object.entries(scores.failure_modes)) {
        console.log(`  ${mode.padEnd(24)} ${count} task${count !== 1 ? 's' : ''}`);
      }
    }

    if (fprFlagged) {
      const exp = (100 / (100 - composite.fpr)).toFixed(1);
      console.log(`\n  ⚠️  OVERALL FPR BELOW ${FPR_THRESHOLD}% THRESHOLD`);
      console.log(`  Not recommended for unsupervised autonomous deployment.`);
      console.log(`  Expected failure rate: 1 in ${exp} tasks requires human intervention.`);
    }

    console.log(`\n  Results saved to: ${runDir}`);
    console.log(`${line}\n`);

    if (fprFlagged) process.exit(0); // exit 0 — flagged, but run succeeded
  });

// ---------------------------------------------------------------------------
// onxza mpi report
// ---------------------------------------------------------------------------

const reportCmd = new Command('report')
  .description('Display results from a completed MPI benchmark run')
  .option('--run <run-id>', 'Run ID to display (default: latest)')
  .option('--output <path>', 'Results directory', DEFAULT_OUTPUT)
  .option('--format <fmt>', 'Output format: text, json', 'text')
  .option('--type <type>', 'Filter by task type (coding|reasoning|writing|planning)')
  .option('--json', 'Alias for --format json')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd) || options.format === 'json';
    const outputDir = options.output;

    const runDir = resolveRunDir(outputDir, options.run);
    if (!runDir) {
      if (jsonMode) return outputJson({ error: 'No benchmark runs found', outputDir }, 1);
      console.error(`\n❌ No benchmark runs found in: ${outputDir}`);
      console.error(`   Run 'onxza mpi run --model <model-id>' first.`);
      process.exit(1);
    }

    const summary = loadRunMetadata(runDir);
    if (!summary) {
      if (jsonMode) return outputJson({ error: 'Could not load run summary', runDir }, 1);
      console.error(`\n❌ Could not load run summary from: ${runDir}`);
      process.exit(1);
    }

    const { scores, model_id, verifier_model, weight_profile, timestamp, run_id } = summary;

    if (jsonMode) {
      if (options.type && scores.per_type) {
        return outputJson({ run_id, model_id, type: options.type, score: scores.per_type[options.type] });
      }
      return outputJson(summary);
    }

    // ── Human-readable ───────────────────────────────────────────────────────
    const W    = 63;
    const line = '═'.repeat(W);
    const dash = '─'.repeat(W - 2);

    console.log(`\n${line}`);
    console.log(`  MPI BENCHMARK REPORT — ${model_id}`);
    console.log(`  Run: ${run_id}`);
    console.log(`  Date: ${new Date(timestamp).toLocaleString()}`);
    console.log(`  Profile: ${weight_profile} | Verifier: ${verifier_model}`);
    console.log(line);

    const composite = scores && scores.composite;
    if (composite) {
      if (!options.type || options.type === 'composite') {
        const ci   = composite.confidence_interval || [0, 0];
        const gate = composite.fpr_gate_label || composite.fpr_gate;
        const icon = gateIcon(composite.fpr_gate);

        console.log(`\n  COMPOSITE MPI SCORE:  ${composite.score}  [${ci[0]} – ${ci[1]}]  ${icon} ${gate}`);
        console.log(`  ${dash}`);
        console.log(`  FPR (Quality):    ${composite.fpr}%  │  ${bar(composite.fpr)}`);
        console.log(`  Efficiency:       ${composite.efficiency}%  │  ${bar(composite.efficiency)}`);
        console.log(`  Speed:            ${composite.speed}%  │  ${bar(composite.speed)}`);
        console.log(`  Cost:             ${composite.cost}%  │  ${bar(composite.cost)}`);
        console.log(`  Versatility:      ${composite.versatility}%  │  ${bar(composite.versatility)}`);
      }
    }

    if (scores && scores.per_type) {
      const typesToShow = options.type
        ? [options.type]
        : scorer.TASK_TYPES;

      console.log(`\n  PER-TYPE BREAKDOWN:`);
      console.log(`  ${dash}`);
      for (const type of typesToShow) {
        const s = scores.per_type[type];
        if (!s) { console.log(`  ${type.padEnd(10)} —  (no tasks)`); continue; }
        const ci   = s.confidence_interval || [0, 0];
        const icon = gateIcon(s.fpr_gate);
        console.log(`  ${type.padEnd(10)} ${String(s.score).padStart(5)} [${ci[0]} – ${ci[1]}]  ${icon}  ${bar(s.score, 20)}`);
        if (s.fpr < FPR_THRESHOLD) {
          console.log(`     ⚠️  ${type} FPR (${s.fpr}%) below ${FPR_THRESHOLD}% threshold`);
          const exp = (100 / (100 - s.fpr)).toFixed(1);
          console.log(`     Advisory: Not recommended for unsupervised ${type} tasks.`);
        }
      }
    }

    if (scores && scores.failure_modes && Object.keys(scores.failure_modes).length) {
      console.log(`\n  FAILURE MODES:`);
      console.log(`  ${dash}`);
      for (const [mode, count] of Object.entries(scores.failure_modes)) {
        console.log(`  ${mode.padEnd(24)} ${count} task${count !== 1 ? 's' : ''}`);
      }
    }

    console.log(`\n  Full results: ${runDir}`);
    console.log(`${line}\n`);
  });

// ---------------------------------------------------------------------------
// onxza mpi compare
// ---------------------------------------------------------------------------

const compareCmd = new Command('compare')
  .description('Compare MPI benchmark results across multiple models')
  .requiredOption('--models <ids>', 'Comma-separated model IDs to compare')
  .option('--output <path>', 'Results directory', DEFAULT_OUTPUT)
  .option('--sort <by>', 'Sort by: composite, coding, reasoning, writing, planning, cost', 'composite')
  .option('--format <fmt>', 'Output format: text, json', 'text')
  .option('--json', 'Alias for --format json')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd) || options.format === 'json';
    const outputDir = options.output;
    const modelIds  = options.models.split(',').map(s => s.trim()).filter(Boolean);

    if (modelIds.length < 2) {
      if (jsonMode) return outputJson({ error: 'At least 2 model IDs required for comparison' }, 1);
      console.error('\n❌ --models requires at least 2 comma-separated model IDs');
      process.exit(1);
    }

    // Load latest run for each model
    const modelData = [];
    const allRuns   = listRunDirs(outputDir);

    for (const modelId of modelIds) {
      // Find most recent run for this model
      let found = null;
      for (const runDir of allRuns) {
        const s = loadRunMetadata(runDir);
        if (s && s.model_id === modelId) {
          found = s;
          break;
        }
      }
      if (!found) {
        if (!jsonMode) {
          console.warn(`  ⚠️  No run found for model: ${modelId} — skipping`);
        }
        continue;
      }
      modelData.push(found);
    }

    if (!modelData.length) {
      if (jsonMode) return outputJson({ error: 'No runs found for any of the specified models' }, 1);
      console.error('\n❌ No benchmark runs found for any of the specified models.');
      console.error('   Run `onxza mpi run --model <id>` for each model first.');
      process.exit(1);
    }

    // Sort
    function getSortScore(summary) {
      const s = summary.scores;
      if (!s) return 0;
      if (options.sort === 'composite') return s.composite?.score || 0;
      if (options.sort === 'cost')      return s.composite?.cost  || 0;
      const typeScore = s.per_type?.[options.sort]?.score;
      return typeScore || 0;
    }
    modelData.sort((a, b) => getSortScore(b) - getSortScore(a));

    if (jsonMode) return outputJson({ comparison: modelData.map(d => ({
      model_id: d.model_id,
      run_id:   d.run_id,
      scores:   d.scores,
    })) });

    // ── Human-readable ───────────────────────────────────────────────────────
    const W    = 63;
    const line = '═'.repeat(W);
    const dash = '─'.repeat(W - 2);

    console.log(`\n${line}`);
    console.log(`  MPI COMPARISON — ${modelData.length} Models | Profile: production`);
    console.log(line);

    console.log(`\n  RANKING (Composite):`);
    console.log(`  ${dash}`);
    console.log(`  #  Model${''.padEnd(24)} MPI    95% CI             FPR Gate`);
    console.log(`  ${dash}`);

    modelData.forEach((d, i) => {
      const s    = d.scores?.composite;
      if (!s) return;
      const ci   = s.confidence_interval || [0, 0];
      const icon = gateIcon(s.fpr_gate);
      const gate = s.fpr_gate_label || s.fpr_gate;
      const mdl  = d.model_id.padEnd(28).slice(0, 28);
      console.log(`  ${i + 1}  ${mdl} ${String(s.score).padStart(5)}  [${ci[0]} – ${ci[1]}]  ${icon} ${gate} (${s.fpr}%)`);
    });

    console.log(`\n  PER-TYPE RANKINGS:`);
    console.log(`  ${dash}`);
    for (const type of scorer.TASK_TYPES) {
      const typeData = modelData
        .map(d => ({ model: d.model_id, score: d.scores?.per_type?.[type]?.score || 0, fpr: d.scores?.per_type?.[type]?.fpr || 0, fpr_gate: d.scores?.per_type?.[type]?.fpr_gate }))
        .sort((a, b) => b.score - a.score);
      const parts = typeData.map((t, i) => {
        const flag = t.fpr < FPR_THRESHOLD ? ' ⚠️ ' : '';
        const short = t.model.split('-').slice(0, 2).join('-');
        return `${i + 1}. ${short} (${t.score}${flag})`;
      }).join('  ');
      console.log(`  ${type.padEnd(10)} ${parts}`);
    }

    // FPR advisories
    const flagged = modelData.filter(d => d.scores?.composite?.fpr < FPR_THRESHOLD);
    if (flagged.length) {
      console.log('');
      for (const d of flagged) {
        const fpr = d.scores?.composite?.fpr;
        const exp = (100 / (100 - fpr)).toFixed(1);
        console.log(`  ⚠️  ${d.model_id} FPR (${fpr}%) below ${FPR_THRESHOLD}% threshold.`);
        console.log(`     Not recommended for unsupervised autonomous deployment.`);
        console.log(`     Expected failure rate: 1 in ${exp} tasks requires human intervention.`);
      }
    }

    console.log(`${line}\n`);
  });

// ---------------------------------------------------------------------------
// onxza mpi validate
// ---------------------------------------------------------------------------

const validateCmd = new Command('validate')
  .description('Validate a task corpus for correctness and completeness')
  .option('--corpus <path>', 'Path to task corpus directory', DEFAULT_CORPUS)
  .option('--json', 'Output validation results as JSON')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    const { tasks, errors: loadErrors } = taskLoader.loadCorpus(options.corpus);

    if (loadErrors.length) {
      if (jsonMode) return outputJson({ valid: false, stage: 'load', errors: loadErrors }, 1);
      console.error('\n❌ Corpus load errors:');
      loadErrors.forEach(e => console.error(`   ${e}`));
      process.exit(1);
    }

    const { valid, errors, warnings } = taskLoader.validateCorpus(tasks);

    if (jsonMode) {
      return outputJson({
        valid,
        corpus:   options.corpus,
        tasks:    tasks.length,
        errors,
        warnings,
        type_distribution: Object.fromEntries(
          scorer.TASK_TYPES.map(t => [t, tasks.filter(tk => tk.task_type === t).length])
        ),
      }, valid ? 0 : 3);
    }

    console.log(`\n📋 Corpus Validation: ${options.corpus}`);
    console.log(`   Tasks loaded: ${tasks.length}`);
    for (const type of scorer.TASK_TYPES) {
      const n = tasks.filter(tk => tk.task_type === type).length;
      console.log(`   ${type.padEnd(12)} ${n} tasks`);
    }

    if (valid) {
      console.log('\n✅ Corpus is valid — ready for benchmarking.\n');
    } else {
      console.log(`\n❌ Corpus validation failed (${errors.length} error${errors.length !== 1 ? 's' : ''}):`);
      errors.forEach(e => console.error(`   ${e}`));
      if (warnings.length) {
        console.warn('\n⚠️  Warnings:');
        warnings.forEach(w => console.warn(`   ${w}`));
      }
      process.exit(3);
    }
  });

// ---------------------------------------------------------------------------
// onxza mpi list-runs
// ---------------------------------------------------------------------------

const listRunsCmd = new Command('list-runs')
  .description('List all completed MPI benchmark runs')
  .option('--output <path>', 'Results directory', DEFAULT_OUTPUT)
  .option('--limit <n>', 'Maximum runs to show', '20')
  .option('--json', 'Output in JSON format')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const limit    = parseInt(options.limit, 10) || 20;
    const dirs     = listRunDirs(options.output).slice(0, limit);

    if (!dirs.length) {
      if (jsonMode) return outputJson({ runs: [] });
      console.log('\n  No benchmark runs found.\n  Run: onxza mpi run --model <model-id>\n');
      return;
    }

    const runs = dirs.map(d => {
      const s = loadRunMetadata(d);
      if (!s) return { run_id: path.basename(d), error: 'summary not found' };
      return {
        run_id:         s.run_id,
        model_id:       s.model_id,
        timestamp:      s.timestamp,
        composite_mpi:  s.scores?.composite?.score,
        fpr:            s.scores?.composite?.fpr,
        fpr_gate:       s.scores?.composite?.fpr_gate,
        tasks:          s.corpus_size,
        dry_run:        s.dry_run || false,
      };
    });

    if (jsonMode) return outputJson({ runs });

    console.log('\n  MPI Benchmark Runs:');
    console.log('  ' + '─'.repeat(61));
    console.log(`  ${'Run ID'.padEnd(28)} ${'Model'.padEnd(22)} MPI   FPR   Gate`);
    console.log('  ' + '─'.repeat(61));
    for (const r of runs) {
      const date  = r.timestamp ? new Date(r.timestamp).toISOString().slice(0, 10) : '?';
      const mpi   = r.composite_mpi !== undefined ? String(r.composite_mpi).padStart(5) : '  N/A';
      const fpr   = r.fpr !== undefined ? `${r.fpr}%`.padStart(5) : '  N/A';
      const gate  = r.fpr_gate === 'PASS' ? '✅' : (r.fpr_gate ? '⚠️ ' : '—');
      const dry   = r.dry_run ? ' [dry]' : '';
      const mdl   = (r.model_id || '').slice(0, 22).padEnd(22);
      console.log(`  ${r.run_id.padEnd(28)} ${mdl} ${mpi}  ${fpr}  ${gate}${dry}`);
    }
    console.log('');
  });

// ---------------------------------------------------------------------------
// Root mpi command group
// ---------------------------------------------------------------------------

const mpiCmd = new Command('mpi')
  .description('MPI (Model Performance Index) benchmark — evaluate and compare AI models')
  .addHelpText('after', `
Examples:
  $ onxza mpi run --model claude-sonnet-4-20250514
  $ onxza mpi run --model gpt-4o --corpus ./my-tasks --profile quality-first
  $ onxza mpi run --model claude-haiku-4 --dry-run
  $ onxza mpi report
  $ onxza mpi report --run mpi-run-20260323-143022
  $ onxza mpi compare --models claude-sonnet-4-20250514,gpt-4o
  $ onxza mpi validate --corpus ./benchmark/tasks
  $ onxza mpi list-runs

FPR Gating:
  Models with FPR < ${FPR_THRESHOLD}% are flagged as not recommended for unsupervised
  autonomous deployment. The MPI score is still reported — the flag is advisory.

API Keys:
  Anthropic models: ANTHROPIC_API_KEY or CLAUDE_API_KEY env var
  OpenAI models:    OPENAI_API_KEY env var
  `);

mpiCmd.addCommand(runCmd);
mpiCmd.addCommand(reportCmd);
mpiCmd.addCommand(compareCmd);
mpiCmd.addCommand(validateCmd);
mpiCmd.addCommand(listRunsCmd);

module.exports = mpiCmd;

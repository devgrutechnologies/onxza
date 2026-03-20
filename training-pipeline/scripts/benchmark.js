#!/usr/bin/env node
/**
 * ONXZA-LLM Benchmark — Evaluate routing accuracy on holdout set.
 *
 * Builds holdout set from training data, calls the local Ollama model,
 * computes accuracy by task type and overall.
 *
 * Usage:
 *   node benchmark.js                     # Evaluate default (mini)
 *   node benchmark.js --variant standard  # Evaluate standard
 *   node benchmark.js --build-holdout     # Rebuild holdout set only
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(__dirname, '../output');
const TRAINING_DATA = path.join(OUTPUT_DIR, 'training-data.jsonl');
const HOLDOUT_PATH = path.join(OUTPUT_DIR, 'holdout-set.jsonl');
const BENCHMARK_RESULTS = path.join(OUTPUT_DIR, 'benchmark-results.json');

const HOLDOUT_FRACTION = 0.2; // 20% of data reserved for holdout
const ACCEPTANCE_THRESHOLD = 0.60; // >60% required for public release

const VARIANT_TAGS = {
  mini: 'onxza-llm:mini',
  standard: 'onxza-llm:standard',
  pro: 'onxza-llm:pro',
};

/**
 * Build holdout set: 20% of training data, stratified by source.
 * Records in holdout are EXCLUDED from training (caller's responsibility).
 */
function buildHoldoutSet() {
  if (!fs.existsSync(TRAINING_DATA)) {
    console.error('[benchmark] ERROR: training-data.jsonl not found');
    process.exit(1);
  }

  const lines = fs.readFileSync(TRAINING_DATA, 'utf8').trim().split('\n').filter(Boolean);
  const records = lines.map(l => JSON.parse(l));

  // Group by source
  const bySource = { routing: [], fvp: [], shared_learning: [] };
  for (const r of records) {
    if (bySource[r.source]) bySource[r.source].push(r);
  }

  // Shuffle each group deterministically (by id hash for reproducibility)
  function deterministicShuffle(arr) {
    return [...arr].sort((a, b) => {
      const ha = crypto.createHash('md5').update(a.id).digest('hex');
      const hb = crypto.createHash('md5').update(b.id).digest('hex');
      return ha.localeCompare(hb);
    });
  }

  const holdout = [];
  for (const [source, records] of Object.entries(bySource)) {
    const shuffled = deterministicShuffle(records);
    const holdoutCount = Math.max(1, Math.floor(shuffled.length * HOLDOUT_FRACTION));
    holdout.push(...shuffled.slice(0, holdoutCount));
  }

  fs.writeFileSync(
    HOLDOUT_PATH,
    holdout.map(r => JSON.stringify(r)).join('\n') + '\n',
    'utf8'
  );

  console.log(`[benchmark] Holdout set built: ${holdout.length} records (${Math.round(holdout.length / records.length * 100)}% of dataset)`);
  return holdout;
}

/**
 * Call Ollama with a prompt and return the response text.
 */
function callOllama(ollamaTag, prompt) {
  try {
    // Use ollama run with --nowordwrap for clean output
    const escaped = prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const result = execSync(
      `echo "${escaped}" | ollama run ${ollamaTag} --nowordwrap 2>/dev/null`,
      { timeout: 30000, encoding: 'utf8' }
    );
    return result.trim();
  } catch (err) {
    return null;
  }
}

/**
 * Extract routing decision tier from model output.
 * Looks for: local_llm, mid_tier/grok, claude/cloud
 */
function extractRoutingTier(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower.includes('claude') || lower.includes('cloud') || lower.includes('accuracy-critical')) return 'cloud';
  if (lower.includes('grok') || lower.includes('mid-tier') || lower.includes('mid tier')) return 'mid_tier';
  if (lower.includes('local') || lower.includes('9b') || lower.includes('27b') || lower.includes('tier 1')) return 'local';
  return null;
}

/**
 * Extract expected routing tier from ground truth record.
 */
function getExpectedTier(record) {
  const decision = (record.output.decision || '').toLowerCase();
  if (decision.includes('claude') || decision.includes('cloud') || decision.includes('accuracy-critical')) return 'cloud';
  if (decision.includes('grok') || decision.includes('mid-tier') || decision.includes('mid tier')) return 'mid_tier';
  if (decision.includes('local') || decision.includes('9b') || decision.includes('27b') || decision.includes('tier 1')) return 'local';
  return 'unknown';
}

/**
 * Run benchmark evaluation for a variant.
 */
function runBenchmark(variant) {
  const ollamaTag = VARIANT_TAGS[variant];
  if (!ollamaTag) {
    console.error(`[benchmark] Unknown variant: ${variant}`);
    process.exit(1);
  }

  // Check Ollama is available
  try {
    execSync('ollama --version', { stdio: 'pipe' });
  } catch {
    console.error('[benchmark] ERROR: Ollama not installed. Install Ollama first.');
    process.exit(1);
  }

  // Check model is installed
  try {
    const list = execSync('ollama list', { stdio: 'pipe' }).toString();
    if (!list.includes('onxza-llm')) {
      console.error(`[benchmark] ERROR: ${ollamaTag} not installed. Run: onxza pull onxza-llm:${variant}`);
      process.exit(1);
    }
  } catch {
    console.error('[benchmark] ERROR: Could not list Ollama models.');
    process.exit(1);
  }

  // Build or load holdout set
  if (!fs.existsSync(HOLDOUT_PATH)) {
    buildHoldoutSet();
  }
  const holdoutLines = fs.readFileSync(HOLDOUT_PATH, 'utf8').trim().split('\n').filter(Boolean);
  const holdout = holdoutLines.map(l => JSON.parse(l));

  // Filter to routing source only for routing accuracy metric
  const routingRecords = holdout.filter(r => r.source === 'routing');
  if (routingRecords.length === 0) {
    console.error('[benchmark] ERROR: No routing records in holdout set. Need more training data.');
    process.exit(1);
  }

  console.log(`\n[benchmark] Evaluating ${ollamaTag} on ${holdout.length} holdout records...`);
  console.log(`  Routing records: ${routingRecords.length}`);
  console.log('');

  const results = {
    variant,
    ollama_tag: ollamaTag,
    evaluated_at: new Date().toISOString(),
    holdout_size: holdout.length,
    routing_accuracy: null,
    fvp_accuracy: null,
    overall_accuracy: null,
    meets_release_threshold: false,
    by_task_type: {},
    details: [],
  };

  // Evaluate routing records
  let routingCorrect = 0;
  for (let i = 0; i < routingRecords.length; i++) {
    const record = routingRecords[i];
    process.stdout.write(`\r  Routing: ${i + 1}/${routingRecords.length}`);

    const prompt = `${record.input.instruction}\n\n${record.input.context}`;
    const response = callOllama(ollamaTag, prompt);

    const predicted = extractRoutingTier(response);
    const expected = getExpectedTier(record);
    const correct = predicted === expected;

    if (correct) routingCorrect++;

    results.details.push({
      id: record.id,
      source: record.source,
      task_type: record.input.task_type,
      expected,
      predicted,
      correct,
    });

    // By task type
    const tt = record.input.task_type;
    if (!results.by_task_type[tt]) results.by_task_type[tt] = { correct: 0, total: 0 };
    results.by_task_type[tt].total++;
    if (correct) results.by_task_type[tt].correct++;
  }
  process.stdout.write('\n');

  results.routing_accuracy = routingRecords.length > 0
    ? Math.round((routingCorrect / routingRecords.length) * 100) / 100
    : null;

  // Overall (routing is primary metric for v0.1)
  results.overall_accuracy = results.routing_accuracy;
  results.meets_release_threshold = (results.overall_accuracy || 0) >= ACCEPTANCE_THRESHOLD;

  // Save results
  fs.writeFileSync(BENCHMARK_RESULTS, JSON.stringify(results, null, 2), 'utf8');

  // Print summary
  console.log('\n=== Benchmark Results ===');
  console.log(`Variant:           ${variant}`);
  console.log(`Holdout records:   ${holdout.length}`);
  console.log(`Routing accuracy:  ${results.routing_accuracy !== null ? `${Math.round(results.routing_accuracy * 100)}%` : 'N/A'}`);
  console.log(`Overall accuracy:  ${results.overall_accuracy !== null ? `${Math.round(results.overall_accuracy * 100)}%` : 'N/A'}`);
  console.log(`Release threshold: ${Math.round(ACCEPTANCE_THRESHOLD * 100)}%`);
  console.log(`Meets threshold:   ${results.meets_release_threshold ? '✅ YES — ready for HuggingFace publish' : '❌ NO — more training data needed'}`);

  if (Object.keys(results.by_task_type).length > 0) {
    console.log('\nBy task type:');
    for (const [tt, stats] of Object.entries(results.by_task_type)) {
      const acc = Math.round((stats.correct / stats.total) * 100);
      console.log(`  ${tt.padEnd(20)} ${acc}% (${stats.correct}/${stats.total})`);
    }
  }
  console.log('=========================\n');

  return results;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const variantIdx = args.indexOf('--variant');
const variant = variantIdx >= 0 ? args[variantIdx + 1] : 'mini';

if (args.includes('--build-holdout')) {
  buildHoldoutSet();
} else {
  runBenchmark(variant);
}

module.exports = { buildHoldoutSet, runBenchmark, extractRoutingTier };

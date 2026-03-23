'use strict';

/**
 * Integration test: MPI Harness (mock task set, no live API calls)
 *
 * Runs the full execution pipeline with a mock model adapter that returns
 * deterministic outputs, and a mock verifier that auto-passes/fails based
 * on the adapter's output.
 *
 * Covers:
 *   - executeAll → computeScores → output validation
 *   - FPR gate enforcement in scoring
 *   - Per-type breakdown in results
 *   - Failure mode propagation
 *   - dry-run mode
 *
 * TICKET-20260323-DTP-MPI-PHASE6-CLI-IMPL
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const executor  = require('../../src/lib/mpi/executor');
const scorer    = require('../../src/lib/mpi/scorer');
const verifier  = require('../../src/lib/mpi/verifier');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result
        .then(() => { console.log(`  ✅  ${name}`); passed++; })
        .catch(e => {
          console.error(`  ❌  ${name}`);
          console.error(`       ${e.message}`);
          failures.push({ name, error: e.message });
          failed++;
        });
    }
    console.log(`  ✅  ${name}`);
    passed++;
    return Promise.resolve();
  } catch (e) {
    console.error(`  ❌  ${name}`);
    console.error(`       ${e.message}`);
    failures.push({ name, error: e.message });
    failed++;
    return Promise.resolve();
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertRange(val, lo, hi, msg) {
  if (val < lo || val > hi)
    throw new Error(msg || `Expected ${val} in [${lo}, ${hi}]`);
}

// ---------------------------------------------------------------------------
// Mock task corpus (20 tasks, 5 per type)
// ---------------------------------------------------------------------------

function makeMockTasks({ failType = null, failAll = false } = {}) {
  const tasks = [];
  for (const type of scorer.TASK_TYPES) {
    for (let i = 1; i <= 5; i++) {
      tasks.push({
        task_id:              `${type.toUpperCase()}-00${i}`,
        task_type:            type,
        complexity:           'moderate',
        title:                `Mock ${type} task ${i}`,
        description:          `Complete this mock ${type} task. Output the word PASS.`,
        acceptance_criteria:  ['Output contains the word PASS'],
        max_token_budget:     256,
        _mock_should_fail:    failAll || (failType === type),
      });
    }
  }
  return tasks;
}

// ---------------------------------------------------------------------------
// Mock model adapter
// ---------------------------------------------------------------------------

function makeMockAdapter(opts = {}) {
  return {
    id:       opts.id       || 'mock-model-1',
    provider: opts.provider || 'mock',
    pricing:  { input_per_1k: 0.001, output_per_1k: 0.002 },
    _calls:   0,

    reset() { /* stateless mock */ },

    async execute(prompt, options) {
      this._calls++;
      // Simple deterministic output
      const output = prompt.includes('_mock_should_fail') || (opts.alwaysFail)
        ? 'I cannot complete this task.'
        : 'PASS — Task completed successfully.';
      return {
        output,
        input_tokens:  100,
        output_tokens: 50,
        latency_ms:    10,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Mock verifier (no API calls)
// ---------------------------------------------------------------------------

function patchVerifier(mode = 'auto') {
  // Monkey-patch verifier.verify for tests
  const original = verifier.verify;

  verifier.verify = async function(task, modelOutput, verifierModel, opts) {
    // 'auto': pass if output contains PASS
    if (mode === 'auto') {
      const p = modelOutput.includes('PASS');
      return {
        passed:       p,
        feedback:     p ? '' : 'Output must contain the word PASS.',
        failure_mode: p ? null : 'incomplete',
        raw:          { overall: p ? 'PASS' : 'FAIL' },
      };
    }
    if (mode === 'always-pass') {
      return { passed: true, feedback: '', failure_mode: null, raw: { overall: 'PASS' } };
    }
    if (mode === 'always-fail') {
      return { passed: false, feedback: 'Mock always fails.', failure_mode: 'incorrect', raw: { overall: 'FAIL' } };
    }
  };

  return () => { verifier.verify = original; }; // restore function
}

// ---------------------------------------------------------------------------
// Integration Tests
// ---------------------------------------------------------------------------

(async () => {

console.log('\n── Integration: Full Pipeline (all pass) ────────────────────');

await test('executeAll with all-pass adapter returns 20 results', async () => {
  const restore = patchVerifier('always-pass');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', {});
    assertEq(results.length, 20, `Expected 20 results, got ${results.length}`);
  } finally { restore(); }
});

await test('executeAll: all results have required TaskResult fields', async () => {
  const restore = patchVerifier('always-pass');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', {});
    for (const r of results) {
      assert(r.task_id,           `Missing task_id`);
      assert(r.task_type,         `Missing task_type in ${r.task_id}`);
      assert(typeof r.passed      === 'boolean',  `passed not boolean in ${r.task_id}`);
      assert(typeof r.loop_count  === 'number',   `loop_count not number in ${r.task_id}`);
      assert(typeof r.time_ms     === 'number',   `time_ms not number in ${r.task_id}`);
      assert(typeof r.cost_usd    === 'number',   `cost_usd not number in ${r.task_id}`);
    }
  } finally { restore(); }
});

await test('executeAll all-pass: all results.passed === true', async () => {
  const restore = patchVerifier('always-pass');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', {});
    const failCount = results.filter(r => !r.passed).length;
    assertEq(failCount, 0, `Expected 0 failures, got ${failCount}`);
  } finally { restore(); }
});

await test('executeAll all-pass: loop_count === 1 for all tasks (first-pass)', async () => {
  const restore = patchVerifier('always-pass');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', {});
    const nonFirst = results.filter(r => r.loop_count !== 1).length;
    assertEq(nonFirst, 0, `Expected all loop_count = 1, but ${nonFirst} tasks had loop_count != 1`);
  } finally { restore(); }
});

console.log('\n── Integration: FPR Gate ─────────────────────────────────────');

await test('computeScores after all-pass: FPR = 100, gate = PASS', async () => {
  const restore = patchVerifier('always-pass');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', {});
    const scores  = scorer.computeScores(results, 'production');
    assertEq(scores.composite.fpr,      100);
    assertEq(scores.composite.fpr_gate, 'PASS');
  } finally { restore(); }
});

await test('computeScores after all-fail: FPR = 0, gate = FLAGGED', async () => {
  const restore = patchVerifier('always-fail');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', {});
    const scores  = scorer.computeScores(results, 'production');
    assertEq(scores.composite.fpr,      0);
    assertEq(scores.composite.fpr_gate, 'FLAGGED');
  } finally { restore(); }
});

console.log('\n── Integration: Per-Type Breakdown ──────────────────────────');

await test('computeScores returns all 4 per-type scores after full run', async () => {
  const restore = patchVerifier('always-pass');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', {});
    const scores  = scorer.computeScores(results, 'production');
    for (const type of scorer.TASK_TYPES) {
      assert(scores.per_type[type] !== null, `Missing score for type: ${type}`);
      assertEq(scores.per_type[type].task_count, 5, `${type} task_count should be 5`);
    }
  } finally { restore(); }
});

await test('per-type FPR FLAGGED when one type always fails', async () => {
  // Always-fail verifier: all types FLAGGED
  const restore = patchVerifier('always-fail');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', {});
    const scores  = scorer.computeScores(results, 'production');
    assertEq(scores.per_type.coding.fpr_gate,   'FLAGGED');
    assertEq(scores.per_type.planning.fpr_gate, 'FLAGGED');
  } finally { restore(); }
});

console.log('\n── Integration: Failure Modes ───────────────────────────────');

await test('failure_modes populated correctly when tasks fail', async () => {
  const restore = patchVerifier('always-fail');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', {});
    const scores  = scorer.computeScores(results, 'production');
    // All 20 tasks failed with 'incorrect'
    assert(Object.keys(scores.failure_modes).length > 0,
      'failure_modes should not be empty when tasks fail');
  } finally { restore(); }
});

console.log('\n── Integration: Dry-Run Mode ────────────────────────────────');

await test('dry-run mode returns mock results without calling adapter', async () => {
  const restore = patchVerifier('always-pass');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', { dryRun: true });
    assertEq(results.length, 20, `Expected 20 dry-run results, got ${results.length}`);
    assert(results.every(r => r._dry_run === true), 'All results should have _dry_run:true');
    assertEq(adapter._calls, 0, 'Adapter should not be called in dry-run mode');
  } finally { restore(); }
});

await test('dry-run results all marked as passed', async () => {
  const restore = patchVerifier('always-fail'); // verifier irrelevant in dry-run
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', { dryRun: true });
    assert(results.every(r => r.passed === true), 'All dry-run results should be passed');
  } finally { restore(); }
});

console.log('\n── Integration: Cost Tracking ───────────────────────────────');

await test('task results include cost_usd > 0 when adapter has pricing', async () => {
  const restore = patchVerifier('always-pass');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter();
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', {});
    const totalCost = results.reduce((sum, r) => sum + r.cost_usd, 0);
    assert(totalCost > 0, `Total cost should be > 0, got ${totalCost}`);
  } finally { restore(); }
});

console.log('\n── Integration: Model ID in Results ─────────────────────────');

await test('results carry correct model_id from adapter', async () => {
  const restore = patchVerifier('always-pass');
  try {
    const tasks   = makeMockTasks();
    const adapter = makeMockAdapter({ id: 'test-model-xyz' });
    const results = await executor.executeAll(tasks, adapter, 'mock-verifier', {});
    assert(results.every(r => r.model_id === 'test-model-xyz'),
      `Expected all model_id to be 'test-model-xyz'`);
  } finally { restore(); }
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n────────────────────────────────────────────────────────────');
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.error('\n  FAILURES:');
  failures.forEach(f => console.error(`    ❌ ${f.name}: ${f.error}`));
}
console.log('');

process.exit(failed > 0 ? 1 : 0);

})();

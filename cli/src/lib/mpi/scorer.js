'use strict';

/**
 * MPI Scoring Engine — per-type + composite scoring with FPR gating.
 *
 * Implements MPI-HARNESS-SPEC-v0.1 §7 (Scoring Engine).
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const TASK_TYPES   = ['coding', 'reasoning', 'writing', 'planning'];
const FPR_THRESHOLD = 70;

// Weight profiles (W1=FPR, W2=Efficiency, W3=Speed, W4=Cost, W5=Versatility)
const WEIGHT_PROFILES = {
  production:    [0.35, 0.25, 0.20, 0.15, 0.05],
  research:      [0.25, 0.15, 0.10, 0.05, 0.45],
  'quality-first': [0.50, 0.20, 0.10, 0.10, 0.10],
};

function parseCustomProfile(str) {
  // Format: "custom:0.4,0.2,0.2,0.1,0.1"
  const parts = str.replace(/^custom:/, '').split(',').map(Number);
  if (parts.length !== 5 || parts.some(isNaN)) {
    throw new Error(`Invalid custom profile format. Use: custom:w1,w2,w3,w4,w5 (5 numbers summing to 1)`);
  }
  const sum = parts.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 0.01) {
    throw new Error(`Custom profile weights must sum to 1.0 (got ${sum.toFixed(3)})`);
  }
  return parts;
}

function getWeights(profile) {
  if (!profile) return WEIGHT_PROFILES.production;
  if (profile.startsWith('custom:')) return parseCustomProfile(profile);
  const w = WEIGHT_PROFILES[profile];
  if (!w) throw new Error(`Unknown profile "${profile}". Valid: production, research, quality-first, custom:...`);
  return w;
}

// ---------------------------------------------------------------------------
// Metric computation
// ---------------------------------------------------------------------------

/**
 * First-Pass Rate (FPR) — % of tasks passed on first attempt.
 * loop_count === 1 = first pass success.
 */
function computeFPR(results) {
  if (!results.length) return 0;
  const fp = results.filter(r => r.passed && r.loop_count === 1).length;
  return (fp / results.length) * 100;
}

/**
 * Efficiency — % tasks eventually passed (across all FVP iterations).
 */
function computeEfficiency(results) {
  if (!results.length) return 0;
  const passed = results.filter(r => r.passed).length;
  return (passed / results.length) * 100;
}

/**
 * Speed — normalized: 100 = fastest, 0 = slowest.
 * Computed against single-model run: all tasks compared to median.
 * For single-model scoring: uses inverse of average ms, normalized to 0-100.
 * In a comparison run, caller normalizes cross-model.
 */
function computeSpeed(results) {
  if (!results.length) return 50; // neutral if no data
  const times = results.map(r => r.time_ms).filter(t => t > 0);
  if (!times.length) return 50;
  const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
  // Cap at 300s per task as baseline slow; faster = higher score
  const maxMs = 300000;
  return Math.max(0, Math.min(100, (1 - avgMs / maxMs) * 100));
}

/**
 * Cost efficiency — normalized: lower cost = higher score.
 * Baseline: $0.50 per task = score 0, $0.00 = score 100.
 */
function computeCostScore(results) {
  if (!results.length) return 50;
  const totalCost = results.reduce((a, r) => a + (r.cost_usd || 0), 0);
  const avgCost   = totalCost / results.length;
  const maxCost   = 0.5; // $0.50/task = floor
  return Math.max(0, Math.min(100, (1 - avgCost / maxCost) * 100));
}

/**
 * Versatility — % of task TYPES where the model passed at least half the tasks.
 * High versatility = good across all four types.
 */
function computeVersatility(results) {
  let capable = 0;
  for (const type of TASK_TYPES) {
    const typeResults = results.filter(r => r.task_type === type);
    if (!typeResults.length) continue;
    const passRate = typeResults.filter(r => r.passed).length / typeResults.length;
    if (passRate >= 0.5) capable++;
  }
  const covered = TASK_TYPES.filter(t => results.some(r => r.task_type === t)).length;
  if (!covered) return 0;
  return (capable / covered) * 100;
}

// ---------------------------------------------------------------------------
// Confidence interval (bootstrap)
// ---------------------------------------------------------------------------

function resampleWithReplacement(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    out.push(arr[Math.floor(Math.random() * arr.length)]);
  }
  return out;
}

function computeMPIFromResults(results, weights) {
  const fpr  = computeFPR(results);
  const eff  = computeEfficiency(results);
  const spd  = computeSpeed(results);
  const cost = computeCostScore(results);
  const vers = computeVersatility(results);
  return fpr * weights[0] + eff * weights[1] + spd * weights[2] + cost * weights[3] + vers * weights[4];
}

function bootstrapCI(results, weights, iterations = 1000) {
  if (results.length < 2) {
    const score = computeMPIFromResults(results, weights);
    return [score, score];
  }
  const scores = [];
  for (let i = 0; i < iterations; i++) {
    const sample = resampleWithReplacement(results);
    scores.push(computeMPIFromResults(sample, weights));
  }
  scores.sort((a, b) => a - b);
  const lo = scores[Math.floor(iterations * 0.025)];
  const hi = scores[Math.floor(iterations * 0.975)];
  return [Math.round(lo * 10) / 10, Math.round(hi * 10) / 10];
}

// ---------------------------------------------------------------------------
// FPR Gate
// ---------------------------------------------------------------------------

function fprGateStatus(fpr) {
  if (fpr >= FPR_THRESHOLD) return 'PASS';
  if (fpr >= 50)             return 'FLAGGED';
  return 'FLAGGED';
}

function fprGateLabel(fpr) {
  if (fpr >= FPR_THRESHOLD) return 'Autonomous Ready';
  if (fpr >= 50)             return 'Requires Human Oversight';
  return 'Not Recommended';
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

/**
 * Compute per-type + composite MPI scores for a set of task results.
 *
 * @param {object[]} results - Array of TaskResult objects from executor
 * @param {string}   profile - Weight profile name (production/research/quality-first/custom:...)
 * @returns {object} PerTypeScores
 */
function computeScores(results, profile = 'production') {
  const weights = getWeights(profile);

  function scoreSet(subset, label) {
    if (!subset.length) return null;

    const fpr        = computeFPR(subset);
    const efficiency = computeEfficiency(subset);
    const speed      = computeSpeed(subset);
    const cost       = computeCostScore(subset);
    const versatility= computeVersatility(subset);

    const score = fpr * weights[0] + efficiency * weights[1] + speed * weights[2] +
                  cost * weights[3] + versatility * weights[4];

    const ci = bootstrapCI(subset, weights, 500);

    return {
      score:             Math.round(score * 10) / 10,
      confidence_interval: ci,
      fpr:               Math.round(fpr * 10) / 10,
      efficiency:        Math.round(efficiency * 10) / 10,
      speed:             Math.round(speed * 10) / 10,
      cost:              Math.round(cost * 10) / 10,
      versatility:       Math.round(versatility * 10) / 10,
      fpr_gate:          fprGateStatus(fpr),
      fpr_gate_label:    fprGateLabel(fpr),
      task_count:        subset.length,
    };
  }

  const per_type = {};
  for (const type of TASK_TYPES) {
    const subset = results.filter(r => r.task_type === type);
    per_type[type] = scoreSet(subset, type);
  }

  const composite = scoreSet(results, 'composite');

  // Failure mode distribution
  const failure_modes = {};
  for (const r of results.filter(r => !r.passed)) {
    const fm = r.failure_mode || 'unknown';
    failure_modes[fm] = (failure_modes[fm] || 0) + 1;
  }

  return {
    composite,
    per_type,
    failure_modes,
    model_id:       results[0]?.model_id || 'unknown',
    weight_profile: profile,
    task_count:     results.length,
    weights: {
      fpr:         weights[0],
      efficiency:  weights[1],
      speed:       weights[2],
      cost:        weights[3],
      versatility: weights[4],
    },
  };
}

module.exports = {
  computeScores,
  computeFPR,
  computeEfficiency,
  computeSpeed,
  computeCostScore,
  computeVersatility,
  bootstrapCI,
  getWeights,
  FPR_THRESHOLD,
  TASK_TYPES,
};

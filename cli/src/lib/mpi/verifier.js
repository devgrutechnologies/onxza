'use strict';

/**
 * MPI FVP Verifier — evaluates model output against task acceptance criteria.
 *
 * Implements MPI-HARNESS-SPEC-v0.1 §6 (Verifier Protocol).
 * Default verifier: claude-sonnet-4-20250514
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const adapters = require('./adapters');

const DEFAULT_VERIFIER = 'claude-sonnet-4-20250514';

const VERIFIER_SYSTEM_PROMPT = `You are an MPI benchmark verifier. Your job is to evaluate whether a model's output meets ALL acceptance criteria for a given task. You are precise, consistent, and strictly evidence-based. You do not give partial credit — each criterion is either PASS or FAIL based on what is present in the output.`;

/**
 * Build the verifier prompt for a task + model output.
 */
function buildVerifierPrompt(task, modelOutput) {
  const criteria = Array.isArray(task.acceptance_criteria)
    ? task.acceptance_criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')
    : String(task.acceptance_criteria || '');

  let rubricSection = '';
  if (task.verification_rubric) {
    const r = task.verification_rubric;
    const parts = [];
    if (r.must_contain)       parts.push(`Must contain: ${JSON.stringify(r.must_contain)}`);
    if (r.must_not_contain)   parts.push(`Must NOT contain: ${JSON.stringify(r.must_not_contain)}`);
    if (r.structural_checks)  parts.push(`Structural checks:\n${(r.structural_checks || []).map(c => `  - ${c}`).join('\n')}`);
    if (parts.length) rubricSection = `\n## Additional Verification Rules\n${parts.join('\n')}`;
  }

  return `## Task
Title: ${task.title}
Type: ${task.task_type}
Description: ${task.description || ''}

## Acceptance Criteria
${criteria}
${rubricSection}

## Model Output
${modelOutput}

## Your Evaluation
For EACH acceptance criterion, state:
1. Criterion text
2. PASS or FAIL
3. Brief justification (1-2 sentences)

Then provide:
- Overall: PASS or FAIL
- If FAIL: Specific, actionable feedback for the model to fix the output
- Failure mode (if FAIL): one of [incomplete, incorrect, off_topic, format_error, quality_insufficient, timeout]

Respond ONLY in JSON format:
{
  "criteria_results": [
    { "criterion": "...", "result": "PASS|FAIL", "justification": "..." }
  ],
  "overall": "PASS|FAIL",
  "feedback": "...",
  "failure_mode": "..."
}`;
}

/**
 * Parse verifier JSON response. Falls back to regex extraction if wrapper text present.
 */
function parseVerifierResponse(text) {
  // Try direct parse
  try {
    return JSON.parse(text.trim());
  } catch (_) {}

  // Extract JSON block
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  // Fallback: extract overall field
  const overallMatch = text.match(/"overall"\s*:\s*"(PASS|FAIL)"/i);
  if (overallMatch) {
    return {
      criteria_results: [],
      overall:          overallMatch[1].toUpperCase(),
      feedback:         'Verifier returned malformed JSON — extracted overall verdict only.',
      failure_mode:     overallMatch[1] === 'FAIL' ? 'format_error' : null,
    };
  }

  // Cannot parse — treat as unverified
  return {
    criteria_results: [],
    overall:          'FAIL',
    feedback:         'Verifier returned unreadable response. Marking as unverified failure.',
    failure_mode:     'format_error',
    _parse_error:     true,
  };
}

/**
 * Run FVP verification for a single task + model output.
 *
 * @param {object} task          - Task YAML object
 * @param {string} modelOutput   - The model's response text
 * @param {string} verifierModel - Model ID for verifier (default: claude-sonnet-4-20250514)
 * @param {object} opts          - { apiKey }
 * @returns {{ passed: boolean, feedback: string, failure_mode: string, raw: object }}
 */
async function verify(task, modelOutput, verifierModel, opts = {}) {
  const vModelId = verifierModel || DEFAULT_VERIFIER;
  const adapter  = adapters.createAdapter(vModelId, opts);

  const prompt = buildVerifierPrompt(task, modelOutput);

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await adapter.execute(prompt, {
        system_prompt: VERIFIER_SYSTEM_PROMPT,
        max_tokens:    2048,
      });

      const parsed = parseVerifierResponse(result.output);
      return {
        passed:       parsed.overall === 'PASS',
        feedback:     parsed.feedback || '',
        failure_mode: parsed.failure_mode || null,
        raw:          parsed,
      };
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  // Verifier API exhausted — mark as UNVERIFIED
  return {
    passed:       false,
    feedback:     `Verifier unavailable after 3 attempts: ${lastErr?.message}`,
    failure_mode: 'api_error',
    raw:          null,
    _unverified:  true,
  };
}

module.exports = { verify, DEFAULT_VERIFIER };

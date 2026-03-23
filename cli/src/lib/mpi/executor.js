'use strict';

/**
 * MPI Execution Engine — runs tasks against a model via the FVP loop.
 *
 * Implements MPI-HARNESS-SPEC-v0.1 §5 (Execution Engine).
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const adapters = require('./adapters');
const verifier = require('./verifier');

const TASK_SYSTEM_PROMPT = `You are a capable AI agent completing professional agentic tasks. Complete each task fully, accurately, and according to all stated requirements. Output only the deliverable requested — do not add meta-commentary.`;

const MAX_FVP_ITERATIONS = 3;

/**
 * Build the initial user prompt for a task.
 */
function buildTaskPrompt(task, priorFeedback = null) {
  let prompt = `# Task: ${task.title}\n\n${task.description || ''}\n`;

  if (Array.isArray(task.acceptance_criteria) && task.acceptance_criteria.length) {
    prompt += '\n## Acceptance Criteria\n';
    task.acceptance_criteria.forEach((c, i) => { prompt += `${i + 1}. ${c}\n`; });
  }

  if (task.context_files && Array.isArray(task.context_files)) {
    for (const cf of task.context_files) {
      prompt += `\n## Context: ${cf.path}\n\`\`\`\n${cf.content}\n\`\`\`\n`;
    }
  }

  if (priorFeedback) {
    prompt += `\n## Previous Attempt Feedback\nYour prior output did not pass verification. Please address:\n${priorFeedback}\n`;
  }

  return prompt;
}

/**
 * Execute a single task against a model adapter, with FVP verification loop.
 * Returns a TaskResult object.
 *
 * @param {object} task          - Validated task YAML
 * @param {object} adapter       - Model adapter instance
 * @param {string} verifierModel - Verifier model ID
 * @param {object} opts          - { apiKey, verbose, onProgress }
 */
async function executeTask(task, adapter, verifierModel, opts = {}) {
  const { computeCost } = require('./adapters');
  const { verbose, onProgress } = opts;

  adapter.reset();

  let passed     = false;
  let loopCount  = 0;
  let totalInput  = 0;
  let totalOutput = 0;
  let totalCost   = 0;
  let totalMs     = 0;
  let failureMode = null;
  const feedbackLog = [];

  let priorFeedback = null;

  const wallStart = Date.now();

  for (let iteration = 1; iteration <= MAX_FVP_ITERATIONS; iteration++) {
    loopCount = iteration;

    if (verbose && onProgress) {
      onProgress(`  → Attempt ${iteration}/${MAX_FVP_ITERATIONS}: ${task.task_id}`);
    }

    // Build prompt with feedback from prior iterations
    const prompt = buildTaskPrompt(task, priorFeedback);

    let modelResult;
    try {
      const t0     = Date.now();
      modelResult  = await adapter.execute(prompt, {
        system_prompt: TASK_SYSTEM_PROMPT,
        max_tokens:    task.max_token_budget || 8192,
        temperature:   0,
      });
      const elapsedMs = Date.now() - t0;

      totalInput  += modelResult.input_tokens;
      totalOutput += modelResult.output_tokens;
      totalCost   += computeCost(adapter, modelResult.input_tokens, modelResult.output_tokens);
      totalMs     += elapsedMs;

    } catch (e) {
      // API error — retry handled inside adapter; if we're here, all retries failed
      failureMode = 'api_error';
      if (verbose && onProgress) onProgress(`  ✗ API error: ${e.message}`);
      break;
    }

    // FVP verification
    let verifyResult;
    try {
      verifyResult = await verifier.verify(task, modelResult.output, verifierModel, { apiKey: opts.apiKey });
    } catch (e) {
      // Verifier error — treat as unverified failure
      verifyResult = {
        passed:       false,
        feedback:     `Verifier error: ${e.message}`,
        failure_mode: 'api_error',
      };
    }

    if (verifyResult.feedback) {
      feedbackLog.push(verifyResult.feedback);
    }

    if (verifyResult.passed) {
      passed = true;
      if (verbose && onProgress) onProgress(`  ✓ PASS on attempt ${iteration}`);
      break;
    } else {
      failureMode   = verifyResult.failure_mode || 'incorrect';
      priorFeedback = verifyResult.feedback;
      if (verbose && onProgress) {
        onProgress(`  ✗ FAIL attempt ${iteration}: ${verifyResult.failure_mode || 'incorrect'}`);
      }
    }
  }

  totalMs = Date.now() - wallStart;

  return {
    task_id:            task.task_id,
    task_type:          task.task_type,
    complexity:         task.complexity || 'moderate',
    model_id:           adapter.id,
    passed,
    loop_count:         loopCount,
    time_ms:            totalMs,
    input_tokens:       totalInput,
    output_tokens:      totalOutput,
    cost_usd:           totalCost,
    failure_mode:       passed ? null : (failureMode || 'incorrect'),
    verifier_feedback:  feedbackLog,
  };
}

/**
 * Execute all tasks in a corpus against a model.
 * Returns an array of TaskResult objects.
 *
 * @param {object[]} tasks        - Validated tasks from loadCorpus()
 * @param {object} adapter        - Model adapter instance
 * @param {string} verifierModel  - Verifier model ID
 * @param {object} opts           - { apiKey, verbose, onProgress, dryRun }
 */
async function executeAll(tasks, adapter, verifierModel, opts = {}) {
  const { verbose, onProgress, dryRun } = opts;
  const results = [];

  if (dryRun) {
    // Validate setup, return mock results
    return tasks.map(task => ({
      task_id:      task.task_id,
      task_type:    task.task_type,
      complexity:   task.complexity || 'moderate',
      model_id:     adapter.id,
      passed:       true,
      loop_count:   1,
      time_ms:      0,
      input_tokens: 0,
      output_tokens:0,
      cost_usd:     0,
      failure_mode: null,
      _dry_run:     true,
    }));
  }

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (verbose && onProgress) {
      onProgress(`\n[${i + 1}/${tasks.length}] ${task.task_id} (${task.task_type}, ${task.complexity || 'moderate'})`);
    }

    const result = await executeTask(task, adapter, verifierModel, opts);
    results.push(result);
  }

  return results;
}

module.exports = { executeAll, executeTask };

'use strict';

/**
 * CONFIRM/CANCEL Protocol
 *
 * Implements the interactive confirmation flow for irreversible actions
 * per ARCHITECTURE.md §11.2. No irreversible action proceeds without
 * explicit CONFIRM. Anything else — including typos — cancels.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const readline = require('readline');
const { createCheckpoint } = require('./checkpoint');
const { logPreExecution, logPostExecution } = require('./audit-hook');
const { classify } = require('./irreversibility');

/**
 * Present the CONFIRM/CANCEL prompt and wait for user input.
 *
 * @param {object} context
 * @param {string} context.agentId — Agent requesting the action
 * @param {string} context.action — Human-readable description of the action
 * @param {string} context.consequence — Specific consequence of the action
 * @param {string} context.category — Irreversibility category
 * @param {string} context.reason — Why it's classified as irreversible
 * @returns {Promise<{ confirmed: boolean, checkpointId: string }>}
 */
async function promptConfirmCancel(context) {
  const { agentId, action, consequence, category, reason } = context;

  // Step 1: Create checkpoint
  const slug = (category || 'action').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const checkpoint = createCheckpoint(slug, {
    agentId,
    reason: `Pre-action checkpoint: ${action}`,
  });

  // Step 2: Log pre-execution audit entry
  logPreExecution(agentId, action, checkpoint.checkpointId);

  // Step 3: Present confirmation prompt
  const banner = [
    '',
    '═══════════════════════════════════════',
    '  ONXZA IRREVERSIBLE ACTION',
    '═══════════════════════════════════════',
    '',
    `  Agent:       ${agentId}`,
    `  Action:      ${action}`,
    `  Consequence: ${consequence}`,
    `  Category:    ${category || 'unclassified'}`,
    `  Reason:      ${reason || 'Classified as irreversible'}`,
    '',
    `  Checkpoint:  ${checkpoint.checkpointId}`,
    '',
    '  Type CONFIRM to proceed.',
    '  Type CANCEL (or anything else) to abort.',
    '',
    '═══════════════════════════════════════',
    '',
  ];

  banner.forEach(line => console.log(line));

  // Step 4: Wait for explicit CONFIRM or CANCEL
  const answer = await askUser('  > ');
  const confirmed = answer.trim().toUpperCase() === 'CONFIRM';

  if (confirmed) {
    console.log('\n  ✓ CONFIRMED — proceeding with action.\n');
  } else {
    console.log('\n  ✗ CANCELLED — action aborted. No changes made.\n');
    // Log cancellation
    logPostExecution(agentId, action, 'cancelled', 'user', checkpoint.checkpointId);
  }

  return { confirmed, checkpointId: checkpoint.checkpointId };
}

/**
 * Execute an action with full guardrails:
 * 1. Classify the action
 * 2. If IRREVERSIBLE: checkpoint → audit → CONFIRM/CANCEL → execute → audit
 * 3. If REVERSIBLE: execute directly
 *
 * @param {object} params
 * @param {string} params.agentId — Agent performing the action
 * @param {string} params.actionDescription — What the action does
 * @param {string} params.consequence — Specific consequence
 * @param {Function} params.executeFn — Async function to execute if confirmed
 * @param {object} [params.options] — Additional options
 * @param {boolean} [params.options.force] — Skip confirmation (dev license only)
 * @param {boolean} [params.options.dryRun] — Show what would happen without executing
 * @returns {Promise<{ executed: boolean, result: any, classification: string }>}
 */
async function executeWithGuardrails(params) {
  const { agentId, actionDescription, consequence, executeFn, options = {} } = params;

  // Classify the action
  const classification = classify(actionDescription);

  if (classification.classification === 'REVERSIBLE') {
    // Reversible: execute directly
    const result = await executeFn();
    return { executed: true, result, classification: 'REVERSIBLE' };
  }

  // IRREVERSIBLE path
  if (options.dryRun) {
    console.log('\n  [DRY RUN] This action is IRREVERSIBLE and would require CONFIRM/CANCEL.\n');
    console.log(`  Action:      ${actionDescription}`);
    console.log(`  Consequence: ${consequence}`);
    console.log(`  Category:    ${classification.category}`);
    console.log(`  Reason:      ${classification.reason}\n`);
    return { executed: false, result: null, classification: 'IRREVERSIBLE' };
  }

  // Full CONFIRM/CANCEL protocol
  const { confirmed, checkpointId } = await promptConfirmCancel({
    agentId,
    action: actionDescription,
    consequence,
    category: classification.category,
    reason: classification.reason,
  });

  if (!confirmed) {
    return { executed: false, result: null, classification: 'IRREVERSIBLE' };
  }

  // Execute and log outcome
  try {
    const result = await executeFn();
    logPostExecution(agentId, actionDescription, 'executed', 'user', checkpointId);
    return { executed: true, result, classification: 'IRREVERSIBLE' };
  } catch (err) {
    logPostExecution(agentId, actionDescription, 'fail', 'user', checkpointId);
    throw err;
  }
}

/**
 * Ask user for input via readline.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
function askUser(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

module.exports = { promptConfirmCancel, executeWithGuardrails, askUser };

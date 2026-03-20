'use strict';

/**
 * ONXZA Safety Guardrails — Unified Entry Point
 *
 * Exports all guardrail subsystems for use by CLI commands and the runtime.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { classify, isIrreversible } = require('./irreversibility');
const { createCheckpoint, listCheckpoints } = require('./checkpoint');
const { writeAuditEntry, logPreExecution, logPostExecution } = require('./audit-hook');
const { promptConfirmCancel, executeWithGuardrails } = require('./confirm-cancel');
const { scanFile, scanDirectory, formatResults } = require('./secret-scanner');

module.exports = {
  // Irreversibility classification
  classify,
  isIrreversible,

  // Checkpoint system
  createCheckpoint,
  listCheckpoints,

  // Audit trail hooks
  writeAuditEntry,
  logPreExecution,
  logPostExecution,

  // CONFIRM/CANCEL protocol
  promptConfirmCancel,
  executeWithGuardrails,

  // Secret scanner
  scanFile,
  scanDirectory,
  formatResults,
};

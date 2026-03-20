'use strict';

/**
 * Audit Hook — Pre/Post Execution Audit Logging
 *
 * Wraps irreversible actions with audit trail entries per ARCHITECTURE.md §11.4.
 * Logs BEFORE execution (outcome=pending) and AFTER (outcome=ok|fail|cancelled).
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const AUDIT_SCRIPT = path.join(
  os.homedir(), '.openclaw', 'workspace', 'scripts', 'log-audit-entry.py'
);
const AUDIT_TRAIL = path.join(
  os.homedir(), '.openclaw', 'workspace', 'logs', 'audit', 'audit-trail.md'
);

/**
 * Write an audit entry using the Python script or JS fallback.
 *
 * @param {object} entry
 * @param {string} entry.agent — Agent ID
 * @param {string} entry.action — Action description
 * @param {string} entry.outcome — ok | fail | cancelled | pending
 * @param {string} [entry.confirmedBy] — Who confirmed (default: 'pending')
 * @param {string} [entry.reversible] — 'yes' | 'no' (default: 'no')
 * @param {string} [entry.checkpointId] — Checkpoint ID (default: 'none')
 * @returns {{ success: boolean, message: string }}
 */
function writeAuditEntry(entry) {
  const {
    agent,
    action,
    outcome,
    confirmedBy = 'pending',
    reversible = 'no',
    checkpointId = 'none',
  } = entry;

  // Validate required fields
  if (!agent || !action || !outcome) {
    return { success: false, message: 'Missing required audit fields: agent, action, outcome' };
  }

  const validOutcomes = ['ok', 'fail', 'cancelled', 'pending', 'executed'];
  if (!validOutcomes.includes(outcome)) {
    return { success: false, message: `Invalid outcome: ${outcome}. Must be one of: ${validOutcomes.join(', ')}` };
  }

  // Try Python script first
  if (fs.existsSync(AUDIT_SCRIPT)) {
    try {
      const args = [
        '--agent', agent,
        '--action', action,
        '--outcome', outcome,
        '--confirmed-by', confirmedBy,
        '--reversible', reversible,
        '--checkpoint-id', checkpointId,
      ];
      const output = execFileSync('python3', [AUDIT_SCRIPT, ...args], {
        encoding: 'utf-8',
        stdio: ['inherit', 'pipe', 'pipe'],
      });
      return { success: true, message: output.trim() };
    } catch (err) {
      // Fall through to JS fallback
      console.error(`  Warning: audit script failed (${err.message}), using JS fallback`);
    }
  }

  // JS fallback: append directly to audit trail
  const timestamp = new Date().toISOString();
  const line = `${timestamp} | ${agent} | ${action} | ${outcome} | ${confirmedBy} | ${reversible} | ${checkpointId}\n`;

  const auditDir = path.dirname(AUDIT_TRAIL);
  fs.mkdirSync(auditDir, { recursive: true });

  // Create header if file doesn't exist
  if (!fs.existsSync(AUDIT_TRAIL)) {
    fs.writeFileSync(AUDIT_TRAIL,
      '# ONXZA Audit Trail\n\n' +
      '> Append-only. Never modify or delete entries.\n\n' +
      '| Timestamp | Agent | Action | Outcome | Confirmed By | Reversible | Checkpoint ID |\n' +
      '|-----------|-------|--------|---------|-------------|------------|---------------|\n'
    );
  }

  fs.appendFileSync(AUDIT_TRAIL, `| ${timestamp} | ${agent} | ${action} | ${outcome} | ${confirmedBy} | ${reversible} | ${checkpointId} |\n`);

  return { success: true, message: `Audit entry logged: ${timestamp}` };
}

/**
 * Log a pre-execution audit entry (outcome=pending).
 */
function logPreExecution(agent, action, checkpointId) {
  return writeAuditEntry({
    agent,
    action,
    outcome: 'pending',
    confirmedBy: 'pending',
    reversible: 'no',
    checkpointId,
  });
}

/**
 * Log a post-execution audit entry.
 */
function logPostExecution(agent, action, outcome, confirmedBy, checkpointId) {
  return writeAuditEntry({
    agent,
    action,
    outcome,
    confirmedBy,
    reversible: 'no',
    checkpointId,
  });
}

module.exports = { writeAuditEntry, logPreExecution, logPostExecution };

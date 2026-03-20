'use strict';

/**
 * ONXZA System Health Aggregator
 *
 * Combines agent state + ticket counts into a single health summary object.
 * Used by both `onxza status` and the dashboard health bar.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const { loadAgents, summariseAgents } = require('./agents');
const store = require('../tickets/store');

// ---------------------------------------------------------------------------
// Ticket summary
// ---------------------------------------------------------------------------

function summariseTickets() {
  const open            = store.loadByStatus('open');
  const inProgress      = store.loadByStatus('in-progress');
  const pendingApproval = store.loadByStatus('pending-approval');
  const blocked         = store.loadByStatus('blocked');
  const closed          = store.loadByStatus('closed');

  // Priority breakdown of open tickets
  const openByPriority = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const t of open) {
    const p = (t.meta.priority || 'medium').toLowerCase();
    if (p in openByPriority) openByPriority[p]++;
  }

  return {
    open:            open.length,
    inProgress:      inProgress.length,
    pendingApproval: pendingApproval.length,
    blocked:         blocked.length,
    closed:          closed.length,
    openByPriority,
  };
}

// ---------------------------------------------------------------------------
// Health score (0–100)
// ---------------------------------------------------------------------------

/**
 * Compute a simple health score:
 * - 100 = all good (agents healthy, no blockers, no critical open tickets)
 * - Deductions:
 *   -5 per blocked ticket
 *   -3 per critical open ticket
 *   -1 per high open ticket (max -20)
 *   -5 if >50% agents UNKNOWN state
 */
function computeHealthScore(agentSummary, ticketSummary) {
  let score = 100;
  score -= ticketSummary.blocked * 5;
  score -= ticketSummary.openByPriority.critical * 3;
  score -= Math.min(ticketSummary.openByPriority.high, 20);
  const unknownRatio = agentSummary.unknown / Math.max(agentSummary.total, 1);
  if (unknownRatio > 0.5) score -= 5;
  return Math.max(0, Math.min(100, score));
}

function healthLabel(score) {
  if (score >= 85) return 'HEALTHY';
  if (score >= 60) return 'DEGRADED';
  return 'CRITICAL';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the full system health snapshot.
 * @returns {object} health snapshot
 */
function getSystemHealth() {
  const agents        = loadAgents();
  const agentSummary  = summariseAgents(agents);
  const ticketSummary = summariseTickets();
  const score         = computeHealthScore(agentSummary, ticketSummary);

  return {
    timestamp:  new Date().toISOString(),
    version:    '0.1.0',
    health: {
      score,
      label:    healthLabel(score),
    },
    agents:     agentSummary,
    tickets:    ticketSummary,
    agentList:  agents,
  };
}

module.exports = { getSystemHealth, summariseTickets, summariseAgents };

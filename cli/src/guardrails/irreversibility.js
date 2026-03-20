'use strict';

/**
 * Irreversibility Classification Engine
 *
 * Classifies CLI actions as REVERSIBLE or IRREVERSIBLE based on
 * ARCHITECTURE.md §11.1 rules.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

/**
 * Actions classified as IRREVERSIBLE per ARCHITECTURE.md §11.1.
 *
 * Each entry has:
 *   pattern  — regex or string matched against the full CLI command
 *   reason   — human-readable explanation of why it's irreversible
 *   category — grouping for audit trail
 */
const IRREVERSIBLE_PATTERNS = [
  // File deletion
  {
    pattern: /\b(rm|rmdir|del(ete)?|remove|unlink)\b/i,
    reason: 'Deletes files or directories — cannot be undone',
    category: 'file_deletion',
  },
  // Vision document modification
  {
    pattern: /vision\.md/i,
    test: (cmd) => /\b(edit|modify|write|update|overwrite|replace)\b/i.test(cmd),
    reason: 'Modifies an approved vision document — requires Aaron approval',
    category: 'vision_modification',
  },
  // AGENTS.md modification
  {
    pattern: /AGENTS\.md/i,
    test: (cmd) => /\b(edit|modify|write|update|overwrite|replace)\b/i.test(cmd),
    reason: 'Modifies agent configuration — affects agent behavior',
    category: 'agent_config_modification',
  },
  // openclaw.json modification
  {
    pattern: /openclaw\.json/i,
    test: (cmd) => /\b(edit|modify|write|update|overwrite|replace)\b/i.test(cmd),
    reason: 'Modifies system configuration — affects all agents',
    category: 'system_config_modification',
  },
  // External publishing
  {
    pattern: /\b(publish|deploy|release|push)\b/i,
    reason: 'Publishes content externally — cannot be retracted',
    category: 'external_publish',
  },
  // External communication
  {
    pattern: /\b(send|email|message|notify|broadcast|tweet|post)\b/i,
    test: (cmd) => /\b(external|public|customer|client|social)\b/i.test(cmd),
    reason: 'Sends external communication — cannot be unsent',
    category: 'external_communication',
  },
  // Skill/tool installation
  {
    pattern: /\b(install|add)\b.*\b(skill|tool|plugin|extension)\b/i,
    reason: 'Installs new capability — extends attack surface',
    category: 'skill_installation',
  },
  // External API calls
  {
    pattern: /\b(api|fetch|request|curl|wget)\b.*\b(external|third.?party|stripe|twilio|sendgrid)\b/i,
    reason: 'Makes external API call — external consequences',
    category: 'external_api_call',
  },
  // Financial actions
  {
    pattern: /\b(pay|charge|purchase|subscribe|spend|bill|invoice|refund)\b/i,
    reason: 'Involves money — requires owner approval',
    category: 'financial_action',
  },
  // Script modification
  {
    pattern: /scripts\//i,
    test: (cmd) => /\b(edit|modify|write|update|overwrite|replace|delete|rm)\b/i.test(cmd),
    reason: 'Modifies automation scripts — affects system behavior',
    category: 'script_modification',
  },
  // Bulk operations
  {
    pattern: /\b(bulk|batch|mass|all)\b.*\b(delete|remove|modify|update|overwrite)\b/i,
    reason: 'Bulk operation — affects 10+ files, high blast radius',
    category: 'bulk_operation',
  },
];

/**
 * Actions classified as REVERSIBLE per ARCHITECTURE.md §11.1.
 * These execute without confirmation.
 */
const REVERSIBLE_PATTERNS = [
  /\b(create|new|scaffold|init|generate)\b.*\b(file|directory|folder|workspace|ticket)\b/i,
  /\b(write|update)\b.*\b(memory|MEMORY\.md)\b/i,
  /\b(create|open|update)\b.*\b(ticket)\b/i,
  /\b(research|analyze|search|read|list|show|status|check|verify|validate|scan)\b/i,
  /\b(draft|generate|compose)\b.*\b(content|copy|text|doc)\b/i,
  /\b(checkpoint|backup|snapshot)\b/i,
];

/**
 * Classify an action string.
 *
 * @param {string} actionDescription — Natural language or CLI command description
 * @returns {{ classification: 'REVERSIBLE'|'IRREVERSIBLE', reason: string|null, category: string|null }}
 */
function classify(actionDescription) {
  if (!actionDescription || typeof actionDescription !== 'string') {
    // Default to IRREVERSIBLE for safety when input is invalid
    return {
      classification: 'IRREVERSIBLE',
      reason: 'Unable to classify action — defaulting to IRREVERSIBLE for safety',
      category: 'unknown',
    };
  }

  const desc = actionDescription.trim();

  // Check irreversible patterns first (safety-first)
  for (const rule of IRREVERSIBLE_PATTERNS) {
    const patternMatch = rule.pattern.test(desc);
    if (patternMatch) {
      // If there's an additional test function, both must match
      if (rule.test && !rule.test(desc)) continue;
      return {
        classification: 'IRREVERSIBLE',
        reason: rule.reason,
        category: rule.category,
      };
    }
  }

  // Check reversible patterns
  for (const pattern of REVERSIBLE_PATTERNS) {
    if (pattern.test(desc)) {
      return {
        classification: 'REVERSIBLE',
        reason: null,
        category: null,
      };
    }
  }

  // Default to IRREVERSIBLE for unrecognized actions (fail-safe)
  return {
    classification: 'IRREVERSIBLE',
    reason: 'Action not recognized — defaulting to IRREVERSIBLE for safety',
    category: 'unclassified',
  };
}

/**
 * Check if a specific CLI command name is in the irreversible list.
 *
 * @param {string} commandName — e.g. 'agent create', 'skill install'
 * @returns {boolean}
 */
function isIrreversible(commandName) {
  return classify(commandName).classification === 'IRREVERSIBLE';
}

module.exports = {
  classify,
  isIrreversible,
  IRREVERSIBLE_PATTERNS,
  REVERSIBLE_PATTERNS,
};

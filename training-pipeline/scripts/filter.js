#!/usr/bin/env node
/**
 * ONXZA-LLM Training Data Quality Filter
 * Applies quality rules to anonymized candidates — rejects noise, failed tasks,
 * corrupted records, and duplicates. Assigns quality tiers to accepted records.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG_FILE = path.join(__dirname, 'pipeline-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
const OUTPUT_DIR = path.join(__dirname, '../output');

const REQUIRED_FIELDS = ['id', 'source', 'version', 'created_at', 'input', 'output', 'metadata'];
const REQUIRED_INPUT_FIELDS = ['instruction', 'context', 'task_type'];
const REQUIRED_OUTPUT_FIELDS = ['reasoning', 'decision', 'confidence'];
const REQUIRED_METADATA_FIELDS = ['source', 'fvp_result', 'loop_count', 'anonymized'];

const filters = config.quality_filters;

/**
 * Validate record structure.
 */
function validateStructure(record) {
  for (const field of REQUIRED_FIELDS) {
    if (record[field] === undefined || record[field] === null) {
      return { pass: false, reason: `Missing required field: ${field}` };
    }
  }
  for (const field of REQUIRED_INPUT_FIELDS) {
    if (!record.input[field]) {
      return { pass: false, reason: `Missing required input field: ${field}` };
    }
  }
  for (const field of REQUIRED_OUTPUT_FIELDS) {
    if (record.output[field] === undefined || record.output[field] === null) {
      return { pass: false, reason: `Missing required output field: ${field}` };
    }
  }
  for (const field of REQUIRED_METADATA_FIELDS) {
    if (record.metadata[field] === undefined || record.metadata[field] === null) {
      return { pass: false, reason: `Missing required metadata field: ${field}` };
    }
  }
  return { pass: true };
}

/**
 * Apply quality filters. Returns { pass: boolean, reason: string|null }.
 */
function applyQualityFilters(record) {
  const meta = record.metadata;
  const output = record.output;

  // Must have passed anonymization
  if (!meta.anonymized || !meta.anonymization_pass) {
    return { pass: false, reason: 'anonymization_failed' };
  }

  // Reject failed tasks (fvp failed AND max loops reached)
  if (filters.reject_failed_tasks &&
      meta.fvp_result === 'fail' &&
      meta.loop_count >= filters.max_loop_count_for_inclusion) {
    return { pass: false, reason: 'failed_task_at_max_loops' };
  }

  // Reject unresolved escalations
  if (filters.reject_unresolved_escalations && meta.fvp_result === 'escalated') {
    // Allow escalations that are used as training examples for escalation behavior
    // but only if the output explicitly teaches the escalation decision
    if (!output.decision.toUpperCase().includes('ESCALATE')) {
      return { pass: false, reason: 'unresolved_escalation' };
    }
  }

  // Reject zero/near-zero confidence
  if (output.confidence < filters.min_confidence_score) {
    return { pass: false, reason: `confidence_too_low: ${output.confidence}` };
  }

  // Reject short reasoning (insufficient training signal)
  if (output.reasoning.length < filters.min_reasoning_length) {
    return { pass: false, reason: `reasoning_too_short: ${output.reasoning.length} chars` };
  }

  // Reject loop count above max
  if (meta.loop_count > filters.max_loop_count_for_inclusion) {
    return { pass: false, reason: `loop_count_exceeds_max: ${meta.loop_count}` };
  }

  return { pass: true, reason: null };
}

/**
 * Assign quality tier.
 */
function assignTier(record) {
  const meta = record.metadata;
  const output = record.output;

  if (meta.fvp_result === 'pass' &&
      meta.loop_count <= 1 &&
      output.confidence >= 80) {
    return 1;
  }
  if (meta.fvp_result === 'pass' && meta.loop_count <= 2) {
    return 2;
  }
  return 3;
}

/**
 * Generate content hash for deduplication.
 */
function contentHash(record) {
  const key = record.input.instruction + record.input.context + record.output.decision;
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Run quality filtering on anonymized candidates.
 */
function filter() {
  console.log('[filter] Starting quality filtering...');

  const anonPath = path.join(OUTPUT_DIR, 'anonymized-candidates.jsonl');
  if (!fs.existsSync(anonPath)) {
    console.error('[filter] ERROR: anonymized-candidates.jsonl not found. Run anonymize.js first.');
    process.exit(1);
  }

  const lines = fs.readFileSync(anonPath, 'utf8').trim().split('\n').filter(Boolean);
  console.log(`[filter] Evaluating ${lines.length} anonymized candidates...`);

  const accepted = [];
  const rejected = [];
  const seenHashes = new Set();

  // Load existing training data hashes to prevent duplicates across runs
  const existingDataPath = path.join(OUTPUT_DIR, 'training-data.jsonl');
  if (fs.existsSync(existingDataPath)) {
    const existingLines = fs.readFileSync(existingDataPath, 'utf8').trim().split('\n').filter(Boolean);
    for (const line of existingLines) {
      try {
        const record = JSON.parse(line);
        seenHashes.add(contentHash(record));
      } catch (e) {
        // Skip malformed
      }
    }
    console.log(`[filter] Loaded ${seenHashes.size} existing record hashes for deduplication`);
  }

  const rejectionReasons = {};

  for (const line of lines) {
    let record;
    try {
      record = JSON.parse(line);
    } catch (e) {
      rejected.push({ record: line, reason: 'malformed_json' });
      continue;
    }

    // Structure validation
    const structureCheck = validateStructure(record);
    if (!structureCheck.pass) {
      rejected.push({ record, reason: structureCheck.reason });
      rejectionReasons[structureCheck.reason] = (rejectionReasons[structureCheck.reason] || 0) + 1;
      continue;
    }

    // Deduplication
    const hash = contentHash(record);
    if (seenHashes.has(hash)) {
      rejected.push({ record, reason: 'duplicate' });
      rejectionReasons['duplicate'] = (rejectionReasons['duplicate'] || 0) + 1;
      continue;
    }

    // Quality filters
    const filterResult = applyQualityFilters(record);
    if (!filterResult.pass) {
      rejected.push({ record, reason: filterResult.reason });
      rejectionReasons[filterResult.reason] = (rejectionReasons[filterResult.reason] || 0) + 1;
      continue;
    }

    // Assign tier
    const tier = assignTier(record);
    record.metadata.quality_tier = tier;

    seenHashes.add(hash);
    accepted.push(record);
  }

  // Sort by quality tier (best first)
  accepted.sort((a, b) => a.metadata.quality_tier - b.metadata.quality_tier);

  console.log(`[filter] Results:`);
  console.log(`  Accepted: ${accepted.length}`);
  console.log(`  Rejected: ${rejected.length}`);
  console.log(`  Tier 1: ${accepted.filter(r => r.metadata.quality_tier === 1).length}`);
  console.log(`  Tier 2: ${accepted.filter(r => r.metadata.quality_tier === 2).length}`);
  console.log(`  Tier 3: ${accepted.filter(r => r.metadata.quality_tier === 3).length}`);

  if (Object.keys(rejectionReasons).length > 0) {
    console.log('[filter] Rejection breakdown:');
    for (const [reason, count] of Object.entries(rejectionReasons)) {
      console.log(`  ${reason}: ${count}`);
    }
  }

  // Write accepted to filter output
  const filteredPath = path.join(OUTPUT_DIR, 'filtered-candidates.jsonl');
  fs.writeFileSync(
    filteredPath,
    accepted.map(r => JSON.stringify(r)).join('\n') + '\n',
    'utf8'
  );

  // Write rejected for audit trail
  const rejectedDir = path.join(OUTPUT_DIR, 'rejected');
  fs.mkdirSync(rejectedDir, { recursive: true });
  const rejectedPath = path.join(rejectedDir, 'rejected-records.jsonl');
  fs.writeFileSync(
    rejectedPath,
    rejected.map(r => JSON.stringify(r)).join('\n') + '\n',
    'utf8'
  );

  console.log(`[filter] Filtered candidates written to: ${filteredPath}`);
  return accepted;
}

// Run if called directly
if (require.main === module) {
  filter();
}

module.exports = { filter, applyQualityFilters, assignTier };

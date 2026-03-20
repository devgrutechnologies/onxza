#!/usr/bin/env node
/**
 * ONXZA-LLM Training Data Anonymizer
 * Removes all PII, company names, agent IDs, credentials, and sensitive terms
 * from training candidates before they enter the training set.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA_DIR = path.join(__dirname, '../schema');
const OUTPUT_DIR = path.join(__dirname, '../output');
const sensitiveTerms = JSON.parse(
  fs.readFileSync(path.join(SCHEMA_DIR, 'sensitive-terms.json'), 'utf8')
);

const REGEX_PATTERNS = {
  email: new RegExp(sensitiveTerms.regex_patterns.email, 'gi'),
  url: new RegExp(sensitiveTerms.regex_patterns.url, 'gi'),
  phone: new RegExp(sensitiveTerms.regex_patterns.phone, 'g'),
  // API key candidate — long alphanumeric strings (flagged but not auto-replaced)
  api_key_candidate: new RegExp(sensitiveTerms.regex_patterns.api_key_candidate, 'g')
};

let quarantineCount = 0;
let processedCount = 0;

/**
 * Replace all known sensitive terms in a string.
 */
function replaceTerms(text) {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // Replace company names
  for (const company of sensitiveTerms.companies) {
    const escaped = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'gi'), '[COMPANY]');
  }

  // Replace agent IDs with role tags
  for (const agentId of sensitiveTerms.agent_ids) {
    const escaped = agentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Map to role tags
    let tag = '[SPECIALIST_AGENT]';
    if (agentId.includes('PM')) tag = '[PM_AGENT]';
    else if (agentId.includes('LLM')) tag = '[LLM_AGENT]';
    else if (agentId.includes('Verification')) tag = '[VERIFICATION_AGENT]';
    else if (agentId.includes('ModelIndex')) tag = '[MODEL_INDEX_AGENT]';
    else if (agentId.includes('ScriptEngine')) tag = '[SCRIPT_ENGINE_AGENT]';
    else if (agentId.includes('Marcus') || agentId.includes('Parent')) tag = '[PARENT_AGENT]';
    else if (agentId.includes('QualityDirector')) tag = '[QA_AGENT]';
    else if (agentId.includes('CEO')) tag = '[CEO_AGENT]';
    else if (agentId.includes('COO')) tag = '[COO_AGENT]';
    result = result.replace(new RegExp(escaped, 'gi'), tag);
  }

  // Replace email addresses
  result = result.replace(REGEX_PATTERNS.email, '[EMAIL]');

  // Replace URLs (preserve protocol type for context)
  result = result.replace(REGEX_PATTERNS.url, (match) => {
    if (match.includes('localhost') || match.includes('127.0.0.1')) return '[LOCAL_URL]';
    if (match.includes('internal') || match.includes('.local')) return '[INTERNAL_URL]';
    return '[URL]';
  });

  // Replace phone numbers
  result = result.replace(REGEX_PATTERNS.phone, '[PHONE]');

  return result;
}

/**
 * Scan for potential PII/secrets that weren't caught by term replacement.
 * Returns true if the text is clean, false if quarantine is needed.
 */
function scanForResidualPii(text) {
  if (!text || typeof text !== 'string') return true;

  // Check for API key candidates (long alphanumeric strings)
  const apiKeyCandidates = text.match(REGEX_PATTERNS.api_key_candidate) || [];
  // Filter out known-safe patterns (like JSON keys, common words won't hit 32+ chars)
  const suspiciousCandidates = apiKeyCandidates.filter(candidate => {
    // Skip if it looks like a normal word sequence or known safe pattern
    if (candidate.includes(' ')) return false; // Has spaces — not a key
    if (candidate.startsWith('onxza-train-')) return false; // Our own IDs
    if (candidate.startsWith('http')) return false; // URL fragment
    return candidate.length >= 32; // Only flag truly long unbroken strings
  });

  if (suspiciousCandidates.length > 0) {
    console.warn(`[anonymize] QUARANTINE: Potential credential found: ${suspiciousCandidates[0].slice(0, 8)}...`);
    return false;
  }

  // Check for remaining email-like patterns
  const remainingEmails = text.match(REGEX_PATTERNS.email) || [];
  if (remainingEmails.length > 0) {
    console.warn(`[anonymize] QUARANTINE: Residual email found: ${remainingEmails[0].slice(0, 10)}...`);
    return false;
  }

  return true;
}

/**
 * Anonymize a single record. Returns the anonymized record or null if quarantined.
 */
function anonymizeRecord(record) {
  // Deep clone
  const anon = JSON.parse(JSON.stringify(record));

  // Anonymize all string fields recursively
  function anonymizeObj(obj) {
    if (typeof obj === 'string') return replaceTerms(obj);
    if (Array.isArray(obj)) return obj.map(anonymizeObj);
    if (obj !== null && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = anonymizeObj(value);
      }
      return result;
    }
    return obj;
  }

  // Anonymize input and output fields
  anon.input = anonymizeObj(anon.input);
  anon.output = anonymizeObj(anon.output);

  // Scan the full serialized record for residual PII
  const fullText = JSON.stringify(anon.input) + ' ' + JSON.stringify(anon.output);
  const isClean = scanForResidualPii(fullText);

  anon.metadata.anonymized = true;
  anon.metadata.anonymization_pass = isClean;

  return anon;
}

/**
 * Run anonymization on all raw candidates.
 */
function anonymize() {
  console.log('[anonymize] Starting anonymization pass...');

  const rawPath = path.join(OUTPUT_DIR, 'raw-candidates.jsonl');
  if (!fs.existsSync(rawPath)) {
    console.error('[anonymize] ERROR: raw-candidates.jsonl not found. Run collect.js first.');
    process.exit(1);
  }

  const rawLines = fs.readFileSync(rawPath, 'utf8').trim().split('\n').filter(Boolean);
  console.log(`[anonymize] Processing ${rawLines.length} raw candidates...`);

  const cleanRecords = [];
  const quarantineRecords = [];

  fs.mkdirSync(path.join(OUTPUT_DIR, 'quarantine'), { recursive: true });

  for (const line of rawLines) {
    let record;
    try {
      record = JSON.parse(line);
    } catch (e) {
      console.warn('[anonymize] SKIP: Malformed JSON line');
      continue;
    }

    const anonymized = anonymizeRecord(record);
    processedCount++;

    if (!anonymized.metadata.anonymization_pass) {
      quarantineRecords.push(anonymized);
      quarantineCount++;
    } else {
      cleanRecords.push(anonymized);
    }
  }

  // Write clean records for filter step
  const cleanPath = path.join(OUTPUT_DIR, 'anonymized-candidates.jsonl');
  fs.writeFileSync(
    cleanPath,
    cleanRecords.map(r => JSON.stringify(r)).join('\n') + '\n',
    'utf8'
  );

  // Write quarantine records for manual review
  if (quarantineRecords.length > 0) {
    const quarantinePath = path.join(OUTPUT_DIR, 'quarantine', `quarantine-${Date.now()}.jsonl`);
    fs.writeFileSync(
      quarantinePath,
      quarantineRecords.map(r => JSON.stringify(r)).join('\n') + '\n',
      'utf8'
    );
    console.log(`[anonymize] QUARANTINED: ${quarantineRecords.length} records require manual review`);
    console.log(`  Quarantine file: ${quarantinePath}`);
  }

  console.log(`[anonymize] Complete.`);
  console.log(`  Processed: ${processedCount}`);
  console.log(`  Clean: ${cleanRecords.length}`);
  console.log(`  Quarantined: ${quarantineCount}`);

  return cleanRecords;
}

// Run if called directly
if (require.main === module) {
  anonymize();
}

module.exports = { anonymize, anonymizeRecord, replaceTerms };

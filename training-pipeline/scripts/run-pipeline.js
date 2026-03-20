#!/usr/bin/env node
/**
 * ONXZA-LLM Training Data Pipeline — Full Run
 * Orchestrates: collect → anonymize → filter → format
 *
 * Usage:
 *   node run-pipeline.js           # Full pipeline run
 *   node run-pipeline.js --status  # Print current dataset status
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../output');

function printStatus() {
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.log('[status] No dataset yet. Run pipeline to generate training data.');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const progress = Math.min(100, Math.round((manifest.total_records / manifest.min_training_threshold) * 100));

  console.log('\n=== ONXZA-LLM Training Dataset Status ===');
  console.log(`Total records:     ${manifest.total_records}`);
  console.log(`Training ready:    ${manifest.training_ready ? 'YES ✓' : `NO (${progress}% of minimum ${manifest.min_training_threshold})`}`);
  console.log(`Stretch target:    ${manifest.stretch_target} (${Math.min(100, Math.round((manifest.total_records / manifest.stretch_target) * 100))}%)`);
  console.log(`Pipeline runs:     ${manifest.run_count}`);
  console.log(`Last run:          ${manifest.last_run || 'never'}`);
  console.log('');
  console.log('By source:');
  console.log(`  Routing:          ${manifest.by_source.routing || 0}`);
  console.log(`  FVP:              ${manifest.by_source.fvp || 0}`);
  console.log(`  Shared Learning:  ${manifest.by_source.shared_learning || 0}`);
  console.log('');
  console.log('By quality tier:');
  console.log(`  Tier 1 (high):    ${manifest.by_tier[1] || 0}`);
  console.log(`  Tier 2 (good):    ${manifest.by_tier[2] || 0}`);
  console.log(`  Tier 3 (accept):  ${manifest.by_tier[3] || 0}`);
  console.log('=========================================\n');
}

function runPipeline() {
  console.log('\n=== ONXZA-LLM Training Data Pipeline ===');
  console.log(`Run started: ${new Date().toISOString()}`);
  console.log('');

  // Ensure output directories exist
  fs.mkdirSync(path.join(OUTPUT_DIR, 'rejected'), { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, 'quarantine'), { recursive: true });

  try {
    console.log('[pipeline] Step 1/4: Collect...');
    const { collect } = require('./collect');
    collect();
    console.log('[pipeline] Step 1 complete.\n');

    console.log('[pipeline] Step 2/4: Anonymize...');
    const { anonymize } = require('./anonymize');
    anonymize();
    console.log('[pipeline] Step 2 complete.\n');

    console.log('[pipeline] Step 3/4: Filter...');
    const { filter } = require('./filter');
    filter();
    console.log('[pipeline] Step 3 complete.\n');

    console.log('[pipeline] Step 4/4: Format and append...');
    const { format } = require('./format');
    const manifest = format();
    console.log('[pipeline] Step 4 complete.\n');

    console.log('[pipeline] Pipeline run complete.');
    printStatus();

  } catch (err) {
    console.error('[pipeline] PIPELINE FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Parse args
const args = process.argv.slice(2);
if (args.includes('--status')) {
  printStatus();
} else {
  runPipeline();
}

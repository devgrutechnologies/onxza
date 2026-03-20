#!/usr/bin/env node
/**
 * ONXZA-LLM Training Data Formatter
 * Appends filtered records to the canonical training JSONL, updates the manifest,
 * and logs the pipeline run.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'pipeline-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
const OUTPUT_DIR = path.join(__dirname, '../output');

/**
 * Load or initialize the dataset manifest.
 */
function loadManifest() {
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  return {
    created_at: new Date().toISOString(),
    schema_version: '1.0',
    total_records: 0,
    by_source: { routing: 0, fvp: 0, shared_learning: 0 },
    by_tier: { 1: 0, 2: 0, 3: 0 },
    last_run: null,
    run_count: 0,
    training_ready: false,
    min_training_threshold: config.pipeline.min_dataset_size_for_training,
    stretch_target: config.pipeline.stretch_dataset_target
  };
}

/**
 * Format and append filtered candidates to the canonical training dataset.
 */
function format() {
  console.log('[format] Starting format and append step...');

  const filteredPath = path.join(OUTPUT_DIR, 'filtered-candidates.jsonl');
  if (!fs.existsSync(filteredPath)) {
    console.error('[format] ERROR: filtered-candidates.jsonl not found. Run filter.js first.');
    process.exit(1);
  }

  const lines = fs.readFileSync(filteredPath, 'utf8').trim().split('\n').filter(Boolean);
  if (lines.length === 0) {
    console.log('[format] No filtered candidates to append.');
    return;
  }

  const records = lines.map(line => JSON.parse(line));
  console.log(`[format] Appending ${records.length} records to training dataset...`);

  // Append to canonical training JSONL
  const trainingDataPath = path.join(OUTPUT_DIR, 'training-data.jsonl');
  const appendLines = records.map(r => JSON.stringify(r)).join('\n') + '\n';
  fs.appendFileSync(trainingDataPath, appendLines, 'utf8');

  // Update manifest
  const manifest = loadManifest();
  manifest.total_records += records.length;
  manifest.last_run = new Date().toISOString();
  manifest.run_count += 1;

  for (const record of records) {
    manifest.by_source[record.source] = (manifest.by_source[record.source] || 0) + 1;
    const tier = record.metadata.quality_tier || 3;
    manifest.by_tier[tier] = (manifest.by_tier[tier] || 0) + 1;
  }

  manifest.training_ready = manifest.total_records >= config.pipeline.min_dataset_size_for_training;

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  // Log run
  const logPath = path.join(OUTPUT_DIR, 'pipeline-runs.log');
  const logEntry = [
    `[${new Date().toISOString()}] RUN #${manifest.run_count}`,
    `  New records: ${records.length}`,
    `  Total dataset: ${manifest.total_records}`,
    `  Training ready: ${manifest.training_ready}`,
    `  By source: routing=${manifest.by_source.routing || 0}, fvp=${manifest.by_source.fvp || 0}, shared_learning=${manifest.by_source.shared_learning || 0}`,
    `  By tier: T1=${manifest.by_tier[1] || 0}, T2=${manifest.by_tier[2] || 0}, T3=${manifest.by_tier[3] || 0}`,
    ''
  ].join('\n');
  fs.appendFileSync(logPath, logEntry, 'utf8');

  console.log('[format] Complete.');
  console.log(`  Dataset total: ${manifest.total_records} records`);
  console.log(`  Training ready: ${manifest.training_ready}`);

  if (manifest.training_ready) {
    console.log('\n[format] *** TRAINING THRESHOLD REACHED ***');
    console.log(`  Dataset has ${manifest.total_records} records — ready for first ONXZA-LLM training run.`);
    console.log('  Next: submit llm_release ticket to DTP_ONXZA_PM.');
  }

  const progress = Math.min(100, Math.round((manifest.total_records / config.pipeline.min_dataset_size_for_training) * 100));
  console.log(`  Progress toward minimum: ${progress}% (${manifest.total_records}/${config.pipeline.min_dataset_size_for_training})`);

  return manifest;
}

// Run if called directly
if (require.main === module) {
  format();
}

module.exports = { format, loadManifest };

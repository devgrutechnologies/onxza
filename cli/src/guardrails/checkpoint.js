'use strict';

/**
 * Checkpoint Creation Module
 *
 * Creates a checkpoint before every irreversible action, per ARCHITECTURE.md §11.3.
 * Wraps the scripts/create-checkpoint.py script with JS integration.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHECKPOINT_SCRIPT = path.join(
  os.homedir(), '.openclaw', 'workspace', 'scripts', 'create-checkpoint.py'
);
const CHECKPOINT_DIR = path.join(os.homedir(), '.openclaw', 'checkpoints');

/**
 * Create a checkpoint before an irreversible action.
 *
 * @param {string} slug — Action slug (e.g. 'delete-stale-pages')
 * @param {object} [options]
 * @param {string} [options.agentId] — Agent creating the checkpoint
 * @param {string} [options.reason] — Reason for checkpoint
 * @returns {{ checkpointId: string, path: string, timestamp: string }}
 */
function createCheckpoint(slug, options = {}) {
  const sanitizedSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 64);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const checkpointId = `${timestamp}-${sanitizedSlug}`;
  const checkpointPath = path.join(CHECKPOINT_DIR, checkpointId);

  // Try Python script first
  if (fs.existsSync(CHECKPOINT_SCRIPT)) {
    try {
      const output = execFileSync('python3', [CHECKPOINT_SCRIPT, sanitizedSlug], {
        encoding: 'utf-8',
        stdio: ['inherit', 'pipe', 'pipe'],
      });
      // Parse checkpoint ID from script output
      const match = output.match(/checkpoint[:\s]+(\S+)/i);
      const scriptId = match ? match[1] : checkpointId;
      return {
        checkpointId: scriptId,
        path: checkpointPath,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      // Fall through to JS implementation
      console.error(`  Warning: checkpoint script failed (${err.message}), using JS fallback`);
    }
  }

  // JS fallback: create checkpoint directory and manifest
  fs.mkdirSync(checkpointPath, { recursive: true });

  const manifest = {
    id: checkpointId,
    created: new Date().toISOString(),
    slug: sanitizedSlug,
    agent: options.agentId || 'unknown',
    reason: options.reason || 'Pre-action checkpoint',
    type: 'pre-irreversible-action',
  };

  fs.writeFileSync(
    path.join(checkpointPath, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );

  // Copy openclaw.json if it exists
  const openclawJson = path.join(os.homedir(), '.openclaw', 'workspace', 'openclaw.json');
  if (fs.existsSync(openclawJson)) {
    fs.copyFileSync(openclawJson, path.join(checkpointPath, 'openclaw.json'));
  }

  // Write README
  fs.writeFileSync(
    path.join(checkpointPath, 'README.md'),
    `# Checkpoint: ${checkpointId}\n\n` +
    `**Created:** ${manifest.created}\n` +
    `**Agent:** ${manifest.agent}\n` +
    `**Reason:** ${manifest.reason}\n` +
    `**Slug:** ${sanitizedSlug}\n\n` +
    `This checkpoint was created before an irreversible action.\n` +
    `Restore by reverting workspace state to this snapshot.\n`
  );

  return {
    checkpointId,
    path: checkpointPath,
    timestamp: manifest.created,
  };
}

/**
 * List existing checkpoints.
 * @returns {Array<{id: string, created: string, slug: string}>}
 */
function listCheckpoints() {
  if (!fs.existsSync(CHECKPOINT_DIR)) return [];

  return fs.readdirSync(CHECKPOINT_DIR)
    .filter(name => {
      const fullPath = path.join(CHECKPOINT_DIR, name);
      return fs.statSync(fullPath).isDirectory();
    })
    .map(name => {
      const manifestPath = path.join(CHECKPOINT_DIR, name, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          return { id: data.id || name, created: data.created, slug: data.slug };
        } catch {
          return { id: name, created: null, slug: null };
        }
      }
      return { id: name, created: null, slug: null };
    })
    .sort((a, b) => (b.created || '').localeCompare(a.created || ''));
}

module.exports = { createCheckpoint, listCheckpoints };

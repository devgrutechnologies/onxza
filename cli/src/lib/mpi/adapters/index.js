'use strict';

/**
 * Model adapter factory.
 * Detects provider from model ID prefix and returns the correct adapter.
 *
 * Supported providers:
 *   claude-* → anthropic
 *   gpt-*    → openai
 *   o1*      → openai
 *   o3*      → openai
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const anthropicAdapter = require('./anthropic');
const openaiAdapter    = require('./openai');

function detectProvider(modelId) {
  if (!modelId) return null;
  const id = modelId.toLowerCase();
  if (id.startsWith('claude')) return 'anthropic';
  if (id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3')) return 'openai';
  return null;
}

/**
 * Create a model adapter from a model ID string.
 * @param {string} modelId - e.g. "claude-sonnet-4-20250514", "gpt-4o"
 * @param {object} opts - { apiKey }
 */
function createAdapter(modelId, opts = {}) {
  const provider = detectProvider(modelId);

  if (provider === 'anthropic') {
    return anthropicAdapter.createAdapter(modelId, opts.apiKey);
  }
  if (provider === 'openai') {
    return openaiAdapter.createAdapter(modelId, opts.apiKey);
  }

  throw new Error(
    `Unknown model provider for "${modelId}". ` +
    'Supported: claude-* (anthropic), gpt-*/o1*/o3* (openai). ' +
    'For local models, ensure model ID starts with a supported prefix.'
  );
}

/**
 * Compute cost in USD from token counts + adapter pricing.
 */
function computeCost(adapter, inputTokens, outputTokens) {
  const p = adapter.pricing || {};
  return ((inputTokens  / 1000) * (p.input_per_1k  || 0)) +
         ((outputTokens / 1000) * (p.output_per_1k || 0));
}

module.exports = { createAdapter, detectProvider, computeCost };

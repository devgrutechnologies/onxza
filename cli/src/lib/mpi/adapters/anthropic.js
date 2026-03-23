'use strict';

/**
 * Anthropic model adapter for MPI harness.
 * Calls the Anthropic Messages API using native https (no axios).
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const https = require('https');

const PRICING = {
  'claude-opus-4-20250514':   { input: 0.015,  output: 0.075  },
  'claude-sonnet-4-20250514': { input: 0.003,  output: 0.015  },
  'claude-haiku-4-20250514':  { input: 0.00025, output: 0.00125 },
  // Fallback for unknown model IDs
  default:                    { input: 0.003,  output: 0.015  },
};

function getPricing(modelId) {
  return PRICING[modelId] || PRICING.default;
}

/**
 * Make a single POST request to Anthropic Messages API.
 * Returns { output, input_tokens, output_tokens, latency_ms }
 */
function callApi(modelId, systemPrompt, userPrompt, maxTokens, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      modelId,
      max_tokens: maxTokens || 8192,
      temperature: 0,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers:  {
        'Content-Type':      'application/json',
        'Content-Length':    Buffer.byteLength(body),
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
    };

    const start = Date.now();
    const req   = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const latency_ms = Date.now() - start;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`Anthropic API error: ${parsed.error.message || JSON.stringify(parsed.error)}`));
            return;
          }
          if (res.statusCode >= 400) {
            const err = new Error(`Anthropic API HTTP ${res.statusCode}: ${data}`);
            err.statusCode = res.statusCode;
            reject(err);
            return;
          }
          const output       = (parsed.content || []).map(b => b.text || '').join('');
          const input_tokens  = parsed.usage?.input_tokens  || 0;
          const output_tokens = parsed.usage?.output_tokens || 0;
          resolve({ output, input_tokens, output_tokens, latency_ms });
        } catch (e) {
          reject(new Error(`Failed to parse Anthropic response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Create an Anthropic model adapter.
 */
function createAdapter(modelId, apiKey) {
  if (!apiKey) {
    apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_KEY;
  }
  if (!apiKey) {
    throw new Error('Anthropic API key required. Set ANTHROPIC_API_KEY or pass --api-key.');
  }

  const pricing = getPricing(modelId);

  return {
    id:       modelId,
    provider: 'anthropic',
    pricing:  { input_per_1k: pricing.input, output_per_1k: pricing.output },
    _context: [],

    async execute(prompt, options = {}) {
      const maxTokens   = options.max_tokens    || 8192;
      const systemPrompt = options.system_prompt || 'You are a capable AI assistant completing agentic benchmark tasks.';

      // Retry up to 3 times on 5xx or network errors
      let lastErr;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await callApi(modelId, systemPrompt, prompt, maxTokens, apiKey);
          return result;
        } catch (e) {
          lastErr = e;
          if (e.statusCode && e.statusCode < 500 && e.statusCode !== 429) {
            throw e; // Don't retry 4xx except rate limits
          }
          if (attempt < 3) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
            await new Promise(r => setTimeout(r, delay));
          }
        }
      }
      throw lastErr;
    },

    reset() {
      this._context = [];
    },
  };
}

module.exports = { createAdapter, getPricing };

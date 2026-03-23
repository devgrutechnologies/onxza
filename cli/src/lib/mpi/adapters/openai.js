'use strict';

/**
 * OpenAI model adapter for MPI harness.
 * Calls the OpenAI Chat Completions API using native https.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const https = require('https');

const PRICING = {
  'gpt-4o':               { input: 0.005,   output: 0.015  },
  'gpt-4o-mini':          { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo':          { input: 0.01,    output: 0.03   },
  'o1':                   { input: 0.015,   output: 0.06   },
  'o1-mini':              { input: 0.003,   output: 0.012  },
  default:                { input: 0.005,   output: 0.015  },
};

function getPricing(modelId) {
  return PRICING[modelId] || PRICING.default;
}

function callApi(modelId, systemPrompt, userPrompt, maxTokens, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:       modelId,
      max_tokens:  maxTokens || 8192,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    });

    const options = {
      hostname: 'api.openai.com',
      path:     '/v1/chat/completions',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization':  `Bearer ${apiKey}`,
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
            const err = new Error(`OpenAI API error: ${parsed.error.message}`);
            err.statusCode = res.statusCode;
            reject(err);
            return;
          }
          const output        = parsed.choices?.[0]?.message?.content || '';
          const input_tokens  = parsed.usage?.prompt_tokens     || 0;
          const output_tokens = parsed.usage?.completion_tokens || 0;
          resolve({ output, input_tokens, output_tokens, latency_ms });
        } catch (e) {
          reject(new Error(`Failed to parse OpenAI response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function createAdapter(modelId, apiKey) {
  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY;
  }
  if (!apiKey) {
    throw new Error('OpenAI API key required. Set OPENAI_API_KEY or pass --api-key.');
  }

  const pricing = getPricing(modelId);

  return {
    id:       modelId,
    provider: 'openai',
    pricing:  { input_per_1k: pricing.input, output_per_1k: pricing.output },

    async execute(prompt, options = {}) {
      const maxTokens    = options.max_tokens    || 8192;
      const systemPrompt = options.system_prompt || 'You are a capable AI assistant completing agentic benchmark tasks.';

      let lastErr;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          return await callApi(modelId, systemPrompt, prompt, maxTokens, apiKey);
        } catch (e) {
          lastErr = e;
          if (e.statusCode && e.statusCode < 500 && e.statusCode !== 429) throw e;
          if (attempt < 3) await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** (attempt - 1), 30000)));
        }
      }
      throw lastErr;
    },

    reset() {},
  };
}

module.exports = { createAdapter, getPricing };

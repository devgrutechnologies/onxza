'use strict';

/**
 * onxza pull — Download and install ONXZA-LLM variants via Ollama.
 *
 * Usage:
 *   onxza pull onxza-llm            # Install mini (default)
 *   onxza pull onxza-llm:mini       # Explicit mini
 *   onxza pull onxza-llm:standard   # Standard variant
 *   onxza pull onxza-llm:pro        # Pro variant
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command } = require('commander');
const { execSync, spawn } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { outputJson, isJsonMode } = require('../util');

// ─── Config ───────────────────────────────────────────────────────────────────

const HF_ORG = 'devgru-tech';
const MODELS = {
  mini: {
    hf_repo: `${HF_ORG}/onxza-llm-mini`,
    ollama_tag: 'onxza-llm:mini',
    description: 'Fast, low resource (3.8B, ~2.5GB VRAM)',
    gguf_file: 'onxza-llm-mini-q4_k_m.gguf',
  },
  standard: {
    hf_repo: `${HF_ORG}/onxza-llm-standard`,
    ollama_tag: 'onxza-llm:standard',
    description: 'Balanced quality and speed (7B, ~4.5GB VRAM)',
    gguf_file: 'onxza-llm-standard-q4_k_m.gguf',
  },
  pro: {
    hf_repo: `${HF_ORG}/onxza-llm-pro`,
    ollama_tag: 'onxza-llm:pro',
    description: 'Maximum capability (7B, higher precision, ~6GB VRAM)',
    gguf_file: 'onxza-llm-pro-q5_k_m.gguf',
  },
};

const DEFAULT_VARIANT = 'mini';
const OLLAMA_MODELS_DIR = path.join(os.homedir(), '.ollama', 'models');
const ONXZA_LLM_MANIFEST = path.join(os.homedir(), '.openclaw', 'onxza-llm.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse "onxza-llm" or "onxza-llm:mini" into { name, variant }.
 */
function parseModelRef(ref) {
  if (!ref || ref === 'onxza-llm') {
    return { name: 'onxza-llm', variant: DEFAULT_VARIANT };
  }
  const [name, variant] = ref.split(':');
  if (!MODELS[variant]) {
    const valid = Object.keys(MODELS).join(', ');
    throw new Error(`Unknown variant "${variant}". Valid variants: ${valid}`);
  }
  return { name: name || 'onxza-llm', variant };
}

/**
 * Check if Ollama is installed and running.
 */
function checkOllama() {
  try {
    execSync('ollama --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the model is already installed in Ollama.
 */
function isModelInstalled(ollamaTag) {
  try {
    const output = execSync('ollama list', { stdio: 'pipe' }).toString();
    return output.includes(ollamaTag.split(':')[0]);
  } catch {
    return false;
  }
}

/**
 * Read the ONXZA-LLM installation manifest.
 */
function readManifest() {
  try {
    if (fs.existsSync(ONXZA_LLM_MANIFEST)) {
      return JSON.parse(fs.readFileSync(ONXZA_LLM_MANIFEST, 'utf8'));
    }
  } catch { /* ignore */ }
  return { installed: {}, default_variant: null };
}

/**
 * Write the ONXZA-LLM installation manifest.
 */
function writeManifest(manifest) {
  fs.mkdirSync(path.dirname(ONXZA_LLM_MANIFEST), { recursive: true });
  fs.writeFileSync(ONXZA_LLM_MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');
}

/**
 * Download a file from a URL to a local path, showing progress.
 */
function downloadFile(url, destPath, label) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    let downloaded = 0;
    let total = 0;
    let lastPct = -1;

    function doRequest(reqUrl) {
      client.get(reqUrl, (res) => {
        // Follow redirects
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
          file.close();
          doRequest(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode} for ${reqUrl}`));
          return;
        }
        total = parseInt(res.headers['content-length'] || '0', 10);
        res.on('data', (chunk) => {
          downloaded += chunk.length;
          file.write(chunk);
          if (total > 0) {
            const pct = Math.floor((downloaded / total) * 100);
            if (pct !== lastPct && pct % 10 === 0) {
              process.stdout.write(`\r  ${label}: ${pct}% (${Math.round(downloaded / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB)`);
              lastPct = pct;
            }
          }
        });
        res.on('end', () => {
          file.end();
          process.stdout.write('\n');
          resolve();
        });
        res.on('error', reject);
      }).on('error', reject);
    }

    doRequest(url);
    file.on('error', reject);
  });
}

/**
 * Create an Ollama Modelfile for the given GGUF model.
 */
function createModelfile(ggufPath, variant) {
  const systemPrompt = [
    'You are ONXZA-LLM, a specialized language model for the ONXZA autonomous agent operating system.',
    'You are trained to: (1) determine optimal model routing for agent tasks, (2) apply the FAAILS Verification Protocol to evaluate outputs, and (3) apply ONXZA ecosystem patterns.',
    'Be concise, decisive, and grounded in the ONXZA routing tiers: local LLM → mid-tier (Grok) → Claude (accuracy-critical only).',
    'When routing, always explain your reasoning before stating your decision.',
  ].join(' ');

  return [
    `FROM ${ggufPath}`,
    `SYSTEM "${systemPrompt}"`,
    'PARAMETER temperature 0.1',
    'PARAMETER top_p 0.9',
    'PARAMETER stop "<|end|>"',
    'PARAMETER stop "<|user|>"',
    'PARAMETER stop "<|assistant|>"',
  ].join('\n');
}

// ─── Main pull logic ───────────────────────────────────────────────────────────

async function pullModel(ref, options) {
  let variant;
  try {
    ({ variant } = parseModelRef(ref));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const model = MODELS[variant];

  if (isJsonMode()) {
    // Will be populated with result at end
  }

  console.log(`\nONXZA-LLM Pull`);
  console.log(`  Variant:  ${variant} — ${model.description}`);
  console.log(`  Source:   huggingface.co/${model.hf_repo}`);
  console.log('');

  // ── 1. Check Ollama ──────────────────────────────────────────────────────────
  if (!checkOllama()) {
    console.error([
      '❌ Ollama is not installed or not in PATH.',
      '',
      'Install Ollama first:',
      '  macOS:   brew install ollama',
      '  Linux:   curl -fsSL https://ollama.com/install.sh | sh',
      '  Windows: https://ollama.com/download',
      '',
      'Then re-run: onxza pull onxza-llm',
    ].join('\n'));
    process.exit(1);
  }
  console.log('✓ Ollama detected');

  // ── 2. Check if already installed ────────────────────────────────────────────
  if (!options.force && isModelInstalled(model.ollama_tag)) {
    console.log(`✓ onxza-llm:${variant} is already installed`);
    const manifest = readManifest();
    console.log(`  Location: ${manifest.installed[variant]?.path || '~/.ollama/models'}`);
    console.log('');
    console.log(`Run with: ollama run ${model.ollama_tag}`);
    return;
  }

  // ── 3. Download GGUF from HuggingFace ────────────────────────────────────────
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onxza-llm-'));
  const ggufDest = path.join(tmpDir, model.gguf_file);
  const modelfileDestPath = path.join(tmpDir, 'Modelfile');

  const hfUrl = `https://huggingface.co/${model.hf_repo}/resolve/main/${model.gguf_file}`;

  console.log(`Downloading ${model.gguf_file}...`);
  console.log(`  From: ${hfUrl}`);

  try {
    await downloadFile(hfUrl, ggufDest, model.gguf_file);
  } catch (err) {
    // Clean up temp dir
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}

    if (err.message.includes('404') || err.message.includes('HTTP 404')) {
      console.error([
        '',
        `❌ Model not yet published: ${model.hf_repo}`,
        '',
        '  ONXZA-LLM v0.1 is in training. The model will be published to HuggingFace',
        '  once the training dataset reaches the minimum threshold (1,000 records).',
        '',
        '  Current dataset progress:',
        '  → Run: node ~/.openclaw/workspace/projects/onxza/training-pipeline/scripts/run-pipeline.js --status',
        '',
        '  Stay updated: https://huggingface.co/devgru-tech',
      ].join('\n'));
      process.exit(1);
    }

    console.error(`❌ Download failed: ${err.message}`);
    process.exit(1);
  }

  // ── 4. Create Modelfile ───────────────────────────────────────────────────────
  const modelfileContent = createModelfile(ggufDest, variant);
  fs.writeFileSync(modelfileDestPath, modelfileContent, 'utf8');
  console.log('✓ Modelfile created');

  // ── 5. Register with Ollama ───────────────────────────────────────────────────
  console.log(`\nRegistering ${model.ollama_tag} with Ollama...`);

  try {
    execSync(`ollama create ${model.ollama_tag} -f ${modelfileDestPath}`, {
      stdio: 'inherit',
    });
  } catch (err) {
    console.error(`❌ Ollama registration failed: ${err.message}`);
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
    process.exit(1);
  }

  // ── 6. Update manifest ────────────────────────────────────────────────────────
  const manifest = readManifest();
  manifest.installed[variant] = {
    ollama_tag: model.ollama_tag,
    hf_repo: model.hf_repo,
    installed_at: new Date().toISOString(),
    path: OLLAMA_MODELS_DIR,
  };
  if (!manifest.default_variant) {
    manifest.default_variant = variant;
  }
  writeManifest(manifest);

  // ── 7. Cleanup temp dir ───────────────────────────────────────────────────────
  try { fs.rmSync(tmpDir, { recursive: true }); } catch {}

  // ── 8. Done ───────────────────────────────────────────────────────────────────
  console.log('');
  console.log(`✅ onxza-llm:${variant} installed successfully`);
  console.log('');
  console.log('Test it:');
  console.log(`  ollama run ${model.ollama_tag}`);
  console.log('');
  console.log('Or via ONXZA routing:');
  console.log('  The model is now available for automatic local routing in the ONXZA ecosystem.');
  console.log('');

  if (isJsonMode()) {
    outputJson({
      status: 'installed',
      variant,
      ollama_tag: model.ollama_tag,
      hf_repo: model.hf_repo,
    });
  }
}

// ─── Command definition ────────────────────────────────────────────────────────

const pullCmd = new Command('pull');

pullCmd
  .description('Download and install an ONXZA model locally via Ollama')
  .argument('[model]', 'Model to install (e.g. onxza-llm or onxza-llm:mini)', 'onxza-llm')
  .option('-f, --force', 'Re-download even if already installed')
  .addHelpText('after', `
Examples:
  $ onxza pull onxza-llm            Install mini variant (default)
  $ onxza pull onxza-llm:standard   Install standard variant
  $ onxza pull onxza-llm:pro        Install pro variant
  $ onxza pull onxza-llm --force    Re-download and reinstall

Variants:
  mini      3.8B — Fast, runs on any Apple Silicon Mac or 8GB+ RAM (~2.5GB)
  standard  7B   — Balanced quality and speed (~4.5GB VRAM)
  pro       7B   — Higher precision, best quality (~6GB VRAM)
  `)
  .action(async (model, options) => {
    await pullModel(model, options);
  });

module.exports = pullCmd;

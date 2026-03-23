'use strict';

/**
 * onxza skill — Skill lifecycle sub-commands.
 *
 * onxza skill install <skill-name>  — Install from skills marketplace
 * onxza skill list                  — List installed skills with versions
 * onxza skill update [skill-name]   — Update to latest version
 * onxza skill publish <path>        — Submit skill to marketplace
 *
 * TICKET-20260318-DTP-013 — skills marketplace backend + CLI wiring
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command } = require('commander');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { outputJson, isJsonMode } = require('../util');

// ─── Config ───────────────────────────────────────────────────────────────────

const MARKETPLACE_BASE_URL =
  process.env.ONXZA_MARKETPLACE_URL || 'https://api.onxza.com/api/v1';

const SKILLS_DIR =
  process.env.ONXZA_SKILLS_DIR ||
  path.join(os.homedir(), '.openclaw', 'workspace', 'shared-learnings', 'global', 'skills');

const CONFIG_PATH =
  process.env.ONXZA_CONFIG || path.join(os.homedir(), '.openclaw', 'marketplace.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return { token: null, installed: {} };
}

function writeConfig(config) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Minimal fetch-like wrapper using Node built-in http/https.
 * Returns { status, body (parsed JSON or raw string) }.
 */
function apiRequest(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const transport = url.protocol === 'https:' ? https : http;
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = transport.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        let body;
        try { body = JSON.parse(raw); } catch { body = raw; }
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ─── Commands ─────────────────────────────────────────────────────────────────

const skillCmd = new Command('skill')
  .description('Manage ONXZA skills (install, list, update, publish)')
  .option('--json', 'Output in JSON format (machine-readable)');


// install
skillCmd
  .command('install <skill-name>')
  .description('Install a skill from the ONXZA skills marketplace')
  .option('--version <version>', 'Install a specific version (default: latest)')
  .action(async (skillName, options) => {
    const jsonMode = isJsonMode(skillCmd);
    try {
      const versionParam = options.version ? `?version=${encodeURIComponent(options.version)}` : '';
      const { status, body } = await apiRequest(
        `${MARKETPLACE_BASE_URL}/skills/${encodeURIComponent(skillName)}${versionParam}`
      );

      if (status === 404) {
        const msg = `Skill "${skillName}" not found in the marketplace.`;
        if (jsonMode) { outputJson({ error: 'not_found', message: msg }); } else { console.error(`  ✗ ${msg}`); }
        process.exitCode = 1;
        return;
      }
      if (status !== 200) {
        const msg = body?.message || `Marketplace returned ${status}`;
        if (jsonMode) { outputJson({ error: 'api_error', message: msg }); } else { console.error(`  ✗ ${msg}`); }
        process.exitCode = 1;
        return;
      }

      const { name, requested_version: version, download_url } = body;
      const destDir = path.join(SKILLS_DIR, name);

      // Check already installed
      const config = readConfig();
      if (config.installed[name] && config.installed[name].version === version && !options.force) {
        const msg = `${name}@${version} is already installed.`;
        if (jsonMode) { outputJson({ status: 'already_installed', name, version }); } else { console.log(`  ${msg}`); }
        return;
      }

      // Download tarball
      if (!download_url) {
        const msg = 'No download URL returned from marketplace.';
        if (jsonMode) { outputJson({ error: 'no_url', message: msg }); } else { console.error(`  ✗ ${msg}`); }
        process.exitCode = 1;
        return;
      }

      if (!jsonMode) console.log(`  ↓ Installing ${name}@${version}…`);

      const tarball = await downloadFile(download_url);
      fs.mkdirSync(destDir, { recursive: true });

      // Extract using system tar (avoids bundling tar for the CLI)
      const tmpFile = path.join(os.tmpdir(), `${name}-${version}.tar.gz`);
      fs.writeFileSync(tmpFile, tarball);
      const { execSync } = require('child_process');
      execSync(`tar -xzf "${tmpFile}" -C "${destDir}" --strip-components=1`, { stdio: 'pipe' });
      fs.rmSync(tmpFile, { force: true });

      // Update installed record
      config.installed[name] = { version, installedAt: new Date().toISOString() };
      writeConfig(config);

      const result = { status: 'installed', name, version, path: destDir };
      if (jsonMode) {
        outputJson(result);
      } else {
        console.log(`  ✓ ${name}@${version} installed to ${destDir}`);
      }
    } catch (err) {
      if (jsonMode) { outputJson({ error: 'install_failed', message: err.message }); }
      else { console.error(`  ✗ Install failed: ${err.message}`); }
      process.exitCode = 1;
    }
  });

// list
skillCmd
  .command('list')
  .description('List installed skills and browse the marketplace')
  .option('--remote', 'List skills available in the marketplace')
  .option('--page <n>', 'Page number (remote only)', '1')
  .option('--query <q>', 'Search query (remote only)')
  .action(async (options) => {
    const jsonMode = isJsonMode(skillCmd);

    if (options.remote) {
      // Remote marketplace listing
      try {
        const params = new URLSearchParams({ page: options.page, limit: '20' });
        if (options.query) params.set('q', options.query);
        const { status, body } = await apiRequest(
          `${MARKETPLACE_BASE_URL}/skills?${params}`
        );
        if (status !== 200) {
          const msg = body?.message || `Marketplace returned ${status}`;
          if (jsonMode) { outputJson({ error: 'api_error', message: msg }); }
          else { console.error(`  ✗ ${msg}`); }
          process.exitCode = 1;
          return;
        }
        if (jsonMode) {
          outputJson(body);
        } else {
          const { skills, total, page, limit } = body;
          console.log(`\n  ONXZA Skills Marketplace (${total} skills — page ${page})\n`);
          if (!skills.length) {
            console.log('  No skills found.');
          } else {
            for (const s of skills) {
              console.log(`  ${s.name.padEnd(28)} v${s.version.padEnd(10)} ${s.description || ''}`);
            }
          }
          if (total > page * limit) {
            console.log(`\n  Run with --page ${Number(page) + 1} to see more.`);
          }
          console.log('');
        }
      } catch (err) {
        if (jsonMode) { outputJson({ error: 'list_failed', message: err.message }); }
        else { console.error(`  ✗ ${err.message}`); }
        process.exitCode = 1;
      }
      return;
    }

    // Local installed listing
    const config = readConfig();
    const installed = Object.entries(config.installed || {});
    if (jsonMode) {
      outputJson({ skills: installed.map(([name, info]) => ({ name, ...info })) });
    } else {
      console.log('\n  Installed Skills\n');
      if (!installed.length) {
        console.log('  No skills installed. Run `onxza skill list --remote` to browse.\n');
      } else {
        for (const [name, info] of installed) {
          console.log(`  ${name.padEnd(28)} v${info.version}`);
        }
        console.log('');
      }
    }
  });

// update
skillCmd
  .command('update [skill-name]')
  .description('Update a skill to the latest version (omit name to update all)')
  .action(async (skillName, _options) => {
    const jsonMode = isJsonMode(skillCmd);
    const config = readConfig();
    const toUpdate = skillName
      ? [[skillName, config.installed[skillName] || {}]]
      : Object.entries(config.installed || {});

    if (!toUpdate.length) {
      const msg = skillName ? `"${skillName}" is not installed.` : 'No skills installed.';
      if (jsonMode) { outputJson({ status: 'nothing_to_update', message: msg }); }
      else { console.log(`  ${msg}`); }
      return;
    }

    const results = [];
    for (const [name, info] of toUpdate) {
      try {
        const { status, body } = await apiRequest(`${MARKETPLACE_BASE_URL}/skills/${encodeURIComponent(name)}`);
        if (status !== 200) {
          results.push({ name, status: 'error', message: body?.message || `API returned ${status}` });
          continue;
        }
        const { requested_version: latestVersion } = body;
        if (info.version === latestVersion) {
          results.push({ name, status: 'up_to_date', version: latestVersion });
          if (!jsonMode) console.log(`  ${name}@${latestVersion} — already up to date`);
          continue;
        }

        // Delegate to install logic by re-invoking the install command programmatically
        // (Simple re-run approach — cleaner than duplicating download logic)
        const { execSync } = require('child_process');
        execSync(`onxza skill install ${name} --version ${latestVersion}`, { stdio: jsonMode ? 'pipe' : 'inherit' });
        results.push({ name, status: 'updated', from: info.version, to: latestVersion });
      } catch (err) {
        results.push({ name, status: 'error', message: err.message });
      }
    }

    if (jsonMode) outputJson({ results });
  });

// publish
skillCmd
  .command('publish <path>')
  .description('Submit a skill to the ONXZA skills marketplace')
  .option('--token <token>', 'Auth token (or set ONXZA_PUBLISH_TOKEN env var)')
  .action(async (skillPath, options) => {
    const jsonMode = isJsonMode(skillCmd);
    const token = options.token || process.env.ONXZA_PUBLISH_TOKEN || readConfig().token;

    if (!token) {
      const msg =
        'Publishing requires authentication. Run `onxza skill login` or set ONXZA_PUBLISH_TOKEN.';
      if (jsonMode) { outputJson({ error: 'auth_required', message: msg }); }
      else { console.error(`  ✗ ${msg}`); }
      process.exitCode = 1;
      return;
    }

    const resolvedPath = path.resolve(skillPath);
    if (!fs.existsSync(resolvedPath)) {
      const msg = `Path not found: ${resolvedPath}`;
      if (jsonMode) { outputJson({ error: 'path_not_found', message: msg }); }
      else { console.error(`  ✗ ${msg}`); }
      process.exitCode = 1;
      return;
    }

    try {
      let tarballPath;

      if (resolvedPath.endsWith('.tar.gz') || resolvedPath.endsWith('.tgz')) {
        tarballPath = resolvedPath;
      } else if (fs.statSync(resolvedPath).isDirectory()) {
        // Pack the directory as a tarball
        if (!jsonMode) console.log(`  Packing ${resolvedPath}…`);
        tarballPath = path.join(os.tmpdir(), `onxza-publish-${Date.now()}.tar.gz`);
        const { execSync } = require('child_process');
        const skillName = path.basename(resolvedPath);
        execSync(
          `tar -czf "${tarballPath}" -C "${path.dirname(resolvedPath)}" "${skillName}"`,
          { stdio: 'pipe' }
        );
      } else {
        const msg = 'Provide a skill directory or a .tar.gz archive.';
        if (jsonMode) { outputJson({ error: 'invalid_path', message: msg }); }
        else { console.error(`  ✗ ${msg}`); }
        process.exitCode = 1;
        return;
      }

      if (!jsonMode) console.log('  Uploading to ONXZA Skills Marketplace…');

      // Upload via multipart POST using Node's built-in (no fetch needed)
      const tarballBuffer = fs.readFileSync(tarballPath);
      const tarballFilename = path.basename(tarballPath);
      const boundary = `----ONXZABoundary${Date.now()}`;

      const header = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="tarball"; filename="${tarballFilename}"\r\n` +
        `Content-Type: application/gzip\r\n\r\n`
      );
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([header, tarballBuffer, footer]);

      const { status, body: responseBody } = await apiRequest(
        `${MARKETPLACE_BASE_URL}/skills/publish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length,
          },
          body,
        }
      );

      // Clean up temp file
      if (tarballPath !== resolvedPath) {
        fs.rmSync(tarballPath, { force: true });
      }

      if (status === 201) {
        if (jsonMode) {
          outputJson(responseBody);
        } else {
          console.log(`  ✓ ${responseBody.name}@${responseBody.version} published successfully.`);
          console.log(`  Download: ${responseBody.download_url}`);
        }
      } else {
        const msg = responseBody?.message || `Publish failed with status ${status}`;
        const errors = responseBody?.errors || [];
        if (jsonMode) {
          outputJson({ error: responseBody?.error || 'publish_failed', message: msg, errors });
        } else {
          console.error(`  ✗ ${msg}`);
          for (const e of errors) console.error(`    - ${e}`);
        }
        process.exitCode = 1;
      }
    } catch (err) {
      if (jsonMode) { outputJson({ error: 'publish_failed', message: err.message }); }
      else { console.error(`  ✗ Publish failed: ${err.message}`); }
      process.exitCode = 1;
    }
  });

// login
skillCmd
  .command('login')
  .description('Authenticate with the ONXZA skills marketplace')
  .option('--username <username>', 'Username')
  .option('--password <password>', 'Password')
  .action(async (options) => {
    const jsonMode = isJsonMode(skillCmd);
    const username = options.username;
    const password = options.password;

    if (!username || !password) {
      if (!jsonMode) console.log('  Use --username and --password to authenticate.\n  Or set ONXZA_PUBLISH_TOKEN directly.');
      process.exitCode = 1;
      return;
    }

    try {
      const payload = JSON.stringify({ username, password });
      const { status, body } = await apiRequest(
        `${MARKETPLACE_BASE_URL}/auth/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          body: payload,
        }
      );

      if (status === 200 && body.token) {
        const config = readConfig();
        config.token = body.token;
        writeConfig(config);
        if (jsonMode) {
          outputJson({ status: 'authenticated', username: body.username });
        } else {
          console.log(`  ✓ Authenticated as ${body.username}. Token saved.`);
        }
      } else {
        const msg = body?.message || 'Authentication failed.';
        if (jsonMode) { outputJson({ error: 'auth_failed', message: msg }); }
        else { console.error(`  ✗ ${msg}`); }
        process.exitCode = 1;
      }
    } catch (err) {
      if (jsonMode) { outputJson({ error: 'login_failed', message: err.message }); }
      else { console.error(`  ✗ ${err.message}`); }
      process.exitCode = 1;
    }
  });

// ─── Utility ──────────────────────────────────────────────────────────────────

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const transport = urlObj.protocol === 'https:' ? https : http;
    transport.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadFile(res.headers.location));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = skillCmd;

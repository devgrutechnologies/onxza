'use strict';

/**
 * ONXZA Skills Marketplace API client.
 *
 * Defines the marketplace API contract. v0.1 uses stub responses — the real
 * HTTP client will replace the STUB_MODE block when the marketplace backend
 * is live (TICKET-20260318-DTP-013).
 *
 * API contract (base: https://api.onxza.com/v1/skills):
 *
 *   GET  /skills/:name              → skill metadata + latest version info
 *   GET  /skills/:name/:version     → specific version metadata + download URL
 *   GET  /skills/:name/versions     → version history array
 *   POST /skills                    → publish a new skill (requires auth token)
 *
 * All responses follow the SkillMeta shape defined below.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const https = require('https');
const http  = require('http');
const path  = require('path');
const fs    = require('fs');

const MARKETPLACE_BASE = process.env.ONXZA_MARKETPLACE_URL || 'https://api.onxza.com/v1/skills';

// ---------------------------------------------------------------------------
// Stub data — used when ONXZA_MARKETPLACE_STUB=true or marketplace unreachable
// ---------------------------------------------------------------------------

const STUB_SKILLS = {
  'skill-fvp-verification': {
    name: 'skill-fvp-verification',
    version: '1.2.0',
    owner: 'DTP_ONXZA_Architect',
    description: 'FVP-001 verification protocol for agent output quality gating.',
    scope: 'global',
    downloadUrl: null, // stub — no real download
    created: '2026-01-10',
    tags: ['fvp', 'quality', 'verification'],
  },
  'skill-ticket-routing': {
    name: 'skill-ticket-routing',
    version: '1.0.3',
    owner: 'DTP_ONXZA_Architect',
    description: 'FAAILS-002 inter-agent ticket routing protocol.',
    scope: 'global',
    downloadUrl: null,
    created: '2026-01-12',
    tags: ['tickets', 'routing', 'communication'],
  },
  'skill-memory-management': {
    name: 'skill-memory-management',
    version: '1.1.0',
    owner: 'DTP_ONXZA_Architect',
    description: 'FAAILS-004 memory isolation and MEMORY.md write protocol.',
    scope: 'global',
    downloadUrl: null,
    created: '2026-01-14',
    tags: ['memory', 'isolation', 'knowledge'],
  },
};

// ---------------------------------------------------------------------------
// SkillMeta shape (reference)
// ---------------------------------------------------------------------------
// {
//   name: string,
//   version: string,
//   owner: string,
//   description: string,
//   scope: 'global' | 'company',
//   downloadUrl: string | null,
//   created: string,        // ISO date
//   tags: string[],
// }

// ---------------------------------------------------------------------------
// HTTP helper — makes a GET request and resolves with parsed JSON
// ---------------------------------------------------------------------------

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { timeout: 8000 }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error('Invalid JSON from marketplace')); }
        } else if (res.statusCode === 404) {
          reject(new Error(`Skill not found (404)`));
        } else {
          reject(new Error(`Marketplace error: HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Marketplace request timed out')));
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const STUB_MODE = process.env.ONXZA_MARKETPLACE_STUB === 'true' || true; // default stub until backend live

/**
 * Fetch skill metadata from the marketplace.
 * @param {string} skillName
 * @param {string} [version]  - specific version, or 'latest'
 * @returns {Promise<object>} SkillMeta
 */
async function fetchSkill(skillName, version) {
  if (STUB_MODE) {
    const meta = STUB_SKILLS[skillName];
    if (!meta) throw new Error(`Skill "${skillName}" not found in marketplace.`);
    if (version && version !== 'latest' && version !== meta.version) {
      throw new Error(`Version ${version} not available. Latest: ${meta.version}`);
    }
    return { ...meta, stub: true };
  }
  const url = version && version !== 'latest'
    ? `${MARKETPLACE_BASE}/${skillName}/${version}`
    : `${MARKETPLACE_BASE}/${skillName}`;
  return httpGet(url);
}

/**
 * Fetch version history for a skill.
 * @param {string} skillName
 * @returns {Promise<string[]>} list of version strings
 */
async function fetchVersions(skillName) {
  if (STUB_MODE) {
    const meta = STUB_SKILLS[skillName];
    if (!meta) throw new Error(`Skill "${skillName}" not found in marketplace.`);
    return [meta.version, '1.0.0']; // stub history
  }
  const data = await httpGet(`${MARKETPLACE_BASE}/${skillName}/versions`);
  return data.versions || [];
}

/**
 * Download skill markdown content from the marketplace.
 * In stub mode, generates a valid TORI-QMD compliant stub skill document.
 * @param {string} skillName
 * @param {object} meta - SkillMeta
 * @returns {Promise<string>} markdown content
 */
async function downloadSkillContent(skillName, meta) {
  if (STUB_MODE || !meta.downloadUrl) {
    // Generate a TORI-QMD-compliant stub skill document
    return generateStubSkillDoc(skillName, meta);
  }
  return new Promise((resolve, reject) => {
    const mod = meta.downloadUrl.startsWith('https') ? https : http;
    mod.get(meta.downloadUrl, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve(raw));
    }).on('error', reject);
  });
}

/**
 * Submit a skill to the marketplace.
 * @param {string} skillPath - local path to the skill .md file
 * @param {string} authToken
 * @returns {Promise<object>} publish result
 */
async function publishSkill(skillPath, authToken) {
  if (STUB_MODE) {
    const name = path.basename(skillPath, '.md');
    return {
      stub: true,
      status: 'accepted',
      message: `Skill "${name}" queued for marketplace review. (Stub — marketplace backend not live yet. See TICKET-DTP-013.)`,
      submittedPath: skillPath,
    };
  }
  // Real implementation: POST multipart/form-data to marketplace
  throw new Error('Live marketplace publish not yet implemented. Set ONXZA_MARKETPLACE_STUB=true.');
}

/**
 * Generate a TORI-QMD compliant stub skill document for newly installed skills.
 */
function generateStubSkillDoc(skillName, meta) {
  const date = new Date().toISOString().split('T')[0];
  return `**Version:** ${meta.version}
**Owner:** ${meta.owner}
**Last Updated:** ${date}
**Scope:** ${meta.scope || 'global'}
**Tags:** ${(meta.tags || []).join(', ')}

# ${skillName}

${meta.description || 'No description provided.'}

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

This skill was installed from the ONXZA skills marketplace. See the marketplace listing for full documentation.

## Usage

Load this skill in your agent's TOOLS.md to grant access to its knowledge domain.

## Notes

- Installed version: ${meta.version}
- Installed: ${date}
- Source: ONXZA Skills Marketplace
`;
}

module.exports = { fetchSkill, fetchVersions, downloadSkillContent, publishSkill, STUB_SKILLS };

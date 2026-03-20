'use strict';

/**
 * ONXZA Skill Registry
 *
 * Tracks all installed skills in a JSON registry file at:
 *   ~/.onxza/skills/registry.json
 *
 * Each entry records the skill name, installed version, scope, install path,
 * install date, and a hash of the content at install time (for dirty detection).
 *
 * Registry schema:
 * {
 *   "version": 1,
 *   "skills": {
 *     "<skill-name>": {
 *       "name": string,
 *       "installedVersion": string,
 *       "scope": "global" | "company",
 *       "installPath": string,
 *       "installedAt": ISO 8601 string,
 *       "tags": string[],
 *       "owner": string
 *     }
 *   }
 * }
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const REGISTRY_DIR  = process.env.ONXZA_HOME
  ? path.join(process.env.ONXZA_HOME, 'skills')
  : path.join(os.homedir(), '.onxza', 'skills');

const REGISTRY_FILE = path.join(REGISTRY_DIR, 'registry.json');

// Shared-learnings base path — skills install here by scope
const SHARED_LEARNINGS_BASE = process.env.ONXZA_WORKSPACE
  ? path.join(process.env.ONXZA_WORKSPACE, 'shared-learnings')
  : path.join(os.homedir(), '.openclaw', 'workspace', 'shared-learnings');

/**
 * Ensure registry directory exists and return the registry object.
 */
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_DIR)) {
    fs.mkdirSync(REGISTRY_DIR, { recursive: true });
  }
  if (!fs.existsSync(REGISTRY_FILE)) {
    return { version: 1, skills: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
  } catch {
    return { version: 1, skills: {} };
  }
}

/**
 * Persist the registry back to disk.
 */
function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2) + '\n', 'utf8');
}

/**
 * Get all installed skills.
 * @returns {object[]} array of skill entries
 */
function listInstalled() {
  const registry = loadRegistry();
  return Object.values(registry.skills);
}

/**
 * Check if a skill is installed.
 * @param {string} skillName
 * @returns {object|null} skill entry or null
 */
function getInstalled(skillName) {
  const registry = loadRegistry();
  return registry.skills[skillName] || null;
}

/**
 * Determine the install path for a skill based on scope.
 * @param {string} skillName
 * @param {string} scope - 'global' | 'company' | 'DTP' | 'WDC' etc.
 * @returns {string} full file path
 */
function resolveInstallPath(skillName, scope) {
  let dir;
  if (!scope || scope === 'global') {
    dir = path.join(SHARED_LEARNINGS_BASE, 'global', 'skills');
  } else {
    dir = path.join(SHARED_LEARNINGS_BASE, scope, 'skills');
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, `${skillName}.md`);
}

/**
 * Write skill content to disk and register it.
 * @param {string} skillName
 * @param {string} content - markdown content
 * @param {object} meta - SkillMeta from marketplace
 * @param {string} [scope] - install scope
 * @returns {string} install path
 */
function installSkill(skillName, content, meta, scope) {
  const installPath = resolveInstallPath(skillName, scope || meta.scope || 'global');
  fs.writeFileSync(installPath, content, 'utf8');

  const registry = loadRegistry();
  registry.skills[skillName] = {
    name: skillName,
    installedVersion: meta.version,
    scope: scope || meta.scope || 'global',
    installPath,
    installedAt: new Date().toISOString(),
    tags: meta.tags || [],
    owner: meta.owner || 'unknown',
  };
  saveRegistry(registry);
  return installPath;
}

/**
 * Remove a skill from registry (and optionally disk).
 * @param {string} skillName
 * @param {boolean} [deleteFile=false]
 */
function uninstallSkill(skillName, deleteFile = false) {
  const registry = loadRegistry();
  const entry = registry.skills[skillName];
  if (entry && deleteFile && fs.existsSync(entry.installPath)) {
    fs.unlinkSync(entry.installPath);
  }
  delete registry.skills[skillName];
  saveRegistry(registry);
}

module.exports = {
  loadRegistry,
  listInstalled,
  getInstalled,
  resolveInstallPath,
  installSkill,
  uninstallSkill,
  REGISTRY_FILE,
  REGISTRY_DIR,
  SHARED_LEARNINGS_BASE,
};

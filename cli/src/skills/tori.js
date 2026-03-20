'use strict';

/**
 * TORI-QMD Validation runner for skill files.
 *
 * Calls the existing validate-tori-qmd.py script from the ONXZA workspace.
 * If the script is not found, falls back to inline validation of skill-type files
 * (checks for version, owner, last_updated/created, and credit line).
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const { execFileSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const TORI_SCRIPT = process.env.ONXZA_TORI_SCRIPT
  || path.join(os.homedir(), '.openclaw', 'workspace', 'scripts', 'validate-tori-qmd.py');

/**
 * Run TORI-QMD validation on a file.
 * @param {string} filePath - absolute path to .md file
 * @returns {{ pass: boolean, message: string }}
 */
function validateFile(filePath) {
  // Prefer the official Python script
  if (fs.existsSync(TORI_SCRIPT)) {
    try {
      const out = execFileSync('python3', [TORI_SCRIPT, filePath], { encoding: 'utf8', timeout: 10000 });
      const pass = out.trim().startsWith('PASS:');
      return { pass, message: out.trim() };
    } catch (err) {
      // Non-zero exit = FAIL output on stderr/stdout
      const out = (err.stdout || '') + (err.stderr || '');
      return { pass: false, message: out.trim() || `TORI-QMD failed: ${err.message}` };
    }
  }

  // Fallback: inline skill validation (skills/patterns must have version, owner, date, credit)
  return inlineSkillValidation(filePath);
}

/**
 * Inline TORI-QMD skill validator (no Python required).
 * Mirrors the skill rules in validate-tori-qmd.py.
 */
function inlineSkillValidation(filePath) {
  const missing = [];
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return { pass: false, message: `FAIL: ${filePath} — cannot read file: ${e.message}` };
  }

  const lower = content.toLowerCase();

  // Version
  if (!/\*\*version:\*\*/i.test(content) && !/^version:/m.test(lower)) {
    missing.push('version');
  }
  // Owner
  if (!/\*\*owner:\*\*/i.test(content) && !/^owner:/m.test(lower)) {
    missing.push('owner');
  }
  // Date: created or last updated
  const hasDate = /\*\*(created|last updated):\*\*/i.test(content)
    || /^(created|last.updated):/m.test(lower);
  if (!hasDate) {
    missing.push("created (or 'last updated')");
  }
  // Credit line
  if (!content.includes('Imagined by Aaron Gear')) {
    missing.push('credit_line (Imagined by Aaron Gear)');
  }

  if (missing.length > 0) {
    return { pass: false, message: `FAIL: ${filePath} — missing: ${missing.join(', ')}` };
  }
  return { pass: true, message: `PASS: ${filePath}` };
}

module.exports = { validateFile };

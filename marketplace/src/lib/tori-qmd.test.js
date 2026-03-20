/**
 * TORI-QMD Validator — Tests
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('assert');
const { validateSkillMd, validateSkillArchive, CREDIT_LINE } = require('./tori-qmd');

const VALID_SKILL_MD = `---
name: weather
version: 1.0.0
owner: devgru-technology-products
created: 2026-03-18
description: Get current weather and forecasts
tags: weather, tools, utilities
credit_line: "${CREDIT_LINE}"
---

# Weather Skill

Instructions for using the weather skill.
`;

describe('validateSkillMd', () => {
  test('accepts a fully valid SKILL.md', () => {
    const result = validateSkillMd(VALID_SKILL_MD);
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
  });

  test('rejects missing frontmatter', () => {
    const result = validateSkillMd('# Just a heading\n\nNo frontmatter here.');
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('frontmatter')));
  });

  test('rejects missing version', () => {
    const bad = VALID_SKILL_MD.replace('version: 1.0.0\n', '');
    const result = validateSkillMd(bad);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('version')));
  });

  test('rejects invalid semver', () => {
    const bad = VALID_SKILL_MD.replace('version: 1.0.0', 'version: v1.0-beta');
    const result = validateSkillMd(bad);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('semver')));
  });

  test('rejects missing owner', () => {
    const bad = VALID_SKILL_MD.replace('owner: devgru-technology-products\n', '');
    const result = validateSkillMd(bad);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('owner')));
  });

  test('rejects missing credit_line', () => {
    const bad = VALID_SKILL_MD.replace(`credit_line: "${CREDIT_LINE}"\n`, '');
    const result = validateSkillMd(bad);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('credit_line')));
  });

  test('rejects wrong credit_line', () => {
    const bad = VALID_SKILL_MD.replace(CREDIT_LINE, 'Wrong credit line.');
    const result = validateSkillMd(bad);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('credit_line')));
  });
});

describe('validateSkillArchive', () => {
  test('accepts archive with valid SKILL.md', () => {
    const files = { 'SKILL.md': VALID_SKILL_MD };
    const result = validateSkillArchive(files);
    assert.strictEqual(result.valid, true);
  });

  test('accepts archive with SKILL.md in subdirectory', () => {
    const files = { 'weather/SKILL.md': VALID_SKILL_MD };
    const result = validateSkillArchive(files);
    assert.strictEqual(result.valid, true);
  });

  test('rejects archive without SKILL.md', () => {
    const files = { 'README.md': '# Something', 'index.js': 'console.log("hi")' };
    const result = validateSkillArchive(files);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('SKILL.md')));
  });

  test('rejects archive with internal data patterns', () => {
    const files = {
      'SKILL.md': VALID_SKILL_MD,
      'config.js': 'const SUPABASE_SERVICE_KEY = "secret123456789";',
    };
    const result = validateSkillArchive(files);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('SUPABASE_SERVICE_KEY')));
  });

  test('rejects archive with internal workspace paths', () => {
    const files = {
      'SKILL.md': VALID_SKILL_MD,
      'notes.md': 'See workspace-dtp-onxza-skillsmarketplace for details.',
    };
    const result = validateSkillArchive(files);
    assert.strictEqual(result.valid, false);
  });
});

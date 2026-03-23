'use strict';

/**
 * Unit tests: MPI Task Loader
 *
 * Tests cover:
 *   - YAML parser
 *   - loadCorpus (valid, missing dir, missing type dirs)
 *   - validateCorpus (required fields, type distribution, duplicate IDs)
 *
 * TICKET-20260323-DTP-MPI-PHASE6-CLI-IMPL
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const { loadCorpus, validateCorpus, parseYaml, TASK_TYPES } = require('../../src/lib/mpi/task-loader');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌  ${name}`);
    console.error(`       ${e.message}`);
    failures.push({ name, error: e.message });
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ---------------------------------------------------------------------------
// Temp corpus builder
// ---------------------------------------------------------------------------

function makeTempCorpus(opts = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpi-test-'));

  const types = opts.types || TASK_TYPES;
  const tasksPerType = opts.tasksPerType !== undefined ? opts.tasksPerType : 5;

  for (const type of types) {
    const typeDir = path.join(dir, type);
    fs.mkdirSync(typeDir, { recursive: true });

    for (let i = 1; i <= tasksPerType; i++) {
      const yaml = [
        `task_id: "${type.toUpperCase()}-00${i}"`,
        `task_type: "${type}"`,
        `complexity: "moderate"`,
        `title: "Test task ${type} ${i}"`,
        `description: |`,
        `  Do a thing for ${type} task ${i}.`,
        `acceptance_criteria:`,
        `  - "Output is not empty"`,
        `  - "Output mentions ${type}"`,
        `  - "Output is readable"`,
      ].join('\n');
      fs.writeFileSync(path.join(typeDir, `${type.toUpperCase()}-00${i}.yaml`), yaml);
    }
  }

  return dir;
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

// ---------------------------------------------------------------------------
// Test: YAML Parser
// ---------------------------------------------------------------------------

console.log('\n── YAML Parser ──────────────────────────────────────────────');

test('parses basic key-value pairs', () => {
  const obj = parseYaml('task_id: "CODING-001"\ntask_type: "coding"\n');
  assertEq(obj.task_id,   'CODING-001');
  assertEq(obj.task_type, 'coding');
});

test('parses boolean values', () => {
  const obj = parseYaml('enabled: true\nflag: false\n');
  assertEq(obj.enabled, true);
  assertEq(obj.flag,    false);
});

test('parses numeric values', () => {
  const obj = parseYaml('max_token_budget: 4096\n');
  assertEq(obj.max_token_budget, 4096);
});

test('parses block scalar (|)', () => {
  const yaml = 'description: |\n  Line 1.\n  Line 2.\n';
  const obj  = parseYaml(yaml);
  assert(obj.description.includes('Line 1.'), `Expected description to include Line 1, got: ${obj.description}`);
  assert(obj.description.includes('Line 2.'), `Expected description to include Line 2, got: ${obj.description}`);
});

test('parses list items (-)', () => {
  const yaml = 'acceptance_criteria:\n  - "Criterion A"\n  - "Criterion B"\n';
  const obj  = parseYaml(yaml);
  assert(Array.isArray(obj.acceptance_criteria),
    `acceptance_criteria should be an array, got ${typeof obj.acceptance_criteria}`);
});

test('ignores comment lines', () => {
  const yaml = '# This is a comment\ntask_id: "T-001"\n';
  const obj  = parseYaml(yaml);
  assertEq(obj.task_id, 'T-001');
  assert(!obj['# This is a comment'], 'Comments should not appear as keys');
});

// ---------------------------------------------------------------------------
// Test: loadCorpus
// ---------------------------------------------------------------------------

console.log('\n── loadCorpus ───────────────────────────────────────────────');

test('loadCorpus returns error when directory does not exist', () => {
  const { tasks, errors } = loadCorpus('/tmp/does-not-exist-mpi-test-xyz');
  assert(errors.length > 0, 'Should return errors for missing dir');
  assertEq(tasks.length, 0);
});

test('loadCorpus loads 20 tasks from standard corpus', () => {
  const dir = makeTempCorpus();
  try {
    const { tasks, errors } = loadCorpus(dir);
    assertEq(errors.length, 0, `Unexpected load errors: ${errors.join('; ')}`);
    assertEq(tasks.length, 20, `Expected 20 tasks, got ${tasks.length}`);
  } finally {
    cleanup(dir);
  }
});

test('loadCorpus returns error for missing type directory', () => {
  const dir = makeTempCorpus({ types: ['coding', 'reasoning'] }); // missing writing + planning
  try {
    const { errors } = loadCorpus(dir);
    assert(errors.some(e => e.includes('writing')),
      `Expected error about missing 'writing' dir, got: ${errors.join('; ')}`);
    assert(errors.some(e => e.includes('planning')),
      `Expected error about missing 'planning' dir, got: ${errors.join('; ')}`);
  } finally {
    cleanup(dir);
  }
});

test('loadCorpus loads tasks from all 4 type subdirs', () => {
  const dir = makeTempCorpus();
  try {
    const { tasks } = loadCorpus(dir);
    for (const type of TASK_TYPES) {
      const typeCount = tasks.filter(t => t.task_type === type).length;
      assertEq(typeCount, 5, `Expected 5 ${type} tasks, got ${typeCount}`);
    }
  } finally {
    cleanup(dir);
  }
});

test('loadCorpus does not crash on empty type directory', () => {
  const dir = makeTempCorpus({ tasksPerType: 0 });
  try {
    const { tasks, errors } = loadCorpus(dir);
    // Will have errors due to 0 tasks, but should not throw
    assertEq(tasks.length, 0);
  } finally {
    cleanup(dir);
  }
});

// ---------------------------------------------------------------------------
// Test: validateCorpus
// ---------------------------------------------------------------------------

console.log('\n── validateCorpus ───────────────────────────────────────────');

test('valid 20-task corpus passes validation', () => {
  const dir = makeTempCorpus();
  try {
    const { tasks } = loadCorpus(dir);
    const { valid, errors } = validateCorpus(tasks);
    assert(valid, `Expected valid corpus, got errors: ${errors.join('; ')}`);
    assertEq(errors.length, 0);
  } finally {
    cleanup(dir);
  }
});

test('validateCorpus fails when fewer than 5 tasks per type', () => {
  const dir = makeTempCorpus({ tasksPerType: 3 }); // 3 per type, need 5
  try {
    const { tasks } = loadCorpus(dir);
    const { valid, errors } = validateCorpus(tasks);
    assert(!valid, 'Should be invalid with only 3 tasks per type');
    assert(errors.some(e => e.includes('Insufficient')),
      `Expected "Insufficient" error, got: ${errors.join('; ')}`);
  } finally {
    cleanup(dir);
  }
});

test('validateCorpus fails on empty corpus', () => {
  const { valid, errors } = validateCorpus([]);
  assert(!valid, 'Empty corpus should be invalid');
  assert(errors.some(e => e.includes('empty')), `Expected empty error, got: ${errors.join('; ')}`);
});

test('validateCorpus fails on duplicate task_id', () => {
  const dir = makeTempCorpus();
  try {
    const { tasks } = loadCorpus(dir);
    // Duplicate the first task
    const dup = { ...tasks[0], _file: 'dup' };
    tasks.push(dup);
    const { errors } = validateCorpus(tasks);
    assert(errors.some(e => e.includes('Duplicate')),
      `Expected duplicate error, got: ${errors.join('; ')}`);
  } finally {
    cleanup(dir);
  }
});

test('validateCorpus fails on invalid task_type', () => {
  const tasks = [{
    task_id: 'T-001',
    task_type: 'hacking', // invalid
    title: 'Test',
    description: 'Desc',
    acceptance_criteria: ['Pass'],
  }];
  const { errors } = validateCorpus(tasks);
  assert(errors.some(e => e.includes('invalid task_type')),
    `Expected invalid task_type error, got: ${errors.join('; ')}`);
});

test('validateCorpus fails when task is missing required fields', () => {
  const tasks = [{
    task_type: 'coding',
    // missing task_id, title, description, acceptance_criteria
  }];
  const { errors } = validateCorpus(tasks);
  assert(errors.some(e => e.includes('task_id')), 'Should flag missing task_id');
  assert(errors.some(e => e.includes('title')),   'Should flag missing title');
});

test('validateCorpus fails when acceptance_criteria is empty', () => {
  const tasks = [{
    task_id:    'T-001',
    task_type:  'coding',
    title:      'Test',
    description:'Desc',
    acceptance_criteria: [],
  }];
  const { errors } = validateCorpus(tasks);
  assert(errors.some(e => e.includes('acceptance_criteria')),
    `Expected acceptance_criteria error, got: ${errors.join('; ')}`);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n────────────────────────────────────────────────────────────');
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.error('\n  FAILURES:');
  failures.forEach(f => console.error(`    ❌ ${f.name}: ${f.error}`));
}
console.log('');

process.exit(failed > 0 ? 1 : 0);

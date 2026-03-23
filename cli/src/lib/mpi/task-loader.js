'use strict';

/**
 * MPI Task Loader — loads and validates YAML task corpus from disk.
 *
 * Implements MPI-HARNESS-SPEC-v0.1 §4 (Task Corpus Architecture)
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const fs   = require('fs');
const path = require('path');

const TASK_TYPES    = ['coding', 'reasoning', 'writing', 'planning'];
const COMPLEXITIES  = ['simple', 'moderate', 'complex'];
const MIN_PER_TYPE  = 5;

// ---------------------------------------------------------------------------
// Minimal YAML parser (no deps — handles the subset used in task files)
// ---------------------------------------------------------------------------

/**
 * Parse a simple YAML file to a JS object.
 * Supports: scalar strings/numbers/booleans, multi-line blocks (|), lists (-), nested keys.
 * NOT a full YAML parser — sufficient for well-formed task files.
 */
function parseYaml(text) {
  const lines = text.split('\n');
  const root  = {};
  const stack = [{ indent: -1, obj: root }];
  let i = 0;

  function current() { return stack[stack.length - 1]; }

  function parseScalar(v) {
    v = v.trim();
    if (v === 'true')  return true;
    if (v === 'false') return false;
    if (v === 'null' || v === '~') return null;
    const n = Number(v);
    if (!isNaN(n) && v !== '') return n;
    // Strip surrounding quotes
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }
    return v;
  }

  while (i < lines.length) {
    const raw   = lines[i];
    const line  = raw.replace(/\r$/, '');
    const stripped = line.trimStart();

    // Skip comments + empty
    if (!stripped || stripped.startsWith('#')) { i++; continue; }

    const indent = line.length - stripped.length;

    // Pop stack to correct depth
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = current();

    // List item
    if (stripped.startsWith('- ') || stripped === '-') {
      const val = stripped.startsWith('- ') ? stripped.slice(2).trim() : '';
      // Use _listParent/_listKey tracking set when empty-value key was pushed onto stack
      const frame = current();
      if (frame._listParent !== undefined && frame._listKey !== undefined) {
        if (!Array.isArray(frame._listParent[frame._listKey])) {
          frame._listParent[frame._listKey] = [];
        }
        frame._listParent[frame._listKey].push(val ? parseScalar(val) : {});
      }
      i++;
      continue;
    }

    const colonIdx = stripped.indexOf(':');
    if (colonIdx === -1) { i++; continue; }

    const key = stripped.slice(0, colonIdx).trim();
    const rest = stripped.slice(colonIdx + 1);

    // Block scalar (|)
    if (rest.trim() === '|') {
      i++;
      let block = '';
      const blockIndent = indent + 2;
      while (i < lines.length) {
        const bl = lines[i].replace(/\r$/, '');
        if (bl.trim() === '' || (bl.length - bl.trimStart().length) >= blockIndent) {
          block += (bl.trim() === '' ? '' : bl.slice(blockIndent)) + '\n';
          i++;
        } else {
          break;
        }
      }
      parent.obj[key] = block;
      parent.lastKey  = key;
      continue;
    }

    const val = rest.trim();

    if (val === '' || val === null) {
      // Next lines may be nested object keys or list items.
      // We use a sentinel value — if followed by list items, the receiver code
      // will overwrite with an array via _listParent/_listKey.
      parent.obj[key] = {};
      const child = {
        indent,
        obj:         parent.obj[key],
        lastKey:     null,
        list:        null,
        _listParent: parent.obj,
        _listKey:    key,
      };
      stack.push(child);
      parent.lastKey = key;
      i++;
      continue;
    }

    // Check if this is a list starter [ ... ] inline
    if (val.startsWith('[')) {
      const inner = val.slice(1, val.endsWith(']') ? val.length - 1 : val.length);
      parent.obj[key] = inner.split(',').map(s => parseScalar(s.trim())).filter(s => s !== '');
    } else {
      parent.obj[key] = parseScalar(val);
    }

    parent.lastKey = key;
    i++;
  }

  return root;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load a task corpus directory.
 * Returns { tasks: TaskResult[], manifest, errors[] }
 */
function loadCorpus(corpusDir) {
  const errors = [];
  const tasks  = [];

  if (!fs.existsSync(corpusDir)) {
    return { tasks: [], manifest: null, errors: [`Corpus directory not found: ${corpusDir}`] };
  }

  // Read manifest if present
  let manifest = null;
  const manifestPath = path.join(corpusDir, 'corpus-manifest.yaml');
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = parseYaml(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      errors.push(`Failed to parse corpus-manifest.yaml: ${e.message}`);
    }
  }

  // Load task files from type subdirectories
  for (const type of TASK_TYPES) {
    const typeDir = path.join(corpusDir, type);
    if (!fs.existsSync(typeDir)) {
      errors.push(`Missing type directory: ${type}/`);
      continue;
    }

    const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    for (const file of files) {
      const filePath = path.join(typeDir, file);
      try {
        const raw  = fs.readFileSync(filePath, 'utf8');
        const task = parseYaml(raw);
        task._file = filePath;
        tasks.push(task);
      } catch (e) {
        errors.push(`Failed to parse ${filePath}: ${e.message}`);
      }
    }
  }

  return { tasks, manifest, errors };
}

/**
 * Validate a loaded corpus.
 * Returns { valid: boolean, errors: string[], warnings: string[] }
 */
function validateCorpus(tasks) {
  const errors   = [];
  const warnings = [];
  const ids      = new Set();

  // Per-task validation
  for (const task of tasks) {
    const file = task._file || task.task_id || '(unknown)';

    if (!task.task_id)   errors.push(`${file}: missing task_id`);
    if (!task.task_type) errors.push(`${file}: missing task_type`);
    if (!task.title)     errors.push(`${file}: missing title`);
    if (!task.description) errors.push(`${file}: missing description`);

    if (task.task_type && !TASK_TYPES.includes(task.task_type)) {
      errors.push(`${file}: invalid task_type "${task.task_type}" — must be one of ${TASK_TYPES.join(', ')}`);
    }

    if (task.complexity && !COMPLEXITIES.includes(task.complexity)) {
      errors.push(`${file}: invalid complexity "${task.complexity}" — must be one of ${COMPLEXITIES.join(', ')}`);
    }

    if (!task.acceptance_criteria || !Array.isArray(task.acceptance_criteria) || task.acceptance_criteria.length < 1) {
      errors.push(`${file}: acceptance_criteria must be a non-empty array`);
    }

    if (task.task_id) {
      if (ids.has(task.task_id)) {
        errors.push(`Duplicate task_id: ${task.task_id}`);
      }
      ids.add(task.task_id);
    }
  }

  // Type distribution
  for (const type of TASK_TYPES) {
    const count = tasks.filter(t => t.task_type === type).length;
    if (count < MIN_PER_TYPE) {
      errors.push(`Insufficient tasks for type "${type}": ${count} (minimum ${MIN_PER_TYPE})`);
    }
  }

  if (tasks.length === 0) {
    errors.push('Corpus is empty — no tasks found');
  }

  return { valid: errors.length === 0, errors, warnings };
}

module.exports = { loadCorpus, validateCorpus, TASK_TYPES, parseYaml };

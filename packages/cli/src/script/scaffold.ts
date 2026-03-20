/**
 * Script Scaffold — generates new script files from tier-aware templates.
 *
 * Each generated file includes a frontmatter comment header parseable by
 * the registry loader. Templates are tier-aware: Tier 3 is a complete
 * runnable example; Tier 2 shows the LLM integration pattern; Tier 1
 * documents that the task is not yet scripted.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import fs   from 'fs';
import path from 'path';
import {
  ScriptTier, ScriptLanguage,
  LANGUAGE_EXTENSIONS, LANGUAGE_RUNNERS, TIER_DESCRIPTIONS,
} from './schema.js';
import { getScriptsDir } from './registry.js';

// ---------------------------------------------------------------------------
// Template generators (tier × language)
// ---------------------------------------------------------------------------

function tier3Bash(name: string, description: string, date: string): string {
  return `#!/usr/bin/env bash
# onxza-script
# name: ${name}
# tier: 3
# description: ${description}
# created: ${date}
# language: bash
#
# Tier 3 — Pure script. Zero LLM tokens. Run via cron or manually.
# Edit this file, then test with: onxza script run ${name} --dry-run
#
# Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
# Powered by DevGru US Inc. DBA DevGru Technology Products.

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────
WORKSPACE="\${ONXZA_WORKSPACE:-\$HOME/.openclaw/workspace}"
LOG_DIR="\$WORKSPACE/logs"
TIMESTAMP=\$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── Main ───────────────────────────────────────────────────────────────────
echo "[\$TIMESTAMP] ${name} started"

# TODO: Implement your automation logic here.
# Examples:
#   - Generate a daily summary: find \$WORKSPACE/tickets/closed/ -newer ...
#   - Deploy files: rsync -av dist/ user@host:/var/www/
#   - Run health checks: curl -fsSL https://your-site.com/health

echo "[\$TIMESTAMP] ${name} complete"
`;
}

function tier3Python(name: string, description: string, date: string): string {
  return `#!/usr/bin/env python3
# onxza-script
# name: ${name}
# tier: 3
# description: ${description}
# created: ${date}
# language: python
#
# Tier 3 — Pure script. Zero LLM tokens. Run via cron or manually.
# Edit this file, then test with: onxza script run ${name} --dry-run
#
# Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
# Powered by DevGru US Inc. DBA DevGru Technology Products.

import os
import sys
from datetime import datetime, timezone

WORKSPACE = os.environ.get('ONXZA_WORKSPACE',
                           os.path.join(os.path.expanduser('~'), '.openclaw', 'workspace'))

def main():
    ts = datetime.now(timezone.utc).isoformat()
    print(f"[{ts}] ${name} started")

    # TODO: Implement your automation logic here.

    print(f"[{ts}] ${name} complete")

if __name__ == '__main__':
    main()
`;
}

function tier3Node(name: string, description: string, date: string): string {
  return `#!/usr/bin/env node
// onxza-script
// name: ${name}
// tier: 3
// description: ${description}
// created: ${date}
// language: node
//
// Tier 3 — Pure script. Zero LLM tokens. Run via cron or manually.
// Edit this file, then test with: onxza script run ${name} --dry-run
//
// Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
// Powered by DevGru US Inc. DBA DevGru Technology Products.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const WORKSPACE = process.env.ONXZA_WORKSPACE
  ?? path.join(os.homedir(), '.openclaw', 'workspace');

async function main() {
  const ts = new Date().toISOString();
  console.log(\`[\${ts}] ${name} started\`);

  // TODO: Implement your automation logic here.

  console.log(\`[\${ts}] ${name} complete\`);
}

main().catch(err => { console.error(err); process.exit(1); });
`;
}

function tier2Bash(name: string, description: string, date: string): string {
  return `#!/usr/bin/env bash
# onxza-script
# name: ${name}
# tier: 2
# description: ${description}
# created: ${date}
# language: bash
#
# Tier 2 — Script + LLM hybrid.
# Script handles the mechanical parts (data gathering, file I/O, API calls).
# LLM handles judgment (content quality, classification, decisions).
# Goal: push toward Tier 3 by encoding LLM judgment as rules over time.
# Push-to-Tier-3 tip: run 5+ times, then check: onxza script list
#
# Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
# Powered by DevGru US Inc. DBA DevGru Technology Products.

set -euo pipefail

WORKSPACE="\${ONXZA_WORKSPACE:-\$HOME/.openclaw/workspace}"
TIMESTAMP=\$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "[\$TIMESTAMP] ${name} — gathering data..."

# ── Step 1: Gather mechanical data (no LLM) ───────────────────────────────
INPUT_DATA="TODO: gather data here"

# ── Step 2: Call LLM for judgment ─────────────────────────────────────────
# Example: pipe data to an agent via openclaw or a direct API call.
# LLM_RESULT=\$(echo "\$INPUT_DATA" | your-llm-call-here)
LLM_RESULT="TODO: LLM judgment result"

# ── Step 3: Act on LLM output (no LLM) ───────────────────────────────────
echo "[\$TIMESTAMP] ${name} — LLM result: \$LLM_RESULT"

echo "[\$TIMESTAMP] ${name} complete"
`;
}

function tier1Bash(name: string, description: string, date: string): string {
  return `#!/usr/bin/env bash
# onxza-script
# name: ${name}
# tier: 1
# description: ${description}
# created: ${date}
# language: bash
#
# Tier 1 — LLM reasoning required. No automation script yet.
# This file documents the task and records run attempts.
# Goal: identify repeatable patterns, then promote to Tier 2 → Tier 3.
# Push-to-Tier-3 tip: after 3 manual runs, document the pattern and
#   create a Tier 2 version that scripts the mechanical parts.
#
# Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
# Powered by DevGru US Inc. DBA DevGru Technology Products.

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ${name} — Tier 1 task"
echo "  This task currently requires LLM reasoning."
echo "  Description: ${description}"
echo ""
echo "  To automate:"
echo "    1. Run this task 3+ times manually and document the steps"
echo "    2. Create a Tier 2 version: onxza script create ${name}-v2 --tier 2"
echo "    3. Encode LLM judgment as rules to reach Tier 3"
echo ""
echo "  See: ARCHITECTURE.md §10.2 — Automation Tier Framework"
`;
}

// ---------------------------------------------------------------------------
// Template dispatcher
// ---------------------------------------------------------------------------

function getTemplate(
  name:        string,
  tier:        ScriptTier,
  language:    ScriptLanguage,
  description: string,
  date:        string,
): string {
  if (tier === 3) {
    if (language === 'python') return tier3Python(name, description, date);
    if (language === 'node')   return tier3Node(name, description, date);
    return tier3Bash(name, description, date);
  }
  if (tier === 2) {
    // Tier 2 bash is the main template; python/node get similar structure
    return tier2Bash(name, description, date);
  }
  // Tier 1 — same template regardless of language (it's a documentation stub)
  return tier1Bash(name, description, date);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ScaffoldResult {
  name:     string;
  path:     string;
  tier:     ScriptTier;
  language: ScriptLanguage;
}

/**
 * Create a new script file from the appropriate template.
 * Returns the absolute path of the created file.
 * Throws if a file already exists at that path.
 */
export function scaffoldScript(
  name:        string,
  tier:        ScriptTier,
  language:    ScriptLanguage,
  description: string,
): ScaffoldResult {
  const scriptsDir = getScriptsDir();
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }

  const ext      = LANGUAGE_EXTENSIONS[language];
  const filename = `${name}${ext}`;
  const fullPath = path.join(scriptsDir, filename);

  if (fs.existsSync(fullPath)) {
    throw new Error(`Script file already exists: ${fullPath}`);
  }

  const date    = new Date().toISOString().split('T')[0]!;
  const content = getTemplate(name, tier, language, description, date);

  fs.writeFileSync(fullPath, content, 'utf8');
  fs.chmodSync(fullPath, 0o755);

  return { name, path: fullPath, tier, language };
}

/**
 * Parse the frontmatter comment header from a script file.
 * Returns partial metadata — caller should merge with registry defaults.
 */
export function parseScriptMeta(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').slice(0, 20);
  const meta: Record<string, string> = {};
  for (const line of lines) {
    // Matches: # key: value  OR  // key: value
    const m = line.match(/^(?:#|\/\/)\s+([a-z-]+):\s*(.+)$/);
    if (m && m[1] && m[2]) {
      meta[m[1].trim()] = m[2].trim();
    }
  }
  return meta;
}

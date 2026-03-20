/**
 * @onxza/core — Checkpoint system
 * Creates snapshots before every irreversible action.
 * Structure per ARCHITECTURE-v0.1.md §6.5.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
  copyFileSync,
  statSync,
} from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import type { CheckpointManifest, CheckpointSummary, CheckpointTrigger } from '../types.js';
import { ONXZA_VERSION, CREDIT_LINE } from '../types.js';
import { getOpenclawRoot, getConfigPath } from '../config/index.js';

// ── Paths ──────────────────────────────────────────────────────────────────────

export function getCheckpointsDir(root?: string): string {
  return join(getOpenclawRoot(root), 'checkpoints');
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').slice(0, 60);
}

// ── Vision hash helpers ────────────────────────────────────────────────────────

function sha256File(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

function findVisionFiles(workspaceDir: string): string[] {
  const results: string[] = [];
  if (!existsSync(workspaceDir)) return results;

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.') || entry === 'node_modules') continue;
      const full = join(dir, entry);
      try {
        const s = statSync(full);
        if (s.isDirectory()) {
          walk(full);
        } else if (entry.toLowerCase() === 'vision.md') {
          results.push(full);
        }
      } catch { /* skip */ }
    }
  }

  walk(workspaceDir);
  return results.sort();
}

// ── Create ─────────────────────────────────────────────────────────────────────

export interface CreateCheckpointOptions {
  slug: string;
  trigger: CheckpointTrigger;
  agentId?: string;
  description?: string;
  includeVisionHashes?: boolean;
  root?: string;
}

export function createCheckpoint(options: CreateCheckpointOptions): CheckpointSummary {
  const {
    slug,
    trigger,
    agentId = 'onxza-cli',
    description = '',
    includeVisionHashes = false,
    root,
  } = options;

  const openclawRoot = getOpenclawRoot(root);
  const checkpointsDir = getCheckpointsDir(root);
  const workspaceDir = join(openclawRoot, 'workspace');

  const now = new Date();
  const safeSlug = sanitizeSlug(slug);
  const checkpointId = `${formatTimestamp(now)}-${safeSlug}`;
  const checkpointDir = join(checkpointsDir, checkpointId);

  mkdirSync(checkpointDir, { recursive: true });

  // 1. Copy openclaw.json
  const configPath = getConfigPath(root);
  if (existsSync(configPath)) {
    copyFileSync(configPath, join(checkpointDir, 'openclaw.json'));
  }

  // 2. agents-list.txt
  let agentIds: string[] = [];
  if (existsSync(configPath)) {
    try {
      const cfg = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
      const agentsList = ((cfg['agents'] as Record<string, unknown>)?.['list'] as unknown[]) ?? [];
      agentIds = (agentsList as Array<Record<string, unknown>>).map((a) => String(a['id'] ?? '')).filter(Boolean);
    } catch { /* ok */ }
  }
  writeFileSync(
    join(checkpointDir, 'agents-list.txt'),
    `# Agent Registry — ${checkpointId}\n# Total: ${agentIds.length}\n\n${agentIds.join('\n')}\n`,
    'utf-8'
  );

  // 3. Vision hashes (optional)
  const visionHashes: Record<string, string> = {};
  if (includeVisionHashes && existsSync(workspaceDir)) {
    const visionFiles = findVisionFiles(workspaceDir);
    for (const vf of visionFiles) {
      const rel = vf.replace(workspaceDir + '/', '');
      visionHashes[rel] = sha256File(vf);
    }
    if (Object.keys(visionHashes).length > 0) {
      const lines = Object.entries(visionHashes).map(([p, h]) => `${h}  ${p}`);
      writeFileSync(
        join(checkpointDir, 'vision-hashes.txt'),
        `# Vision Document Hashes — ${checkpointId}\n# Generated: ${now.toISOString()}\n# Total: ${lines.length}\n# Format: sha256  relative/path\n\n${lines.join('\n')}\n`,
        'utf-8'
      );
    }
  }

  // 4. manifest.json
  const manifest: CheckpointManifest = {
    version: ONXZA_VERSION,
    timestamp: now.toISOString(),
    trigger,
    agentId,
    onxzaVersion: ONXZA_VERSION,
    description: description || `Checkpoint: ${trigger}`,
    agentCount: agentIds.length,
    ...(Object.keys(visionHashes).length > 0 ? { visionHashes } : {}),
  };
  writeFileSync(join(checkpointDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  // 5. README.md
  const readme = `# Checkpoint: ${checkpointId}

**Created:** ${now.toISOString()}
**Trigger:** ${trigger}
**Agent:** ${agentId}
**Agents registered:** ${agentIds.length}

## Restore Instructions

### Restore agent registry:
\`\`\`bash
cp ${configPath} ${configPath}.backup
cp ${join(checkpointDir, 'openclaw.json')} ${configPath}
openclaw gateway restart
\`\`\`

---
*${CREDIT_LINE}*
`;
  writeFileSync(join(checkpointDir, 'README.md'), readme, 'utf-8');

  // 6. Append to checkpoint.log
  const logPath = join(workspaceDir, 'logs', 'checkpoint.log');
  try {
    mkdirSync(join(workspaceDir, 'logs'), { recursive: true });
    const logEntry = `checkpoint created: ${checkpointId}\n`;
    const existing = existsSync(logPath) ? readFileSync(logPath, 'utf-8') : '';
    writeFileSync(logPath, existing + logEntry, 'utf-8');
  } catch { /* non-fatal */ }

  return {
    id: checkpointId,
    directory: checkpointDir,
    manifest,
  };
}

// ── List ───────────────────────────────────────────────────────────────────────

export function listCheckpoints(root?: string): CheckpointSummary[] {
  const checkpointsDir = getCheckpointsDir(root);
  if (!existsSync(checkpointsDir)) return [];

  const results: CheckpointSummary[] = [];

  for (const entry of readdirSync(checkpointsDir).sort().reverse()) {
    const cpDir = join(checkpointsDir, entry);
    try {
      if (!statSync(cpDir).isDirectory()) continue;
    } catch { continue; }

    const manifestPath = join(cpDir, 'manifest.json');
    if (!existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as CheckpointManifest;
      results.push({ id: entry, directory: cpDir, manifest });
    } catch { /* skip */ }
  }

  return results;
}

export function getCheckpoint(id: string, root?: string): CheckpointSummary | undefined {
  const checkpointsDir = getCheckpointsDir(root);
  const cpDir = join(checkpointsDir, id);
  if (!existsSync(cpDir)) return undefined;

  const manifestPath = join(cpDir, 'manifest.json');
  if (!existsSync(manifestPath)) return undefined;

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as CheckpointManifest;
    return { id, directory: cpDir, manifest };
  } catch {
    return undefined;
  }
}

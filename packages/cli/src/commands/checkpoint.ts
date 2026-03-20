/**
 * onxza checkpoint — Checkpoint management sub-commands.
 *
 * Sub-commands:
 *   create [--slug <s>]    Create a manual checkpoint
 *   list                   List all checkpoints
 *
 * Spec: ARCHITECTURE-v0.1.md §6.5, §7.11
 *
 * Core dependency: @onxza/core/checkpoint — NOT YET BUILT.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command } from 'commander';
import { setOutputContext } from '../util/output.js';

// ---------------------------------------------------------------------------
// checkpoint create
// ---------------------------------------------------------------------------

function makeCheckpointCreateCommand(): Command {
  return new Command('create')
    .description('Create a manual safety checkpoint of the current installation state')
    .option('--slug <slug>',  'Human-readable checkpoint label (e.g. pre-deploy)')
    .option('--json',         'Machine-readable JSON output')
    .action(async (opts) => {
      setOutputContext({ json: !!opts.json });

      const slug = (opts.slug as string | undefined) ?? 'manual';

      // TODO: import { createCheckpoint } from '@onxza/core';
      // const result = await createCheckpoint({ slug, trigger: 'manual', agentId: 'onxza-cli' });

      _notYetImplemented('checkpoint create', {
        slug,
        outputStructure: {
          'manifest.json': '{ version, timestamp, trigger: "manual", agentId, onxzaVersion, description }',
          'openclaw.json': 'full copy at checkpoint time',
          'README.md':     'human-readable description',
        },
        outputShape: '{ id: string, path: string, manifest: CheckpointManifest }',
      });
    });
}

// ---------------------------------------------------------------------------
// checkpoint list
// ---------------------------------------------------------------------------

function makeCheckpointListCommand(): Command {
  return new Command('list')
    .description('List all checkpoints')
    .option('--limit <n>',   'Maximum number to show (default: 20)', '20')
    .option('--json',        'Machine-readable JSON output')
    .action(async (opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { listCheckpoints } from '@onxza/core';
      // const checkpoints = await listCheckpoints({ limit: parseInt(opts.limit, 10) });

      _notYetImplemented('checkpoint list', {
        limit: parseInt(opts.limit as string, 10),
        outputShape: {
          json: '{ checkpoints: CheckpointManifest[], total: number }',
          table: 'ID | Trigger | Created | Description',
        },
      });
    });
}

// ---------------------------------------------------------------------------
// Root: onxza checkpoint
// ---------------------------------------------------------------------------

export function makeCheckpointCommand(): Command {
  const cmd = new Command('checkpoint')
    .description('Manage ONXZA safety checkpoints');

  cmd.addCommand(makeCheckpointCreateCommand());
  cmd.addCommand(makeCheckpointListCommand());

  return cmd;
}

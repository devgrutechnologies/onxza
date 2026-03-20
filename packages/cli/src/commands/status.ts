/**
 * onxza status — System status overview.
 *
 * Reads openclaw.json and filesystem to produce a health summary.
 *
 * Spec: ARCHITECTURE-v0.1.md §7.2
 *
 * Exit codes:
 *   0  ONXZA initialized and readable
 *   1  Not initialized (openclaw.json not found)
 *
 * Core dependency: @onxza/core/config — NOT YET BUILT.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command } from 'commander';
import { setOutputContext } from '../util/output.js';

export function makeStatusCommand(): Command {
  return new Command('status')
    .description('Show ONXZA system status: companies, agents, tickets, health')
    .option('--dir <path>',  'Override ONXZA root (default: ~/.openclaw)')
    .option('--json',        'Machine-readable JSON output')
    .option('--verbose',     'Detailed output including agent list')
    .action(async (opts) => {
      setOutputContext({ json: !!opts.json, verbose: !!opts.verbose });

      // TODO: import { getStatus } from '@onxza/core';
      // const status = await getStatus({ dir: opts.dir });
      // if (!status.initialized) { error('ONXZA not initialized. Run: onxza init'); process.exit(1); }

      _notYetImplemented('status', {
        outputShape: {
          json: '{ version, schemaVersion, location, companies, agents: { total, persistent, temporary }, tickets: { open, inProgress, blocked }, checkpoints, lastActivity }',
          display: `
ONXZA v0.1.0

  Schema:      v1.0.0
  Location:    ~/.openclaw
  Companies:   <n>
  Agents:      <n> (<p> persistent, <t> temporary)
  Tickets:     <n> open, <n> in-progress, <n> blocked
  Checkpoints: <n>

  Last Activity: <ISO-8601>
          `.trim(),
        },
      });
    });
}

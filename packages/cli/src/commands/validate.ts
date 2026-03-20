/**
 * onxza validate <file> — Run TORI-QMD validation on any .md file.
 *
 * Direct wrapper around the TORI-QMD validator in @onxza/core/tori.
 *
 * Spec: ARCHITECTURE-v0.1.md §7.10
 *
 * Exit codes:
 *   0  PASS
 *   1  FAIL (with specific field errors listed)
 *   2  File not found or unreadable
 *
 * Core dependency: @onxza/core/tori — NOT YET BUILT.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command } from 'commander';
import { setOutputContext } from '../util/output.js';

export function makeValidateCommand(): Command {
  return new Command('validate')
    .description('Run TORI-QMD validation on any .md file')
    .argument('<file>', 'Path to the markdown file to validate')
    .option('--json', 'Machine-readable JSON output')
    .action(async (file: string, opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { validateFile } from '@onxza/core/tori';
      // const result = await validateFile({ filePath: file });
      // if (result.pass) { success(`PASS: ${file}`); process.exit(0); }
      // else { error(`FAIL: ${file} — missing: ${result.missing.join(', ')}`); process.exit(1); }

      _notYetImplemented('validate', {
        file,
        note: 'TypeScript port of validate-tori-qmd.py. Runs the same rules. Same exit codes.',
        outputShape: '{ pass: boolean, file: string, fileType: string, errors: { field, message, fix }[] }',
      });
    });
}

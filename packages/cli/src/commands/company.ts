/**
 * onxza company — Company management sub-commands.
 *
 * Sub-commands:
 *   add <name>      Register a new company
 *   list            List all companies
 *   switch <slug>   Set active company context
 *
 * Spec: ARCHITECTURE-v0.1.md §5, §7.5, §7.6
 *
 * Core dependency: @onxza/core/company — NOT YET BUILT.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command } from 'commander';
import { setOutputContext, exitValidationError } from '../util/output.js';

// ---------------------------------------------------------------------------
// company add
// ---------------------------------------------------------------------------

function makeCompanyAddCommand(): Command {
  return new Command('add')
    .description('Register a new company under ONXZA')
    .argument('<name>', 'Full company name (e.g. "DevGru Technology Products")')
    .option('--slug <slug>',     'Short PascalCase identifier (auto-derived if omitted, e.g. DTP)')
    .option('--parent <slug>',   'Parent company slug')
    .option('--vision <path>',   'Relative path to vision.md for this company')
    .option('--json',            'Machine-readable JSON output')
    .action(async (name: string, opts) => {
      setOutputContext({ json: !!opts.json });

      // Slug validation if explicitly provided (§5.2)
      if (opts.slug) {
        const slugRe = /^[A-Z][A-Za-z0-9]{0,31}$/;
        if (!slugRe.test(opts.slug as string)) {
          exitValidationError(
            `Invalid slug "${opts.slug}". Must match ^[A-Z][A-Za-z0-9]{0,31}$.\n` +
            `  Examples: DTP, WDC, MGA, ACME, MyCompany`
          );
        }
      }

      // TODO: import { addCompany } from '@onxza/core';
      // const result = await addCompany({ name, slug: opts.slug, parent: opts.parent, visionPath: opts.vision });

      _notYetImplemented('company add', {
        name, slug: opts.slug ?? '(auto-derived from name)',
        parent: opts.parent ?? null, vision: opts.vision ?? null,
        plannedSteps: [
          '1. Derive / validate slug',
          '2. Check uniqueness in openclaw.json',
          '3. Create shared-learnings/<slug>/{skills,patterns,tools}/',
          '4. Register in openclaw.json companies.list',
          '5. Create checkpoint',
          '6. Print summary',
        ],
      });
    });
}

// ---------------------------------------------------------------------------
// company list
// ---------------------------------------------------------------------------

function makeCompanyListCommand(): Command {
  return new Command('list')
    .description('List all registered companies')
    .option('--json', 'Output companies array as JSON')
    .action(async (opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { listCompanies } from '@onxza/core';
      // const companies = await listCompanies();

      _notYetImplemented('company list', {
        outputShape: {
          json: '{ companies: CompanyEntry[], total: number }',
          table: 'Slug | Name | Parent | Agents | Created',
        },
      });
    });
}

// ---------------------------------------------------------------------------
// company switch
// ---------------------------------------------------------------------------

function makeCompanySwitchCommand(): Command {
  return new Command('switch')
    .description('Set the active company context (stored in openclaw.json meta.activeCompany)')
    .argument('<slug>', 'Company slug to activate (e.g. DTP, WDC)')
    .option('--json', 'Machine-readable JSON output')
    .action(async (slug: string, opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { switchCompany } from '@onxza/core';
      // const result = await switchCompany({ slug });

      _notYetImplemented('company switch', {
        slug,
        note: 'Stores activeCompany in openclaw.json meta.activeCompany',
        affects: [
          'Default --company filter in `onxza agent list`',
          'Default --company filter in `onxza ticket list`',
          'Default company slug for `onxza agent create`',
        ],
      });
    });
}

// ---------------------------------------------------------------------------
// Root: onxza company
// ---------------------------------------------------------------------------

export function makeCompanyCommand(): Command {
  const cmd = new Command('company')
    .description('Manage companies in this ONXZA installation');

  cmd.addCommand(makeCompanyAddCommand());
  cmd.addCommand(makeCompanyListCommand());
  cmd.addCommand(makeCompanySwitchCommand());

  return cmd;
}

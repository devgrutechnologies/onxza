/**
 * onxza skill — Skill lifecycle sub-commands.
 *
 * Sub-commands:
 *   install <name>   Install skill from npm
 *   list             List installed skills
 *   update [name]    Update skill(s)
 *
 * Spec: ARCHITECTURE-v0.1.md §9, §10 (v0.1 includes)
 *
 * Note: `skill publish` is v0.1 EXCLUDED (§9.3, §11). Scaffold included
 *       with clear "not in v0.1" message.
 *
 * Skills are npm packages containing SKILL.md. v0.1 uses npm registry.
 * No custom marketplace in v0.1.
 *
 * Core dependency: @onxza/core/skill — NOT YET BUILT.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import { Command } from 'commander';
import { setOutputContext } from '../util/output.js';

// ---------------------------------------------------------------------------
// skill install
// ---------------------------------------------------------------------------

function makeSkillInstallCommand(): Command {
  return new Command('install')
    .description('Install a skill from npm (package must contain SKILL.md)')
    .argument('<name>', 'npm package name (e.g. blogwatcher, weather)')
    .option('--version <version>', 'Install a specific version')
    .option('--json', 'Machine-readable JSON output')
    .action(async (name: string, opts) => {
      setOutputContext({ json: !!opts.json });

      const pkg = opts.version ? `${name}@${opts.version}` : name;

      // TODO: import { installSkill } from '@onxza/core';
      // Core runs: npm install -g <pkg> then verifies SKILL.md exists
      // const result = await installSkill({ packageName: pkg });

      _notYetImplemented('skill install', {
        package: pkg,
        note: 'Runs npm install -g <name>. Package must contain SKILL.md at root or in skill/ subdir.',
        outputShape: '{ name, version, skillMdPath, installedAt }',
      });
    });
}

// ---------------------------------------------------------------------------
// skill list
// ---------------------------------------------------------------------------

function makeSkillListCommand(): Command {
  return new Command('list')
    .description('List installed skills (scans global npm for packages with SKILL.md)')
    .option('--json', 'Output skills array as JSON')
    .action(async (opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { listSkills } from '@onxza/core';
      // Scans npm root -g for packages containing SKILL.md
      // const skills = await listSkills();

      _notYetImplemented('skill list', {
        outputShape: {
          json: '{ skills: { name, version, description, skillMdPath }[], total: number }',
          table: 'Name | Version | Description',
        },
      });
    });
}

// ---------------------------------------------------------------------------
// skill update
// ---------------------------------------------------------------------------

function makeSkillUpdateCommand(): Command {
  return new Command('update')
    .description('Update installed skill(s) via npm')
    .argument('[name]', 'Skill package name. Omit to update all installed skills.')
    .option('--json', 'Machine-readable JSON output')
    .action(async (name: string | undefined, opts) => {
      setOutputContext({ json: !!opts.json });

      // TODO: import { updateSkill } from '@onxza/core';
      // const result = await updateSkill({ name }); // name=undefined means update all

      _notYetImplemented('skill update', {
        package: name ?? '(all installed skills)',
        note: 'Runs npm update -g [name]. Reports old → new version.',
        outputShape: '{ updated: { name, from, to }[], skipped: string[] }',
      });
    });
}

// ---------------------------------------------------------------------------
// skill publish (v0.1 EXCLUDED — scaffold only)
// ---------------------------------------------------------------------------

function makeSkillPublishCommand(): Command {
  return new Command('publish')
    .description('[v0.5] Publish a skill to the ONXZA marketplace — NOT in v0.1')
    .argument('<path>', 'Path to skill directory containing SKILL.md')
    .option('--json', 'Machine-readable JSON output')
    .action(async (_path: string, opts) => {
      setOutputContext({ json: !!opts.json });

      _notYetImplemented('skill publish', {
        deferredTo: 'v0.5',
        reason: 'Requires marketplace backend. Use npm publish in the meantime.',
        workaround: 'Publish your skill package to npm directly, then users run: onxza skill install <your-package>',
      });
    });
}

// ---------------------------------------------------------------------------
// Root: onxza skill
// ---------------------------------------------------------------------------

export function makeSkillCommand(): Command {
  const cmd = new Command('skill')
    .description('Manage ONXZA skills (install, list, update)');

  cmd.addCommand(makeSkillInstallCommand());
  cmd.addCommand(makeSkillListCommand());
  cmd.addCommand(makeSkillUpdateCommand());
  cmd.addCommand(makeSkillPublishCommand());

  return cmd;
}

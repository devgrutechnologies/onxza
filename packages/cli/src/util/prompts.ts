/**
 * Interactive prompt utilities for the ONXZA CLI.
 *
 * IMPORTANT: These helpers MUST be gated behind isJsonMode() checks at call sites.
 * Per ARCHITECTURE-v0.1.md §15 constraint 7: "No interactive prompts with --json.
 * JSON mode never prompts — missing required values are errors."
 *
 * Uses Node.js readline (zero extra dependency) for v0.1.
 * Replace with @inquirer/prompts in v0.2 if richer UX is needed.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

/**
 * Prompt the user for a single line of text.
 * Returns the trimmed string, or the default if empty.
 */
export async function promptText(
  question: string,
  defaultValue?: string,
): Promise<string> {
  const rl = readline.createInterface({ input, output });
  const suffix = defaultValue ? ` [${defaultValue}]` : '';
  try {
    const answer = await rl.question(`  ? ${question}${suffix}: `);
    return answer.trim() || defaultValue || '';
  } finally {
    rl.close();
  }
}

/**
 * Prompt for a yes/no confirmation.
 * Returns true for y/yes, false for n/no or empty (defaults to false).
 */
export async function promptConfirm(
  question: string,
  defaultValue: boolean = false,
): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  const hint = defaultValue ? '[Y/n]' : '[y/N]';
  try {
    const answer = await rl.question(`  ? ${question} ${hint}: `);
    const trimmed = answer.trim().toLowerCase();
    if (!trimmed) return defaultValue;
    return trimmed === 'y' || trimmed === 'yes';
  } finally {
    rl.close();
  }
}

/**
 * Prompt for a selection from a list.
 * Returns the selected item, or the default.
 */
export async function promptSelect(
  question: string,
  choices: string[],
  defaultValue?: string,
): Promise<string> {
  const rl = readline.createInterface({ input, output });
  console.log(`  ? ${question}`);
  choices.forEach((c, i) => console.log(`    ${i + 1}. ${c}`));
  const suffix = defaultValue ? ` [default: ${defaultValue}]` : '';
  try {
    const answer = await rl.question(`  Enter number or name${suffix}: `);
    const trimmed = answer.trim();
    if (!trimmed) return defaultValue ?? choices[0] ?? '';
    const idx = parseInt(trimmed, 10);
    if (!isNaN(idx) && idx >= 1 && idx <= choices.length) {
      return choices[idx - 1]!;
    }
    // Try exact match
    const match = choices.find(c => c.toLowerCase() === trimmed.toLowerCase());
    return match ?? trimmed;
  } finally {
    rl.close();
  }
}

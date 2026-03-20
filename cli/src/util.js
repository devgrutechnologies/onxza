'use strict';

/**
 * Shared utilities for ONXZA CLI commands.
 */

/**
 * Write JSON to stdout (pretty-printed).
 * Used by all commands when the global --json flag is active.
 * @param {object} data
 */
function outputJson(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

/**
 * Determine whether the --json flag is active for a given command.
 * Commander stores global options on the root program (cmd.parent chain).
 * @param {Command} cmd
 * @returns {boolean}
 */
function isJsonMode(cmd) {
  let node = cmd;
  while (node) {
    if (node.opts && node.opts().json) return true;
    node = node.parent;
  }
  return false;
}

module.exports = { outputJson, isJsonMode };

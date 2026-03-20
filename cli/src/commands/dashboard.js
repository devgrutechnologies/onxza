'use strict';

/**
 * onxza dashboard — Launch ONXZA Mission Control TUI.
 *
 * Launches the interactive terminal dashboard with:
 *   - Agent Status Board: all agents, live TASK_STATE, model, current task
 *   - Ticket Kanban: counts per status column + priority breakdown
 *   - Real-time log tail
 *   - Filesystem watch for auto-refresh on ticket changes
 *
 * Framework: Raw ANSI + readline + fs.watch (zero extra dependencies).
 * See src/dashboard/tui.js for decision rationale.
 *
 * --web flag routes to TICKET-DTP-012 (Next.js web frontend, not yet built).
 *
 * ARCHITECTURE.md §13 · mission-control-spec.md · TICKET-20260318-DTP-008
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

const { Command }  = require('commander');
const { outputJson, isJsonMode } = require('../util');
const { getSystemHealth } = require('../system/health');

const dashboardCmd = new Command('dashboard')
  .description('Launch ONXZA Mission Control TUI')
  .option('--web', 'Open Mission Control web frontend (requires TICKET-DTP-012)')
  .option('--port <port>', 'Port for web interface', '4200')
  .option('--no-watch', 'Disable filesystem watching (manual refresh only)')
  .option('--no-color', 'Disable color output')
  .option('--snapshot', 'Print a single snapshot and exit (non-interactive)')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    // Web mode — not yet implemented
    if (options.web) {
      const result = {
        status: 'not_implemented',
        message: 'Web frontend coming in TICKET-DTP-012 (Mission Control Next.js app).',
        workaround: 'Use `onxza dashboard` without --web for the TUI version.',
      };
      if (jsonMode) {
        outputJson(result);
      } else {
        console.log('\n  onxza dashboard --web: Not yet implemented.');
        console.log('  Web frontend: TICKET-DTP-012');
        console.log('  Use `onxza dashboard` for the TUI version.\n');
      }
      return;
    }

    // JSON snapshot mode — non-interactive, for scripts
    if (jsonMode || options.snapshot) {
      const snap = getSystemHealth();
      const { agentList, ...rest } = snap;
      outputJson({ ...rest, agentCount: agentList.length });
      return;
    }

    // Launch TUI
    const { launch } = require('../dashboard/tui');
    launch({
      noWatch: options.watch === false,
      noColor: options.color === false,
    });
  });

module.exports = dashboardCmd;

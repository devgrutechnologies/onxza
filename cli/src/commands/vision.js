'use strict';

/**
 * onxza vision — Vision Lock management and CDP board session scaffolding.
 *
 * Subcommands:
 *   onxza vision status               — show lock status of all vision.md files
 *   onxza vision check <file>         — check if a single vision.md is immutable
 *   onxza vision verify               — compare current vision hashes vs latest checkpoint
 *   onxza vision review <project>     — scaffold a CDP board session for a project vision
 *   onxza vision create-update-request --vision <file> --agent <id>
 *                                     — create vision_update_request ticket
 *
 * Delegates to validate-vision-lock.py (Tier 3, zero LLM).
 * CDP review scaffolding creates ticket files directly.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

const { Command } = require('commander');
const { execFileSync, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { outputJson, isJsonMode } = require('../util');

const SCRIPT     = path.join(os.homedir(), '.openclaw', 'workspace', 'scripts', 'validate-vision-lock.py');
const CDP_SCRIPT = path.join(os.homedir(), '.openclaw', 'workspace', 'scripts', 'cdp-session.py');
const WORKSPACE = path.join(os.homedir(), '.openclaw', 'workspace');
const TICKETS_OPEN = path.join(WORKSPACE, 'tickets', 'open');
const VISION_DIRS = [
  path.join(WORKSPACE, 'projects'),
  path.join(WORKSPACE, 'companies'),
];

function runScript(args) {
  try {
    const output = execFileSync('python3', [SCRIPT, ...args], {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    return { output, exitCode: 0 };
  } catch (err) {
    return { output: err.stdout || '', stderr: err.stderr || '', exitCode: err.status || 1 };
  }
}

// ─── parent ───────────────────────────────────────────────────────────────────

const visionCmd = new Command('vision')
  .description('Vision Lock management and CDP board session scaffolding')
  .addHelpText('after', `
Examples:
  onxza vision status
  onxza vision check projects/devgru-technology-products/vision.md
  onxza vision verify
  onxza vision review devgru-technology-products
  onxza vision create-update-request --vision projects/wdc/vision.md --agent wdc-coo
`);

// ─── vision status ────────────────────────────────────────────────────────────

visionCmd
  .command('status')
  .description('List all vision.md files with their lock status')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--list'];
    if (jsonMode) args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── vision check ─────────────────────────────────────────────────────────────

visionCmd
  .command('check <file>')
  .description('Check if a vision.md is APPROVED — IMMUTABLE (exit 1 if so)')
  .option('--agent <id>', 'Agent attempting the write', 'unknown')
  .action((file, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const fullPath = path.isAbsolute(file) ? file : path.join(WORKSPACE, file);
    const args = ['--check', fullPath, '--agent', options.agent];
    if (jsonMode) args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── vision verify ────────────────────────────────────────────────────────────

visionCmd
  .command('verify')
  .description('Compare current vision hashes vs latest checkpoint — detect unauthorized changes')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--verify'];
    if (jsonMode) args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── vision create-update-request ─────────────────────────────────────────────

visionCmd
  .command('create-update-request')
  .description('Create a vision_update_request ticket for a blocked write attempt')
  .requiredOption('--vision <file>', 'Path to the vision.md being proposed for update')
  .requiredOption('--agent <id>', 'Agent ID requesting the change')
  .option('--reason <text>', 'Reason for the proposed change', 'Vision update requested')
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const fullPath = path.isAbsolute(options.vision)
      ? options.vision
      : path.join(WORKSPACE, options.vision);

    const args = ['--create-ticket', fullPath, options.agent];
    if (jsonMode) args.push('--json');
    const { output, exitCode } = runScript(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

// ─── vision review ────────────────────────────────────────────────────────────

visionCmd
  .command('review <project-slug>')
  .description('Scaffold a CDP board session for a project vision (creates board member tickets)')
  .option('--vision <file>', 'Path to vision.md (defaults to projects/<slug>/vision.md)')
  .option('--board <members>', 'Comma-separated board member agent IDs (auto-detected if omitted)')
  .action((projectSlug, options, cmd) => {
    const jsonMode = isJsonMode(cmd);

    // Locate vision file
    const visionPath = options.vision
      ? path.resolve(WORKSPACE, options.vision)
      : path.join(WORKSPACE, 'projects', projectSlug, 'vision.md');

    if (!fs.existsSync(visionPath)) {
      const err = { error: `Vision file not found: ${visionPath}` };
      if (jsonMode) { outputJson(err); } else { console.error(`Error: ${err.error}`); }
      process.exit(1);
    }

    const relVisionPath = path.relative(WORKSPACE, visionPath);

    // Read vision content for context
    let visionPreview = '';
    try {
      visionPreview = fs.readFileSync(visionPath, 'utf-8').slice(0, 500);
    } catch { /* ok */ }

    // Default board members
    const defaultBoard = [
      'mg-parent-orchestrator',
      'dtp-ceo',
      'dtp-onxza-architect',
    ];
    const boardMembers = options.board
      ? options.board.split(',').map(s => s.trim()).filter(Boolean)
      : defaultBoard;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const sessionId = `CDP-${dateStr}-${timeStr}-${projectSlug}`;

    const ticketsCreated = [];

    for (const member of boardMembers) {
      const ticketId = `${sessionId}-${member}`;
      const filename = `${ticketId}.md`;
      const filepath = path.join(TICKETS_OPEN, filename);

      const content = `---
id: ${ticketId}
type: cdp_board_review
created_by: dtp-onxza-backend
created_at: ${now.toISOString()}
assigned_to: ${member}
project: ${projectSlug}
priority: high
status: open
requires_aaron: false
vision_file: ${relVisionPath}
cdp_session: ${sessionId}
board_round: 1
---

## Summary
CDP Board Session — Round 1 independent review for vision: \`${projectSlug}\`

## Instructions
You are a board member in a Collaborative Definition Protocol (CDP-001) session.
Read the vision document at \`${relVisionPath}\` independently — do NOT coordinate with other board members before writing your response.

**Full protocol:** \`projects/onxza/faails/CDP-001.md\`

## Your Review (answer all 5 questions)

**Q1:** Does this conflict with your company's or domain's existing vision.md?
*If yes: what exactly conflicts? Be specific.*

**Q2:** What dependencies are missing?
*List only things that MUST exist before this vision can execute. Not nice-to-haves.*

**Q3:** What implications does only your domain perspective reveal?
*Things other board members cannot see from their vantage point.*

**Q4:** What needs Aaron's clarification?
*List specific ambiguities only. Concrete gaps that block execution.*

**Q5:** Execution confidence score 0–100.
*If below 80: explain exactly what is missing.*

## Vision Preview
\`\`\`
${visionPreview.slice(0, 300)}...
\`\`\`

## Next Step
After completing your review, move this ticket to \`tickets/in-progress/\`.
Marcus will synthesize all board responses and produce the consolidated question set for Aaron.

## Vision Alignment
CDP is the mechanism that bridges the gap between what Aaron means and what agents execute.
`;

      fs.mkdirSync(TICKETS_OPEN, { recursive: true });
      fs.writeFileSync(filepath, content, 'utf-8');
      ticketsCreated.push(filename);
    }

    // Create session summary ticket for Marcus
    const summaryTicketId = `${sessionId}-SYNTHESIS`;
    const summaryFilename = `${summaryTicketId}.md`;
    const summaryPath = path.join(TICKETS_OPEN, summaryFilename);
    const summaryContent = `---
id: ${summaryTicketId}
type: cdp_synthesis
created_by: dtp-onxza-backend
created_at: ${now.toISOString()}
assigned_to: mg-parent-marcus
project: ${projectSlug}
priority: high
status: open
requires_aaron: true
vision_file: ${relVisionPath}
cdp_session: ${sessionId}
board_members: ${boardMembers.join(', ')}
---

## Summary
CDP Board Session Synthesis — \`${projectSlug}\`

## Instructions
Wait for all ${boardMembers.length} board member reviews to complete, then:

1. Read all board responses from tickets:
${boardMembers.map(m => `   - \`tickets/in-progress/${sessionId}-${m}.md\``).join('\n')}

2. Synthesize into a consolidated question set (max 5 questions, ordered by importance)

3. Surface to Aaron via iMessage:
   - One sentence: what the vision is
   - One sentence: what the board found
   - Max 5 questions for Aaron to answer

4. After Aaron responds: refine vision.md and change status to APPROVED — IMMUTABLE

5. Create checkpoint immediately after approval

## CDP Session: ${sessionId}

## Vision Alignment
Vision Lock is the highest-priority subsystem. This session ensures the vision reflects what Aaron means, not just what was said.
`;
    fs.writeFileSync(summaryPath, summaryContent, 'utf-8');
    ticketsCreated.push(summaryFilename);

    if (jsonMode) {
      outputJson({
        status: 'ok',
        session_id: sessionId,
        vision_path: relVisionPath,
        board_members: boardMembers,
        tickets_created: ticketsCreated,
      });
    } else {
      console.log(`\n✓ CDP Board Session scaffolded: ${sessionId}`);
      console.log(`  Vision: ${relVisionPath}`);
      console.log(`  Board members: ${boardMembers.join(', ')}`);
      console.log(`\n  Tickets created (${ticketsCreated.length}):`);
      ticketsCreated.forEach(t => console.log(`    → tickets/open/${t}`));
      console.log(`\n  Next: each board member completes their Round 1 review independently.`);
      console.log(`  Marcus synthesizes via: ${summaryFilename}\n`);
    }
  });

// ─── CDP helpers ──────────────────────────────────────────────────────────────

function runCdp(args) {
  try {
    const out = execFileSync('python3', [CDP_SCRIPT, ...args], {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    return { output: out, exitCode: 0 };
  } catch (err) {
    return { output: err.stdout || '', stderr: err.stderr || '', exitCode: err.status || 1 };
  }
}

// ─── vision intake ────────────────────────────────────────────────────────────

visionCmd
  .command('intake')
  .description('Start a CDP board session for new vision input from Aaron')
  .argument('[text]', 'Vision input text (can also be piped via stdin)')
  .option('--project <slug>', 'Project slug (auto-derived from text if omitted)')
  .option('--company <name>', 'Company (DTP | WDC | MGA)', 'DTP')
  .option('--type <type>', 'Vision type: product | software | business | content | technical | default', 'default')
  .addHelpText('after', `
Starts a CDP (Collaborative Definition Protocol) board session (CDP-001).
Performs structural analysis, identifies ambiguities, synthesizes ≤5 questions.
Creates a question file and board member tickets.

Status transitions: DRAFT → CDP-REVIEW → AWAITING-ANSWERS → APPROVED — IMMUTABLE

Examples:
  onxza vision intake "I want to build a travel subscription service" --company WDC --type business
  echo "I want to build..." | onxza vision intake
  onxza vision intake --project my-project --type software "Build a REST API for user auth"
`)
  .action((text, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    if (!text) {
      // Try reading from --file option or flag error
      console.error('Error: vision input text required. Pass as argument or pipe via stdin.');
      process.exit(1);
    }
    const args = ['--intake', '--text', text, '--company', options.company, '--type', options.type];
    if (options.project) args.push('--project', options.project);
    if (jsonMode) args.push('--json');
    const { output, stderr, exitCode } = runCdp(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ─── vision answer ────────────────────────────────────────────────────────────

visionCmd
  .command('answer')
  .description('Process Aaron\'s answers to CDP board questions')
  .requiredOption('--session <id>', 'CDP session ID to process answers for')
  .option('--answers <file>', 'JSON file with answers (Q1..Q5 + go: true/false)')
  .option('--go', 'Approve session immediately without additional answers')
  .addHelpText('after', `
Answers JSON format:
  { "1": "...", "2": "...", "go": true }

If --go is passed or answers contains "go: true", session is approved immediately.

Example:
  onxza vision answer --session CDP-20260318-123456-ABCDEF --answers my-answers.json
  onxza vision answer --session CDP-20260318-123456-ABCDEF --go
`)
  .action((options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--answer', '--session', options.session];
    if (options.answers) args.push('--answers', options.answers);
    if (jsonMode) args.push('--json');

    // If --go flag, create a temp answers file
    if (options.go && !options.answers) {
      const tmpFile = path.join(os.tmpdir(), `cdp-answers-${Date.now()}.json`);
      fs.writeFileSync(tmpFile, JSON.stringify({ go: true }));
      args.push('--answers', tmpFile);
    }

    const { output, stderr, exitCode } = runCdp(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ─── vision approve ───────────────────────────────────────────────────────────

visionCmd
  .command('approve-session')
  .description('Manually mark a CDP session APPROVED — IMMUTABLE (finalizes vision.md)')
  .argument('<session-id>', 'CDP session ID to approve')
  .action((sessionId, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = ['--approve', sessionId];
    if (jsonMode) args.push('--json');
    const { output, stderr, exitCode } = runCdp(args);
    process.stdout.write(output);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });

// ─── vision sessions ─────────────────────────────────────────────────────────

visionCmd
  .command('sessions')
  .description('List all CDP board sessions with state')
  .argument('[session-id]', 'Show detail for a specific session')
  .action((sessionId, options, cmd) => {
    const jsonMode = isJsonMode(cmd);
    const args = sessionId ? ['--status', sessionId] : ['--list'];
    if (jsonMode) args.push('--json');
    const { output, exitCode } = runCdp(args);
    process.stdout.write(output);
    process.exit(exitCode);
  });

module.exports = visionCmd;

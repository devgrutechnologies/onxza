# Changelog — ONXZA CLI

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

All notable changes to the ONXZA CLI are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [0.1.0] — 2026-03-18

### Added
- `onxza init` — Initialize a new ONXZA installation (workspace dirs, openclaw.json, scripts, git hook, checkpoint)
- `onxza status` — System health dashboard (agents by state, ticket counts, health score)
- `onxza dashboard` — Interactive TUI Mission Control (Agent Board, Ticket Kanban, Log tail, fs.watch)
- `onxza agent create <Company_Dept_Role>` — Scaffold a new agent workspace (6 files, TORI-QMD gate, openclaw.json registration, checkpoint)
- `onxza agent list` — List all registered agents with live TASK_STATE
- `onxza agent validate <agent-id>` — Run TORI-QMD on all 6 agent workspace files
- `onxza company add <name>` — Register a new company (creates shared-learnings structure)
- `onxza company list` — List companies with agent and project counts
- `onxza company switch <name>` — Set active company context (persisted to ~/.onxza/context.json)
- `onxza skill install <skill-name>` — Install a skill from the marketplace (TORI-QMD gated)
- `onxza skill list` — List installed skills with versions
- `onxza skill update [skill-name]` — Update skill(s) to latest version
- `onxza skill publish <path>` — Submit a skill to the marketplace
- `onxza tickets` — List tickets by status (open/in-progress/blocked/closed)
- `onxza tickets show <id>` — Show full ticket detail
- `onxza tickets create` — Create a new ticket with correct frontmatter
- `onxza tickets move <id> <status>` — Move ticket between lifecycle directories
- `onxza start` — Start the ONXZA runtime daemon (stub — future release)
- `onxza logs` — Tail system logs (stub — future release)
- `onxza script create/list/run` — Script management (stubs — future release)
- `onxza dashboard --web` — Web frontend (stub — TICKET-DTP-012)
- Global `--json` flag on all commands for machine-readable output
- Global `--version` / `-v` flag
- Framework decision: Node.js + Commander.js v12 (zero extra deps beyond commander)
- TUI framework: Raw ANSI + readline + fs.watch (zero extra deps)
- Skills marketplace API contract defined (stub mode until TICKET-DTP-013)

### Architecture
- Single binary: `onxza` (Node.js, ≥18.0.0 required)
- One dependency: `commander` ^12.0.0
- Installed package size: ~500KB including commander
- `enablePositionalOptions()` on root + `passThroughOptions()` on intermediate commands to prevent Commander option shadowing

---

## [Unreleased]

### Planned for 0.2.0
- `onxza start` — Runtime daemon with process management
- `onxza logs` — Real log file streaming from workspace/logs/
- `onxza script` — Full script tier management (Tier 1/2/3)
- `onxza dashboard --web` — Next.js Mission Control (TICKET-DTP-012)
- Live marketplace backend (TICKET-DTP-013)

### Planned for 0.3.0
- Rust binary option for distribution without Node.js dependency
- `onxza pull onxza-llm` — Local LLM download and management
- Windows native (PowerShell) support

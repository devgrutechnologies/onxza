---
title: "ONXZA v0.1 — Architecture Specification"
version: 0.1.0
owner: DTP_ONXZA_Architect
created: 2026-03-18
status: APPROVED
tags: architecture, onxza, v0.1, specification, cli, data-model, interfaces
summary: The single source of truth for ONXZA v0.1. Defines every command, every data structure, every interface, every tech decision. All CLI and Backend agents build from this document. Nothing ships that is not specified here.
credit_line: present
---

# ONXZA v0.1 — Architecture Specification

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 0.1.0 | **Owner:** DTP_ONXZA_Architect | **Date:** 2026-03-18
**Status:** APPROVED — This is the architecture gate. All CLI and Backend work derives from this document.

---

## 1. Purpose

This document is the complete, opinionated, build-ready specification for ONXZA v0.1. It answers every question a CLI or Backend agent needs to write code. If something is not in this document, it is not in v0.1.

**Audience:** DTP_ONXZA_CLI, DTP_ONXZA_Backend, DTP_ONXZA_PM, DTP_ONXZA_QA, DTP_ONXZA_Docs.

---

## 2. Tech Stack Decisions

### 2.1 CLI

| Decision | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Same ecosystem as OpenClaw. Shared tooling. Fast dev velocity. |
| Runtime | Node.js ≥ 18 | LTS target. OpenClaw already requires it. No new dependency. |
| CLI framework | Commander.js | Lightweight, well-documented, zero magic. Already used by OpenClaw. |
| Package manager | npm | Default. `pnpm` and `yarn` supported but npm is the install path. |
| Distribution | npm (`npm install -g onxza`) + curl one-liner | Two install paths. npm is primary. curl script wraps npm install. |
| Template engine | Mustache (mustache.js) | Logic-less templates. Templates are markdown, not code. One dependency. |
| JSON Schema validation | Ajv | Industry standard. Fast. Supports Draft 2020-12. |
| Git integration | simple-git | Lightweight Node.js git wrapper. For `onxza init` git setup. |
| Output formatting | chalk + ora | Colored output and spinners. Same as OpenClaw. |
| Testing | Vitest | Fast, TypeScript-native, compatible with Node.js. |

### 2.2 Backend / Core Library

| Decision | Choice | Rationale |
|---|---|---|
| Language | TypeScript (shared with CLI) | Single codebase. CLI imports core library. |
| Package structure | Monorepo — `packages/core` + `packages/cli` | Core is importable. CLI is the executable. Future: `packages/server` for cloud. |
| Build tool | tsup | Fast, zero-config TypeScript bundler. ESM + CJS output. |

### 2.3 Dependencies (Complete List for v0.1)

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "mustache": "^4.2.0",
    "ajv": "^8.17.0",
    "ajv-formats": "^3.0.0",
    "simple-git": "^3.27.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "yaml": "^2.6.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsup": "^8.3.0",
    "vitest": "^2.1.0",
    "@types/node": "^22.0.0",
    "@types/mustache": "^4.2.0"
  }
}
```

No other runtime dependencies. Zero cloud dependencies. Zero database dependencies. v0.1 is entirely local-filesystem-based.

### 2.4 Repository Structure

```
onxza/
├── packages/
│   ├── core/                    ← @onxza/core — shared library
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── schema/          ← JSON Schema loader + validator
│   │   │   ├── config/          ← openclaw.json read/write/migrate
│   │   │   ├── agent/           ← agent create/validate/list logic
│   │   │   ├── company/         ← company add/list/switch logic
│   │   │   ├── ticket/          ← ticket read/list/move logic
│   │   │   ├── template/        ← Mustache template engine
│   │   │   ├── checkpoint/      ← checkpoint create/list/restore
│   │   │   ├── tori/            ← TORI-QMD validation (TS port)
│   │   │   └── types.ts         ← shared TypeScript types
│   │   ├── schemas/
│   │   │   ├── openclaw.schema.json
│   │   │   └── migrations/
│   │   ├── templates/
│   │   │   └── agent/           ← 6 Mustache templates + README
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── cli/                     ← onxza CLI executable
│       ├── src/
│       │   ├── index.ts         ← CLI entry point
│       │   ├── commands/
│       │   │   ├── init.ts
│       │   │   ├── agent.ts     ← create, list, validate
│       │   │   ├── company.ts   ← add, list, switch
│       │   │   ├── config.ts    ← validate, migrate, version
│       │   │   ├── ticket.ts    ← list, show
│       │   │   ├── skill.ts     ← install, list, update
│       │   │   ├── status.ts
│       │   │   └── help.ts
│       │   └── util/
│       │       ├── output.ts    ← chalk/ora formatting
│       │       └── prompts.ts   ← interactive prompts
│       ├── bin/
│       │   └── onxza.ts         ← shebang entry
│       ├── package.json
│       └── tsconfig.json
├── docs/                        ← Published docs (from workspace/projects/onxza/docs/)
├── faails/                      ← FAAILS protocol specs
├── LICENSE
├── README.md
├── package.json                 ← workspace root
├── pnpm-workspace.yaml          ← monorepo config (pnpm workspaces)
└── tsconfig.base.json
```

**Note:** Development uses pnpm workspaces internally. End users install via npm (`npm install -g onxza`). The published npm package is `onxza` (CLI) with `@onxza/core` as a dependency.

---

## 3. `onxza init` — Exact Specification

### 3.1 Invocation

```bash
onxza init [--dir <path>] [--company <name>] [--no-git] [--json]
```

| Flag | Default | Description |
|---|---|---|
| `--dir` | `~/.openclaw` | Root directory for ONXZA installation |
| `--company` | *(prompted)* | First company name |
| `--no-git` | `false` | Skip git init and pre-commit hook |
| `--json` | `false` | Machine-readable JSON output |

### 3.2 Pre-Flight Checks

1. **Check Node.js version** — must be ≥ 18. If not: print error and exit 1.
2. **Check for existing installation** — if `<dir>/workspace/` exists:
   - If `openclaw.json` exists: print `"ONXZA already initialized at <dir>. Use 'onxza status' to check health."` Exit 0.
   - If directory exists but no `openclaw.json`: print warning, prompt to continue or abort.

### 3.3 Step-by-Step Execution

**Step 1: Create directory structure**

```
<dir>/
├── workspace/
│   ├── docs/
│   ├── tickets/
│   │   ├── open/
│   │   ├── in-progress/
│   │   ├── pending-approval/
│   │   ├── blocked/
│   │   └── closed/
│   ├── projects/
│   ├── memory/
│   ├── logs/
│   │   └── audit/
│   ├── scripts/
│   └── shared-learnings/
│       └── global/
│           ├── skills/
│           ├── patterns/
│           └── tools/
└── checkpoints/
```

Output: `✓ Directory structure created`

**Step 2: Seed `openclaw.json`**

Write `<dir>/openclaw.json` with:

```json
{
  "$schemaVersion": "1.0.0",
  "meta": {
    "lastTouchedVersion": "<onxza-cli-version>",
    "lastTouchedAt": "<ISO-8601-now>"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6"
      },
      "workspace": "<dir>/workspace"
    },
    "list": []
  },
  "companies": {
    "list": []
  },
  "dispatcher": {
    "enabled": true,
    "scanIntervalMinutes": 5,
    "ticketBasePath": "tickets",
    "routing": {
      "strategy": "registry"
    }
  },
  "tools": {
    "profile": "general"
  },
  "broadcast": {
    "strategy": "parallel"
  },
  "session": {
    "dmScope": "per-channel-peer"
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback"
  },
  "skills": {
    "install": {
      "nodeManager": "npm"
    }
  }
}
```

Output: `✓ openclaw.json created (schema v1.0.0)`

**Step 3: Copy global templates**

Copy `templates/agent/` from the installed `@onxza/core` package to `<dir>/workspace/projects/onxza/templates/agent/`.

Output: `✓ Agent templates installed`

**Step 4: Copy TORI-QMD validator**

Write `<dir>/workspace/scripts/validate-tori-qmd.py` from bundled source.

Output: `✓ TORI-QMD validator installed`

**Step 5: Copy checkpoint script**

Write `<dir>/workspace/scripts/create-checkpoint.py` from bundled source.

Output: `✓ Checkpoint script installed`

**Step 6: Copy audit logger**

Write `<dir>/workspace/scripts/log-audit-entry.py` from bundled source.

Output: `✓ Audit logger installed`

**Step 7: Initialize audit trail**

Write `<dir>/workspace/logs/audit/audit-trail.md`:

```markdown
# Audit Trail
**Created:** <ISO-8601-now>

| Timestamp | Agent | Action | Outcome | Confirmed By | Checkpoint | Reversible |
|---|---|---|---|---|---|---|
| <ISO-8601-now> | onxza-cli | onxza init | executed | system | — | yes |
```

Output: `✓ Audit trail initialized`

**Step 8: Git init (unless `--no-git`)**

```bash
git init <dir>
# Write .gitignore:
#   node_modules/
#   *.pyc
#   __pycache__/
#   .DS_Store
# Write pre-commit hook: validate-tori-qmd.py on staged .md files
git add -A
git commit -m "onxza init — ONXZA v<version> initialized"
```

Output: `✓ Git repository initialized with pre-commit hook`

**Step 9: Create initial checkpoint**

```
<dir>/checkpoints/<YYYYMMDD-HHMMSS>-onxza-init/
├── manifest.json    ← { version, timestamp, trigger: "onxza init" }
├── openclaw.json    ← copy
└── README.md        ← "Initial ONXZA installation checkpoint"
```

Output: `✓ Checkpoint created: <checkpoint-id>`

**Step 10: Prompt for first company (if `--company` not provided)**

```
? Enter your first company name: [input]
```

If provided, run `onxza company add <name>` internally (see Section 5).

Output: `✓ Company "<name>" registered`

**Step 11: Print summary**

```
╭──────────────────────────────────────────────────╮
│  ONXZA initialized successfully                  │
│                                                  │
│  Location:    <dir>                              │
│  Schema:      v1.0.0                             │
│  Companies:   1                                  │
│  Agents:      0                                  │
│                                                  │
│  Next steps:                                     │
│    onxza agent create <Company_Dept_Role>         │
│    onxza status                                  │
╰──────────────────────────────────────────────────╯
```

### 3.4 Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Pre-flight check failed |
| 2 | Filesystem error (permissions, disk full) |

### 3.5 Idempotency

Running `onxza init` on an existing installation does nothing. It detects `openclaw.json` and exits 0 with a message. It never overwrites.

---

## 4. `onxza agent create` — Exact Specification

### 4.1 Invocation

```bash
onxza agent create <Company_Dept_Role> [options]
```

| Flag | Default | Description |
|---|---|---|
| `--model <ref>` | Company default or global default | Model reference (e.g. `claude-sonnet-4-6`) |
| `--persistence <class>` | `persistent` | `persistent` or `temporary` |
| `--reports-to <agent-name>` | *(prompted)* | Reporting agent name |
| `--no-validate` | `false` | Skip TORI-QMD validation (dangerous) |
| `--json` | `false` | Machine-readable output |

### 4.2 Input Parsing

The agent name `Company_Dept_Role` is parsed as:

```
DTP_ONXZA_Architect
 │     │       │
 │     │       └── Role: "Architect"
 │     └────────── Department: "ONXZA"
 └──────────────── Company Slug: "DTP"
```

**Validation rules:**
- Must contain exactly 2 underscores (3 segments)
- Company segment must match a registered company slug in `openclaw.json`
- Each segment must be PascalCase: `^[A-Z][A-Za-z0-9]*$`
- Resulting agent ID (kebab-case) must not already exist in `openclaw.json`

If validation fails: print specific error and exit 1.

### 4.3 Derived Values

From `DTP_ONXZA_Architect`:

| Variable | Derived Value |
|---|---|
| `AGENT_NAME` | `DTP_ONXZA_Architect` |
| `AGENT_ID` | `dtp-onxza-architect` |
| `COMPANY_SLUG` | `DTP` |
| `COMPANY_FULL_NAME` | Looked up from `openclaw.json` → `companies.list[]` by slug |
| `DEPARTMENT` | `ONXZA` |
| `ROLE` | `Architect` |
| `MODEL` | From `--model` flag, or company default, or global default |
| `PERSISTENCE_CLASS` | From `--persistence` flag, default `persistent` |
| `REPORTS_TO` | From `--reports-to` flag, or prompted |
| `CREATED_DATE` | ISO date now |

### 4.4 Step-by-Step Execution

**Step 1: Validate agent name** (parsing rules above)

**Step 2: Check for duplicate** — scan `openclaw.json` `agents.list[]` for matching ID. If found: error and exit.

**Step 3: Resolve company** — look up `COMPANY_SLUG` in `openclaw.json` `companies.list[]`. If not found: `"Company '<slug>' not registered. Run 'onxza company add' first."` Exit 1.

**Step 4: Prompt for missing values** — if `--reports-to` not provided, prompt interactively. If `--model` not provided, use company default from `openclaw.json`, or global default.

**Step 5: Create workspace directory**

```
<root>/workspace-<agent-id>/
```

Example: `~/.openclaw/workspace-dtp-onxza-architect/`

**Step 6: Render templates**

Load all 6 templates from `<root>/workspace/projects/onxza/templates/agent/`. Render each with Mustache, substituting all template variables. Write to workspace directory:

```
workspace-<agent-id>/
├── AGENTS.md
├── SOUL.md
├── IDENTITY.md
├── MEMORY.md
├── TOOLS.md
└── HEARTBEAT.md
```

**Step 7: Run TORI-QMD validation** (unless `--no-validate`)

Run `validate-tori-qmd.py` on all 6 files. If any fail:
- Print failures
- Delete the workspace directory (clean up)
- Exit 1

Output per file: `✓ TORI-QMD: AGENTS.md` (or `✗ TORI-QMD: AGENTS.md — missing: <fields>`)

**Step 8: Register in `openclaw.json`**

Append to `agents.list[]`:

```json
{
  "id": "<agent-id>",
  "workspace": "<absolute-path-to-workspace>",
  "model": {
    "primary": "<provider>/<model>"
  },
  "company": "<company-slug>",
  "persistence": "<persistence-class>"
}
```

The provider prefix (`anthropic/`, `openai/`, `ollama/`) is determined by model name pattern matching:
- `claude-*` → `anthropic/`
- `gpt-*` or `o1-*` or `o3-*` or `o4-*` → `openai/`
- Everything else → `ollama/` (local models)

**Step 9: Create checkpoint**

```
checkpoints/<YYYYMMDD-HHMMSS>-agent-create-<agent-id>/
├── manifest.json
├── openclaw.json
└── README.md
```

**Step 10: Print summary**

```
✓ Agent created: DTP_ONXZA_Architect

  ID:          dtp-onxza-architect
  Company:     DevGru Technology Products (DTP)
  Department:  ONXZA
  Role:        Architect
  Model:       anthropic/claude-opus-4-6
  Persistence: persistent
  Reports To:  DTP_CEO
  Workspace:   ~/.openclaw/workspace-dtp-onxza-architect/

  Next: Customize AGENTS.md and SOUL.md, then run:
    onxza agent validate dtp-onxza-architect
```

### 4.5 Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Validation error (name, duplicate, missing company, TORI-QMD) |
| 2 | Filesystem error |

### 4.6 What `onxza agent create` Does NOT Do

- Does not create OpenClaw agent sessions — that's OpenClaw's responsibility
- Does not configure heartbeats in OpenClaw cron — done separately
- Does not populate responsibilities in AGENTS.md — that's the AgentDeveloper's job
- Does not write the SOUL statement — that's the AgentDeveloper's job
- Does not update `docs/AGENT-REGISTRY.md` — that is a governance doc, updated by AgentDeveloper

---

## 5. `onxza company add` — Exact Specification

### 5.1 Invocation

```bash
onxza company add <name> [options]
```

| Flag | Default | Description |
|---|---|---|
| `--slug <slug>` | Auto-derived from name | PascalCase short identifier |
| `--parent <slug>` | *(none)* | Parent company slug |
| `--vision <path>` | *(none)* | Relative path to vision.md |
| `--json` | `false` | Machine-readable output |

### 5.2 Slug Derivation

If `--slug` not provided, derive from company name:
- "DevGru Technology Products" → `DTP` (first letter of each word, if ≤ 4 words)
- "Marcus Gear Agency" → `MGA`
- "World Destination Club" → `WDC`
- If > 4 words or ambiguous: prompt for explicit slug

**Slug validation:** Must match `^[A-Z][A-Za-z0-9]{0,31}$`. Must not already exist in `openclaw.json`.

### 5.3 Step-by-Step Execution

**Step 1: Validate name and slug** — check uniqueness against existing companies.

**Step 2: Create company shared-learnings directory**

```
<root>/workspace/shared-learnings/<slug>/
├── skills/
├── patterns/
└── tools/
```

**Step 3: Create company project directory (optional)**

If `--vision` is provided, ensure the parent directory exists:
```
<root>/workspace/projects/<project-slug>/
```

**Step 4: Register in `openclaw.json`**

Append to `companies.list[]`:

```json
{
  "slug": "<slug>",
  "name": "<full-name>",
  "parent": "<parent-slug-or-null>",
  "visionPath": "<vision-path-or-null>",
  "sharedLearningsPath": "shared-learnings/<slug>",
  "created": "<ISO-8601-now>"
}
```

**Step 5: Create checkpoint**

**Step 6: Print summary**

```
✓ Company registered: <name>

  Slug:              <slug>
  Parent:            <parent-slug or "none">
  Shared Learnings:  shared-learnings/<slug>/
  Vision:            <vision-path or "not set">

  Next: Create agents with:
    onxza agent create <Slug>_<Dept>_<Role>
```

### 5.4 Isolation Model

Each company has:
- Its own `shared-learnings/<slug>/` directory — skills, patterns, tools
- Its own agents — identified by the company prefix in agent names
- Its own vision documents — in `projects/<project>/vision.md`
- **NO access** to other companies' shared learnings (enforced by agent AGENTS.md scoping, not filesystem permissions)
- **Global** shared learnings (`shared-learnings/global/`) are readable by all companies

Cross-company data sharing requires explicit promotion from company-level to global-level, reviewed by the company PM and approved by the parent orchestrator.

---

## 6. Complete Data Model

### 6.1 `openclaw.json` Schema

The canonical schema is at `projects/onxza/schemas/openclaw.schema.json` (JSON Schema Draft 2020-12).

**Top-level sections:**

| Section | Required | Description |
|---|---|---|
| `$schemaVersion` | yes | SemVer — currently `"1.0.0"` |
| `meta` | yes | File metadata: `lastTouchedVersion`, `lastTouchedAt` |
| `wizard` | no | Setup wizard state |
| `auth` | no | LLM provider auth profiles |
| `agents` | yes | Agent registry: `defaults` + `list[]` |
| `companies` | no | Company registry: `list[]` |
| `dispatcher` | no | Ticket dispatcher config |
| `tools` | no | Global tool profile |
| `broadcast` | no | Broadcast strategy |
| `commands` | no | Command behavior config |
| `session` | no | Session scoping |
| `hooks` | no | Lifecycle hooks |
| `channels` | no | Channel configs (WhatsApp, iMessage, etc.) |
| `gateway` | no | Gateway daemon config |
| `skills` | no | Skill install config |
| `plugins` | no | Plugin registry |

**Agent entry schema:**

```typescript
interface AgentEntry {
  id: string;              // kebab-case, unique, 1-64 chars
  workspace: string;       // absolute path
  model?: {
    primary: string;       // "provider/model-name"
    fallback?: string;
  };
  default?: boolean;       // true for primary agent
  company?: string;        // company slug
  persistence?: "persistent" | "temporary";
  heartbeat?: {
    enabled: boolean;
    intervalMinutes?: number;
    cron?: string;
  };
  memorySearch?: {
    extraPaths?: string[];
  };
  disabled?: boolean;
  tags?: string[];
}
```

**Company entry schema:**

```typescript
interface CompanyEntry {
  slug: string;            // PascalCase, unique, 1-32 chars
  name: string;            // full display name
  parent?: string;         // parent company slug
  visionPath?: string;     // relative path to vision.md
  sharedLearningsPath?: string;
  created?: string;        // ISO 8601
  disabled?: boolean;
}
```

Full schema details: `projects/onxza/schemas/openclaw.schema.json`
Versioning strategy: `projects/onxza/docs/SCHEMA-VERSIONING.md`

### 6.2 Agent Workspace Schema

Every agent workspace directory contains exactly 6 files:

```
workspace-<agent-id>/
├── AGENTS.md        ← Identity, protocols, responsibilities, scope
├── SOUL.md          ← Personality, values, working style
├── IDENTITY.md      ← Structured identity card
├── MEMORY.md        ← Long-term memory (loaded every session)
├── TOOLS.md         ← Available tools, shared resources, credentials
└── HEARTBEAT.md     ← Recurring scheduled tasks
```

**AGENTS.md required content:**
- Agent name and company header
- Model and reports-to fields
- Identity statement
- Session start protocol (read SOUL.md → read MEMORY.md → check tickets → read shared learnings)
- Responsibilities list
- Ticket types (create and receive)
- Shared learnings scope (read and write paths)
- "What I Do NOT Do" section
- Pending ticket protocol
- Out-of-lane protocol
- Credit line

**IDENTITY.md required fields:**
- Full Name, Company, Department, Role, Model, Persistence, Reports To, Workspace, Shared Learnings Read/Write, Created date

**MEMORY.md required sections:**
- Initialized date and status
- Company context
- Active projects
- Key learnings
- Session history

**TORI-QMD validation rules** (enforced by `validate-tori-qmd.py`):

| File Type | Path Pattern | Required |
|---|---|---|
| AGENTS.md | `*/AGENTS.md` | Credit line |
| vision.md | `*/vision.md` | Status field + credit line |
| Memory files | `*/memory/*.md` | memory_id, agent, created, tags, summary |
| Skill files | `*/skills/*.md` | version, owner, created (or last_updated), credit line |
| Pattern files | `*/patterns/*.md` | memory_id, agent, created, tags, summary |
| ONXZA project files | `*/projects/onxza/*.md` | Credit line |

### 6.3 Ticket Schema

Every ticket is a markdown file with YAML frontmatter:

```yaml
---
id: TICKET-<YYYYMMDD>-<COMPANY>-<NNN>
type: <ticket-type>
created_by: <agent-id>
created_at: <ISO-8601>
assigned_to: <agent-id>
project: <project-slug>
company: <company-slug>
priority: low | medium | high | critical
status: open | in-progress | pending-approval | blocked | closed
requires_aaron: true | false
parent_ticket: <ticket-id> | null
related_vision: <path-to-vision.md>
---
```

**Ticket directory structure:**

```
tickets/
├── open/              ← Created, not yet picked up
├── in-progress/       ← Agent actively working
├── pending-approval/  ← Awaiting human or senior decision
├── blocked/           ← Dependency unmet
└── closed/            ← Complete — immutable record
```

**File naming convention:**

```
TICKET-<YYYYMMDD>-<COMPANY>-<NNN>-<slug>.md
```

Example: `TICKET-20260318-DTP-027-onxza-openclaw-json-schema.md`

**Ticket body sections:**
- Summary
- Context
- Requested Action
- Vision Alignment
- Dependencies (optional)
- Acceptance Criteria (checkboxes)
- Notes and Updates (appended during work)
- Completion Note (written when closing)

**Ticket lifecycle state transitions:**

```
open → in-progress        (agent picks up)
in-progress → closed      (work complete)
in-progress → blocked     (dependency unmet)
in-progress → pending-approval  (needs human decision)
blocked → in-progress     (dependency resolved)
pending-approval → in-progress  (approved)
pending-approval → closed      (rejected — with note)
any → closed              (cancelled — with note)
```

State transitions are implemented by moving the file between directories.

**v0.1 ticket types:**

| Type | Direction | Purpose |
|---|---|---|
| `task` | PM → Specialist | Standard work assignment |
| `approval_request` | PM → Marcus → Aaron | Requires human decision |
| `escalation` | Any → PM or above | Cannot resolve at current level |
| `agent_creation_request` | Any → AgentDeveloper | New agent needed |
| `credentials_needed` | Any → Marcus | Missing credentials |
| `security_flag` | Any → Security | Immediate security concern |

### 6.4 Shared Learnings Structure

```
shared-learnings/
├── global/                   ← Readable by all agents in all companies
│   ├── skills/               ← Reusable instruction documents
│   ├── patterns/             ← What worked, what didn't
│   └── tools/                ← Tool-specific notes
├── <CompanySlug>/            ← Readable only by agents in that company
│   ├── skills/
│   ├── patterns/
│   └── tools/
└── <CompanySlug>/<Project>/  ← Project-specific (optional nesting)
    ├── skills/
    └── patterns/
```

**Shared learning file types:**

| Type | Directory | Required Frontmatter |
|---|---|---|
| Skill | `skills/` | version, owner, created/last_updated, credit line |
| Pattern | `patterns/` | memory_id, agent, created, tags, summary |
| Tool Note | `tools/` | None (generic markdown) |

**Promotion flow:**

```
Agent writes to company shared-learnings
  → Company PM reviews
  → If cross-company valuable: copy to global/
  → If systemic: AgentDeveloper updates global standard template
```

### 6.5 Checkpoint Structure

```
checkpoints/<YYYYMMDD-HHMMSS>-<slug>/
├── manifest.json       ← version, timestamp, trigger, agent-id
├── openclaw.json       ← full copy at checkpoint time
├── agents-list.txt     ← agent IDs at checkpoint time (optional)
├── vision-hashes.txt   ← SHA-256 of all vision.md files (optional)
└── README.md           ← human-readable description
```

**manifest.json schema:**

```json
{
  "version": "1.0.0",
  "timestamp": "<ISO-8601>",
  "trigger": "onxza init | onxza agent create <id> | onxza company add <name> | manual",
  "agentId": "<agent-id-or-onxza-cli>",
  "onxzaVersion": "<cli-version>",
  "description": "<human-readable>"
}
```

### 6.6 Audit Trail Format

File: `workspace/logs/audit/audit-trail.md`

Append-only markdown table. Never modified — only appended.

```markdown
| Timestamp | Agent | Action | Outcome | Confirmed By | Checkpoint | Reversible |
|---|---|---|---|---|---|---|
| <ISO-8601> | <agent-id> | <action-description> | executed/cancelled/pending | <confirmer> | <checkpoint-id> | yes/no |
```

---

## 7. CLI Surface — Complete v0.1 Command Reference

### 7.1 Command Tree

```
onxza
├── init                                    Initialize ONXZA installation
├── status                                  Show system status
├── agent
│   ├── create <Company_Dept_Role>          Scaffold new agent
│   ├── list [--company <slug>] [--json]    List agents
│   └── validate <agent-id>                 Validate agent files
├── company
│   ├── add <name>                          Register new company
│   ├── list [--json]                       List companies
│   └── switch <slug>                       Set active company context
├── config
│   ├── validate [--file <path>] [--json]   Validate openclaw.json
│   ├── migrate [--dry-run] [--to <ver>]    Migrate schema version
│   └── version                             Show schema version
├── ticket
│   ├── list [--status <s>] [--company <c>] List tickets
│   └── show <ticket-id>                    Show ticket details
├── skill
│   ├── install <name>                      Install skill from npm
│   ├── list [--json]                       List installed skills
│   └── update [<name>]                     Update skill(s)
├── checkpoint
│   ├── create [--slug <s>]                 Create manual checkpoint
│   └── list [--json]                       List checkpoints
├── validate <file>                         Run TORI-QMD on any .md file
├── help [<command>]                        Show help
└── version                                 Show CLI version
```

### 7.2 `onxza status`

Reads `openclaw.json` and filesystem. Outputs:

```
ONXZA v0.1.0

  Schema:      v1.0.0
  Location:    ~/.openclaw
  Companies:   5
  Agents:      94 (92 persistent, 2 temporary)
  Tickets:     12 open, 3 in-progress, 1 blocked
  Checkpoints: 7

  Last Activity: 2026-03-18T18:46:00-07:00
```

Exit 0. If not initialized: `"ONXZA not initialized. Run 'onxza init'."` Exit 1.

### 7.3 `onxza agent list`

```
ID                         Company  Model                          Status
─────────────────────────  ───────  ─────────────────────────────  ──────
main                       MG       anthropic/claude-sonnet-4-6    active
mg-parent-orchestrator     MG       anthropic/claude-sonnet-4-6    active
dtp-onxza-architect        DTP      anthropic/claude-opus-4-6      active
dtp-onxza-backend          DTP      anthropic/claude-sonnet-4-6    active
...

Total: 94 agents (92 persistent, 2 temporary)
```

With `--json`: outputs `agents.list[]` as JSON array.
With `--company DTP`: filters to DTP agents only.

### 7.4 `onxza agent validate <agent-id>`

Runs validation on all 6 agent files:

```
Validating agent: dtp-onxza-architect

  ✓ AGENTS.md    — TORI-QMD pass
  ✓ SOUL.md      — exists
  ✓ IDENTITY.md  — exists, fields complete
  ✓ MEMORY.md    — exists, sections present
  ✓ TOOLS.md     — exists
  ✓ HEARTBEAT.md — exists
  ✓ Registered in openclaw.json
  ✓ Workspace directory exists

Result: PASS (8/8 checks)
```

Checks performed:
1. All 6 files exist in workspace directory
2. AGENTS.md passes TORI-QMD (credit line)
3. IDENTITY.md has all required fields (Full Name, Company, Department, Role, Model, Persistence)
4. MEMORY.md has required sections (Initialized, Company Context, Active Projects, Key Learnings, Session History)
5. Agent ID exists in `openclaw.json` `agents.list[]`
6. Workspace path in `openclaw.json` matches actual directory
7. Model reference is well-formed
8. Company slug (if set) references a valid company

### 7.5 `onxza company list`

```
Slug  Name                         Parent  Agents  Created
────  ───────────────────────────  ──────  ──────  ──────────
MG    Marcus Gear Inc.             —       10      2026-03-17
WDC   World Destination Club       MG      29      2026-03-17
MGA   Marcus Gear Agency           MG      27      2026-03-17
DTP   DevGru Technology Products   MG      22      2026-03-17
MGP   Marcus Gear Publishing       MG      7       2026-03-18

Total: 5 companies, 95 agents
```

### 7.6 `onxza company switch <slug>`

Sets the active company context. This affects:
- Default `--company` filter in `onxza agent list`, `onxza ticket list`
- Default company slug for `onxza agent create`

Stored in `openclaw.json` as `meta.activeCompany`.

### 7.7 `onxza ticket list`

```
ID                         Status       Priority  Assigned To              Company
─────────────────────────  ───────────  ────────  ───────────────────────  ───────
TICKET-20260318-DTP-027    closed       high      dtp-coo                  DTP
TICKET-20260318-DTP-032    closed       high      dtp-coo                  DTP
TICKET-20260318-DTP-003    in-progress  high      dtp-onxza-pm             DTP

Showing: 3 tickets (filter: all)
```

Reads YAML frontmatter from all ticket files across all status directories.

### 7.8 `onxza ticket show <ticket-id>`

Renders the full ticket markdown to terminal. Syntax-highlighted YAML frontmatter, formatted body.

### 7.9 `onxza skill install <name>`

```bash
onxza skill install blogwatcher
```

Runs `npm install -g <name>` (or configured package manager). Skills are OpenClaw-compatible skill packages.

v0.1 does NOT include a custom skills marketplace — skills install from npm directly.

### 7.10 `onxza validate <file>`

Direct wrapper around `validate-tori-qmd.py`:

```bash
onxza validate docs/ARCHITECTURE-v0.1.md
# ✓ PASS: docs/ARCHITECTURE-v0.1.md
```

### 7.11 `onxza checkpoint create`

```bash
onxza checkpoint create --slug "pre-deploy-check"
```

Creates a manual checkpoint. Same structure as auto-checkpoints.

### 7.12 Global Flags

All commands accept:

| Flag | Description |
|---|---|
| `--json` | Machine-readable JSON output |
| `--help` | Show command help |
| `--version` | Show CLI version |
| `--dir <path>` | Override ONXZA root (default: `~/.openclaw`) |
| `--verbose` | Detailed output |
| `--quiet` | Suppress non-error output |

---

## 8. Inter-Agent Ticket Protocol

### 8.1 How Agents Communicate

All inter-agent communication flows through the ticket system. Agents do NOT:
- Read other agents' MEMORY.md
- Write to other agents' workspaces
- Send direct messages between agents (outside the ticket system)

### 8.2 Ticket Creation Flow

```
Agent A identifies work for Agent B
  → Agent A creates ticket in tickets/open/
  → Ticket assigned_to: <agent-b-id>
  → Dispatcher (cron job, every 5 minutes) scans tickets/open/
  → Dispatcher sends TICKET_ASSIGNED notification to Agent B's session
  → Agent B reads ticket, begins work
  → Agent B moves ticket to tickets/in-progress/
  → Agent B completes work, writes completion note
  → Agent B moves ticket to tickets/closed/
```

### 8.3 Ticket ID Generation

Format: `TICKET-<YYYYMMDD>-<COMPANY>-<NNN>`

`<NNN>` is a zero-padded 3-digit sequence number, unique per day per company. To generate:
1. Scan `tickets/` (all subdirectories) for files matching `TICKET-<today>-<company>-*`
2. Find highest existing `<NNN>`
3. Increment by 1
4. If no tickets exist for today+company: start at `001`

### 8.4 Dispatcher Architecture (v0.1)

The dispatcher is an OpenClaw cron job that runs every 5 minutes:

```
1. Scan tickets/open/ for all .md files
2. Parse YAML frontmatter
3. For each ticket with assigned_to set:
   a. Check if assigned agent has an active OpenClaw session
   b. If yes: send TICKET_ASSIGNED message to agent session
   c. If no: log and skip (agent will pick up on next session start)
4. For tickets without assigned_to: log as unassigned
```

The dispatcher is NOT part of the `onxza` CLI binary. It is configured as an OpenClaw cron job during `onxza init` or manually. v0.1 provides the cron job script; installation is documented but not automated.

### 8.5 Escalation Protocol

```
Agent cannot resolve → creates escalation ticket
  → assigned_to: department PM
  → PM reviews → resolves or escalates to CEO/Orchestrator
  → If requires_aaron: true → routes to Marcus → Aaron
```

Maximum escalation chain: Specialist → PM → CEO → Orchestrator → Marcus → Aaron.

---

## 9. Skill Install/Publish Interface

### 9.1 Skill Install (v0.1)

Skills are npm packages. No custom registry.

```bash
onxza skill install <package-name>
# Equivalent to: npm install -g <package-name>
```

The skill package must contain a `SKILL.md` file at its root or in a `skill/` subdirectory.

### 9.2 Skill List (v0.1)

```bash
onxza skill list
```

Scans the global npm `node_modules` for packages containing `SKILL.md`. Outputs:

```
Name            Version  Description
──────────────  ───────  ──────────────────────────────
blogwatcher     1.2.0    Monitor blogs and RSS feeds
weather         0.5.0    Weather forecasts via wttr.in
```

### 9.3 Skill Publish (v0.1 — Deferred)

`onxza skill publish` is specced but NOT implemented in v0.1. Skills are published via standard `npm publish`. A dedicated marketplace UI is deferred to v0.5+.

---

## 10. v0.1 Includes — Explicit List

Everything in this section ships in v0.1. Nothing else.

| Feature | Status |
|---|---|
| `onxza init` | Full implementation per Section 3 |
| `onxza agent create` | Full implementation per Section 4 |
| `onxza agent list` | Full implementation |
| `onxza agent validate` | Full implementation |
| `onxza company add` | Full implementation per Section 5 |
| `onxza company list` | Full implementation |
| `onxza company switch` | Full implementation |
| `onxza config validate` | Full implementation |
| `onxza config migrate` | Full implementation (0.0.0 → 1.0.0 migration) |
| `onxza config version` | Full implementation |
| `onxza ticket list` | Full implementation |
| `onxza ticket show` | Full implementation |
| `onxza skill install` | npm wrapper |
| `onxza skill list` | Scan installed skills |
| `onxza skill update` | npm update wrapper |
| `onxza checkpoint create` | Full implementation |
| `onxza checkpoint list` | Full implementation |
| `onxza validate` | TORI-QMD wrapper |
| `onxza status` | Full implementation |
| `onxza help` | Full implementation |
| `onxza version` | Full implementation |
| `openclaw.json` schema v1.0.0 | Published, validated |
| Global agent template (6 files) | Published, TORI-QMD-validated |
| TORI-QMD validator (Python) | Existing, bundled |
| Checkpoint system | Full implementation |
| Audit trail | Append-only markdown |
| Dispatcher script | Provided as OpenClaw cron job script |
| FAAILS protocol specs | Published as docs (not code-enforced) |
| `--json` flag on all list/status commands | Full implementation |
| Pre-commit git hook for TORI-QMD | Installed by `onxza init` |
| npm distribution (`npm install -g onxza`) | Full implementation |
| curl one-liner (`get.onxza.com`) | Script that wraps npm install |

---

## 11. v0.1 Excludes — Explicit List

Everything in this section is deferred. It does not exist in v0.1 code, tests, or docs (beyond this exclusion list).

| Feature | Deferred To | Reason |
|---|---|---|
| Cloud platform | v1.0 (180-day) | Requires hosting, auth, billing infrastructure |
| Marketplace UI | v0.5 (90-day) | npm install is sufficient for v0.1 |
| `onxza skill publish` | v0.5 | Requires marketplace backend |
| `onxza dashboard` (Mission Control) | v0.5 | TUI/web dashboard is large scope |
| `onxza start` / `onxza stop` (daemon) | v0.5 | v0.1 runs on OpenClaw's daemon, not its own |
| ONXZA-LLM training pipeline | v1.0 (180-day) | Requires operational data accumulation |
| `onxza pull onxza-llm` | v1.0 | Requires ONXZA-LLM to exist |
| MoE routing engine (code) | v0.5 | Protocol specced in FAAILS; code implementation deferred |
| FVP verification engine (code) | v0.5 | Protocol specced; agents self-implement via prompts in v0.1 |
| MPI data collection (automated) | v0.5 | Manual in v0.1; automated pipeline deferred |
| Self-correcting routing (code) | v0.5 | Protocol specced; not code-enforced in v0.1 |
| `onxza agent retire` | v0.5 | Manual workspace deletion in v0.1 |
| `onxza agent upgrade` | v0.5 | Template updates to existing agents |
| `onxza script create` / `onxza script run` | v0.5 | Script engine is separate workstream |
| `onxza logs` (live tail) | v0.5 | Log aggregation system needed |
| Remote/Tailscale gateway automation | v0.5 | Manual config in v0.1 |
| Multi-user auth | v1.0 | Single-user (Aaron) in v0.1 |
| Database backend (Supabase) | v0.5+ | Filesystem-only in v0.1 |
| Web docs site (onxza.com) | v0.5 | Docs are markdown in repo for v0.1 |
| Commercial licensing system | v1.0 | No revenue features in v0.1 |
| Enterprise white-label | v1.0+ | Far future |
| Agent-to-agent direct messaging | Not planned | Ticket system is the communication layer |
| Windows support | v0.5 | macOS and Linux only in v0.1 |

---

## 12. v0.1 Testing Strategy

### 12.1 Unit Tests (Vitest)

Every function in `@onxza/core` has unit tests:

| Module | Test Coverage |
|---|---|
| `config/` | Read, write, validate, migrate openclaw.json |
| `agent/` | Name parsing, template rendering, registration, validation |
| `company/` | Slug derivation, registration, isolation |
| `template/` | Mustache rendering with all variable combinations |
| `tori/` | All TORI-QMD validation rules |
| `checkpoint/` | Create, list, manifest generation |
| `ticket/` | Frontmatter parsing, listing, ID generation |
| `schema/` | Schema loading, Ajv validation |

### 12.2 Integration Tests

End-to-end CLI command tests:

```
onxza init → verify directory structure + openclaw.json + git repo
onxza company add → verify registration + directories
onxza agent create → verify 6 files + TORI-QMD + registration
onxza config validate → verify pass/fail on valid/invalid JSON
onxza agent validate → verify all 8 checks
```

Integration tests use a temporary directory and clean up after each test.

### 12.3 Snapshot Tests

Golden-file tests for:
- Template rendering output (all 6 files with known variables)
- `onxza status` output format
- `onxza agent list` output format

---

## 13. Implementation Priority

Agents should build in this order. Each phase depends on the previous.

### Phase 1: Core Library (`@onxza/core`)

1. `types.ts` — all TypeScript interfaces
2. `config/` — openclaw.json read/write/validate/migrate
3. `schema/` — Ajv schema loader
4. `template/` — Mustache renderer
5. `tori/` — TORI-QMD validator (TypeScript port)
6. `checkpoint/` — create/list
7. `agent/` — name parser, create, validate, list
8. `company/` — add, list, switch
9. `ticket/` — list, show, ID generator

### Phase 2: CLI (`onxza`)

1. CLI entry point + Commander setup
2. `onxza version` + `onxza help`
3. `onxza init`
4. `onxza company add` + `onxza company list`
5. `onxza agent create` + `onxza agent list` + `onxza agent validate`
6. `onxza config validate` + `onxza config migrate` + `onxza config version`
7. `onxza ticket list` + `onxza ticket show`
8. `onxza skill install` + `onxza skill list` + `onxza skill update`
9. `onxza checkpoint create` + `onxza checkpoint list`
10. `onxza validate`
11. `onxza status`
12. `onxza company switch`

### Phase 3: Distribution

1. Build pipeline (tsup)
2. npm package config
3. `get.onxza.com` curl script
4. README.md for GitHub
5. QA pass — all integration tests green

---

## 14. Open Decisions (Resolved)

| Decision | Resolution | Rationale |
|---|---|---|
| TypeScript vs Python for CLI | TypeScript | OpenClaw ecosystem alignment. Shared deps. One runtime for users. |
| Monorepo vs single package | Monorepo (`core` + `cli`) | Core is reusable by future `server` package. Clean separation. |
| pnpm vs npm for dev | pnpm workspaces for dev, npm for distribution | pnpm is better for monorepo dev; users install via npm. |
| Mustache vs Handlebars vs EJS | Mustache | Logic-less. Templates are markdown. Simplest option. |
| Schema validator | Ajv | Industry standard. Fast. Full Draft 2020-12 support. |
| Dispatcher: built into CLI or separate? | Separate (OpenClaw cron script) | CLI is a tool, not a daemon. Dispatcher runs on OpenClaw's cron. |
| Ticket IDs: UUID vs sequential | Sequential (`TICKET-DATE-COMPANY-NNN`) | Human-readable. Easy to reference in conversation. Unique per day+company. |
| Agent workspace: inside `workspace/` or sibling? | Sibling (`workspace-<id>/`) | Current pattern. Already works. 98 agents prove the model. |
| TORI-QMD: keep Python or port to TS? | Port to TS (in `@onxza/core`), keep Python for backward compat | TS port for programmatic use. Python stays as standalone script. |
| v0.1 OS support | macOS + Linux | Windows deferred. No current Windows installations. |

---

## 15. Constraints and Invariants

These are non-negotiable rules that every line of v0.1 code must respect:

1. **Zero cloud dependency.** v0.1 works entirely offline on local filesystem.
2. **Zero database dependency.** All state is in files: `openclaw.json`, tickets, memory.
3. **Idempotent commands.** Running any command twice produces the same state.
4. **Checkpoint before mutation.** Any command that modifies `openclaw.json` creates a checkpoint first.
5. **Credit line in all generated .md files.** Every markdown file ONXZA creates includes the official credit line.
6. **No silent failures.** Every error prints a specific, actionable message and exits with non-zero code.
7. **No interactive prompts with `--json`.** JSON mode never prompts — missing required values are errors.
8. **Under 2 minutes to install.** `npm install -g onxza && onxza init` must complete in under 2 minutes on a standard machine.
9. **Under 10 seconds for any command.** No command blocks for more than 10 seconds (excluding `skill install` which depends on npm).
10. **Backward compatible with existing installations.** Running v0.1 on the current DevGru `~/.openclaw/` does not break anything. `config migrate` upgrades gracefully.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

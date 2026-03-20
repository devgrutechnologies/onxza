---
doc_id: ONXZA-DOC-003
title: Systems and Processes
version: 2.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: systems, processes, architecture, workflows, operations, all-agents
summary: How every system in ONXZA works end-to-end. Work flow, agent communication, project structure, ticket system, content tracking, self-maintenance. Read this when you need to understand how something works.
---

# ONXZA Systems and Processes

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 2.0.0

---

## How to Use This Document

This document defines how every system works end to end. When you need to understand how something works — read this. When you are unsure what process to follow — read this. If a process is missing, create a `policy_gap_request` ticket.

---

## Section 1 — Technology Stack

```
LLMs:        Claude (Anthropic) + GPT (OpenAI) + local models via Ollama
Runtime:     OpenClaw (agent persistence, channels, daemon agents)
System:      ONXZA (AI company operating system)
Protocol:    FAAILS (open standard ONXZA implements)
Database:    Supabase (secrets primary store + content tracking)
Automation:  n8n (local workflows)
Browser:     OpenClaw browser tool
Version:     Git (local source of truth + GitHub backup)
```

---

## Section 2 — Workspace Directory Structure

```
~/.openclaw/
├── workspace/                    ← Primary agent workspace
│   ├── AGENTS.md                 ← Primary agent system prompt — READ ON BOOT
│   ├── memory/
│   │   ├── deferred-triggers.md  ← Triggers deferred during active tasks
│   │   └── [YYYY-MM-DD].md       ← Daily session logs
│   ├── docs/                     ← Governance docs (DOC-001 through DOC-014)
│   ├── tickets/
│   │   ├── open/
│   │   ├── in-progress/
│   │   ├── pending-approval/
│   │   ├── blocked/
│   │   └── closed/
│   ├── projects/
│   │   └── [project-slug]/
│   │       └── vision.md         ← IMMUTABLE after owner approval
│   ├── logs/
│   │   ├── audit/
│   │   │   └── audit-trail.md    ← Append-only irreversible action log
│   │   └── rate-limit-alerts.log
│   ├── scripts/
│   │   ├── validate-tori-qmd.py  ← Runs on every .md file before commit
│   │   ├── create-checkpoint.py  ← Creates system state snapshots
│   │   └── log-audit-entry.py    ← Appends to audit trail
│   └── shared-learnings/
│       ├── global/
│       │   ├── skills/           ← Global standard skill MDs
│       │   └── patterns/         ← Cross-project patterns
│       └── [company]/
│           ├── skills/
│           └── patterns/
│
├── workspace-[agent-id]/         ← One directory per agent
│   ├── AGENTS.md                 ← Agent identity and protocols
│   ├── SOUL.md                   ← Agent personality and values
│   ├── IDENTITY.md               ← Structured identity card
│   ├── MEMORY.md                 ← Initialized with company context
│   ├── TOOLS.md                  ← Available tools and skills
│   └── HEARTBEAT.md              ← Scheduled tasks (empty if none)
│
└── checkpoints/                  ← System state snapshots
    └── [YYYYMMDD-HHMMSS]-[slug]/
        ├── manifest.json
        ├── openclaw.json
        ├── agents-list.txt
        ├── vision-hashes.txt
        └── README.md
```

---

## Section 3 — Git Standards

- **Local is the source of truth.** GitHub is the backup.
- Pre-commit hook validates TORI-QMD on all `.md` files before every commit.
- **Commit format:** `[agent-id] [action] [target] — [description]. Created by Aaron Gear and Marcus Gear`
- Co-creator credit in every commit message.
- Example: `wdc-content-blog content-publish travel-blog — Published 20 Paris posts. Created by Aaron Gear and Marcus Gear`

---

## Section 4 — Vision-to-Execution Flow

### Complete Flow (CDP-001 Protocol)

```
Owner gives vision to primary agent
        ↓
Primary agent logs input to memory (channel + timestamp + content)
        ↓
Primary agent creates draft vision.md
Status: CDP-REVIEW (not immutable yet)
        ↓
Primary agent convenes CDP board session
Each board member reviews INDEPENDENTLY
Each answers 5 questions (see Policies and Procedures, Section 13)
        ↓
Primary agent synthesizes board responses
Reduces to maximum 3 questions for owner
        ↓
Primary agent presents:
"Here is what we understand you want to build.
Here is what we need. Here are [N] questions.
Your yes starts the machine."
        ↓
Owner responds
        ↓
vision.md updated. Board does final 24-hour pass.
        ↓
Vision APPROVED — IMMUTABLE
        ↓
Primary agent creates checkpoint
        ↓
Primary agent sends to Orchestrator
        ↓
Orchestrator routes to CEO agents / department PMs
        ↓
Department PMs create task breakdowns in dependency order
        ↓
Specialist agents execute (Perceive → Reason → Plan → Execute)
        ↓
FVP verification on every output
        ↓
PM verifies, aggregates progress
        ↓
Phase-complete report → Orchestrator → Primary agent
        ↓
Primary agent monitors, surfaces to owner only what needs owner
        ↓
Target reached → forward_proposal created
Primary agent → owner: "What's next?"
```

### Vision Document Structure

```markdown
---
memory_id: VISION-[slug]
project: [project-slug]
status: CDP-REVIEW | APPROVED — IMMUTABLE
created: [date]
credit_line: present
---

# Vision: [Project Name]
[Credit line]

## Owner's Original Vision
[Verbatim quote — never paraphrase]

## Current State
[Factual description of where things are now]

## Expanded Vision
### 30-Day Target
### 90-Day Target
### 180-Day Target

## Goals and Non-Negotiables
## Constraints
## Revenue Model
## Agent Team
## Content Tracking
## Owner's Required Actions
## Open Questions
## Forward Vision

---
[Credit line]
```

---

## Section 5 — Ticket System

### Ticket File Naming
```
tickets/[status]/TICKET-[YYYYMMDD]-[sequence]-[slug].md
```
Example: `tickets/open/TICKET-20260317-0042-awin-credentials-needed.md`

### Ticket Schema

```markdown
---
id: TICKET-[YYYYMMDD]-[sequence]
type: [see types below]
created_by: [agent-id]
created_at: [ISO 8601]
assigned_to: [agent-id]
project: [project-slug]
priority: [low | medium | high | critical]
status: [open | in-progress | pending-approval | blocked | closed]
requires_owner: [true | false]
parent_ticket: [ticket-id or null]
related_vision: [path to vision.md]
---

## Summary
[One sentence — what this ticket is]

## Context
[Background needed to act on this ticket]

## Requested Action
[Exact deliverable required]

## Vision Alignment
[One sentence connecting to project vision]

## Dependencies
[Ticket IDs that must complete first]

## Acceptance Criteria
[How will we know this is done correctly]

## Notes and Updates
[Chronological log — agents append as work progresses]

## Completion Note
[Written when closed — what was done, where output lives]
```

### Ticket Type Registry

| Type | Description |
|---|---|
| `task` | Standard work task from PM to specialist agent |
| `security_flag` | Security concern — route immediately to security agent |
| `approval_request` | Requires owner approval |
| `agent_creation_request` | New persistent agent needed |
| `agent_spawn_request` | Temporary sub-agent needed |
| `skill_approval_request` | New skill needed — includes research |
| `skill_update_request` | Existing skill needs update |
| `credentials_needed` | Missing credentials blocking work |
| `model_performance_data` | Real-world routing performance data |
| `script_creation_request` | New automation script needed |
| `vision_update_request` | Proposed change to `vision.md` |
| `policy_gap_request` | Missing policy or procedure |
| `document_update_request` | Foundational doc needs update |
| `escalation` | Problem that cannot resolve at current level |
| `forward_proposal` | Proposed next phase after target reached |
| `fvp_escalation` | Output failed FVP after 3 loops |
| `agent_recovery` | Stale TASK_STATE detected — agent may have crashed |
| `cdp_board_review` | Vision board review request |
| `cdp_board_response` | Vision board review response |
| `qc_review_request` | Random QC review of completed task |
| `cross_department` | Work needed from another department |
| `dependency_block` | Task blocked by unmet dependency |
| `model_override_request` | Task needs different model tier |
| `rate_limit_alert` | Agent approaching or hitting rate limit |
| `content_tracking_update` | New content published — needs tracking entry |

### Ticket Priority Response Times

| Priority | Expected Response |
|---|---|
| Critical | Immediate — bypasses queue |
| High | Within current active session |
| Medium | Within next session start |
| Low | Within 24 hours |

### Ticket Lifecycle

```
Created → tickets/open/
Picked up → tickets/in-progress/
Awaiting approval → tickets/pending-approval/
Blocked on dependency → tickets/blocked/
Resolved → tickets/closed/
```

---

## Section 6 — Agent Creation System

### Two-Layer Agent Creation Formula

```
Global Standard Template
+ Company Vision Context
+ Company Tech Stack
+ Company Shared Learnings
+ Project-Specific Knowledge
= A perfectly initialized specialist agent
```

No agent is ever built from zero.

### Agent Creation Process

**Phase 1 — Research**
- What is the exact skill domain?
- What tools does this domain require?
- Are there existing agents with overlapping skills?
- What model tier is appropriate?
- Is this a persistent daemon or temporary sub-agent?

**Phase 2 — Design Document**
Create a design doc before writing any agent files:
- Agent identity and purpose
- Skill domain and hard boundaries
- Required skills with sources and rationale
- Memory structure design
- Communication interfaces (ticket types in/out)
- Model routing recommendation
- Failure handling and escalation paths
- Vision alignment justification

**Phase 3 — Approval (if needed)**
New paid tools → `requires_owner: true` approval ticket. Wait before proceeding.

**Phase 4 — Build (in order)**
1. Create workspace directory: `workspace-[role-lowercase]/`
2. Write all 6 files: AGENTS.md, SOUL.md, IDENTITY.md, MEMORY.md, TOOLS.md, HEARTBEAT.md
3. Run `validate-tori-qmd.py` on all 6 files — all must pass before continuing.
4. Register in openclaw.json with correct workspace path and model.
5. Create checkpoint: `create-checkpoint.py agent-created-[agent-id]`

**Phase 5 — Validation**
1. Run a test task appropriate to the agent's domain.
2. Verify output quality against the design spec.
3. Security review of the agent's tool set.
4. Agent enters training mode for first 10 tasks.

### Agent Persistence Classification

**PERSISTENT DAEMON:**
- All CEO, orchestrator, department lead, and AgentDeveloper agents.
- All specialist agents on ongoing projects.
- Registered permanently in openclaw.json.
- Full 6-file workspace.

**TEMPORARY SUB-AGENT:**
- One-off project specialists only.
- NOT registered permanently in openclaw.json.
- Before retirement: archive learnings to `shared-learnings/[company]/patterns/archived/[slug]-learnings.md`.

**Conversion:** If a one-off project becomes ongoing, convert the sub-agent to a persistent daemon. Full workspace created. Owner notified.

---

## Section 7 — Content Tracking System

### Content Tracking is Mandatory

Every piece of content published by any agent must be logged. Zero untracked content. Tracking happens at publish time, not after.

### Content Tracking Schema

```sql
content_tracking (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  url             TEXT,
  slug            TEXT,
  published_date  TIMESTAMPTZ NOT NULL,
  channel         TEXT NOT NULL,  -- blog | youtube | instagram | tiktok | email | linkedin | x
  status          TEXT NOT NULL,  -- draft | scheduled | published | archived
  project         TEXT NOT NULL,
  company         TEXT NOT NULL,
  author_agent    TEXT NOT NULL,
  content_type    TEXT NOT NULL,  -- blog_post | video | social_post | email | short_form
  word_count      INTEGER,
  duration_seconds INTEGER,
  affiliate_links JSONB,
  seo_keyword     TEXT,
  seo_score       INTEGER,
  youtube_id      TEXT,
  post_id         TEXT,
  thumbnail_url   TEXT,
  tags            TEXT[],
  engagement      JSONB,          -- {views, clicks, conversions, earnings}
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### Content Tracking Process

1. Publish the content.
2. Capture the published URL and platform post ID.
3. Create `content_tracking_update` ticket to Content PM.
4. PM (or automation via n8n) inserts row to the database.

For automated bulk publishing, the publish script inserts directly to the database in the same run — no manual ticket needed.

---

## Section 8 — Credential Management System

See [Policies and Procedures](policies-and-procedures.md) Section 4 for the full credential access pattern. Key points:

- Credentials referenced by name only — never by value.
- Primary store: Supabase encrypted secrets table (configurable at `onxza init`).
- Agents in BLOCKED state surface themselves via `credentials_needed` ticket.
- They do NOT stop all work — they continue everything that doesn't need the missing credential.

---

## Section 9 — Browser and Platform Automation

### OpenClaw Browser Tool

The OpenClaw browser tool provides an isolated Chrome profile completely separate from the user's personal browser. Mandatory for all web interaction requiring login, forms, or clicks.

```bash
# Start browser
openclaw browser --browser-profile openclaw start

# Navigate to URL
openclaw browser navigate url=https://example.com

# Take snapshot (always do this first — get element refs)
openclaw browser snapshot --interactive

# Click element by ref
openclaw browser act ref=[n] action=click

# Type into element
openclaw browser type ref=[n] text="value"

# Take screenshot
openclaw browser screenshot
```

**Critical:** Always snapshot before acting. Refs are not stable across navigations — re-snapshot after every page change.

### macOS Desktop Automation (Peekaboo)

For macOS desktop applications (non-browser), use the Peekaboo CLI:

```bash
# Screenshot with element annotations
peekaboo see --annotate --path /tmp/see.png

# Click element by ID
peekaboo click --on [element-id]

# Type text
peekaboo type "text to type"

# Press key combination
peekaboo press cmd,s
```

Standard workflow: always `see --annotate` first to get element IDs, then act using those IDs.

---

## Section 10 — Memory and Knowledge System

### TORI-QMD Memory Format

All memory files, skill MDs, and agent files require TORI-QMD frontmatter for efficient RAG retrieval.

**Memory and pattern files:**
```yaml
---
memory_id: [unique-id]
agent: [agent-id]
project: [project-slug or "system"]
created: [ISO date]
last_updated: [ISO date]
tags: [comma-separated retrieval tags]
summary: [one sentence — what this file contains]
---
```

**Skill files:**
```yaml
---
version: [semver]
owner: [agent-id]
created: [ISO date]
last_updated: [ISO date]
tags: [comma-separated]
summary: [one sentence]
---
```

**Validation:** Run `scripts/validate-tori-qmd.py [filepath]` on every file. The pre-commit hook enforces this — malformed files cannot be committed.

### Shared Learnings Architecture

Two types of memory. Never mix them.

**Private memory** (stays in own workspace):
Project-specific data, client data, vision specifics, credentials, business strategy.

**Shared learnings** (flows to company folder):
Patterns that worked or failed, skill discoveries, tool performance notes, process improvements, model routing observations. **Never contains project-specific or sensitive data.**

**Aggregation flow:**
```
Specialist writes/updates shared learning
        ↓
Company AgentDeveloper reviews quarterly
Elevates best patterns to company standard
        ↓
Global AgentDeveloper reviews quarterly
Elevates best to global standard
        ↓
Global standard reviewed for ONXZA public library
Published with full credit line
```

---

## Section 11 — Checkpoint and Recovery System

### When Checkpoints Are Created

- Before any `vision.md` approval
- Before any agent creation or modification
- Before any system config change
- Before any bulk operation (10+ files)
- Before any irreversible browser action
- Daily at midnight via cron
- Before any App Store submission

### Manual Checkpoint

```bash
python3 ~/.openclaw/workspace/scripts/create-checkpoint.py [event-slug]
```

### Checkpoint Contents

```
checkpoints/[YYYYMMDD-HHMMSS]-[slug]/
├── manifest.json       (what changed, who triggered it)
├── openclaw.json       (full config snapshot)
├── agents-list.txt     (all agent IDs + models)
├── vision-hashes.txt   (hash of each vision.md)
└── README.md           (human-readable summary)
```

### Recovery

```bash
# List checkpoints
ls ~/.openclaw/checkpoints/

# Read checkpoint summary
cat ~/.openclaw/checkpoints/[id]/README.md

# Restore openclaw.json
cp ~/.openclaw/checkpoints/[id]/openclaw.json ~/.openclaw/openclaw.json

# Restore workspace files
git checkout [commit-hash]
```

---

## Section 12 — Quality and Verification System

### FVP — FAAILS Verification Protocol

Every agent output passes FVP before acceptance:

1. Confidence score ≥70 required to proceed.
2. Humanization check (no AI tells, natural language).
3. Fact/accuracy check (verified, vision-aligned, meets acceptance criteria).
4. Max 3 loops then `fvp_escalation` ticket to PM.

### Model Performance Index (MPI)

The routing optimization mechanism. Tracks in real-world conditions:
- Which models pass FVP first attempt by task type
- Average loops required by model
- Cost per successful completion
- Time to completion

Over thousands of tasks, this data optimizes routing automatically. Nobody manually maintains routing tables — the data decides.

### Pre-Commit Validation

Every `.md` file committed to git passes through `validate-tori-qmd.py`. Files with missing frontmatter block the commit. The error shows exactly which fields are missing.

---

## Section 13 — Project Lifecycle

### Project Types

| Type | Description | Examples |
|---|---|---|
| Persistent | Always-on, evolves | Website, social channels, email program |
| One-off | Scoped, has an end | Write a specific book, one campaign |
| Evolving | Has target, keeps going | Revenue targets, follower milestones |

### Target Reached Protocol

When initial vision target is achieved:
1. PM notifies Orchestrator with phase-complete report.
2. Orchestrator → Primary Agent.
3. Primary Agent → Owner: "Project [name] reached its initial target. Proposed next phase: [summary]. Your direction?"
4. Owner's response becomes the next vision input.
5. The machine keeps going.

**Targets are starting points, not ending points.**

---

## Section 14 — System Self-Maintenance

### Daily (Automated)
- All open tickets reviewed for staleness.
- Agent health check (are TASK_STATEs consistent?).
- Deferred triggers processed for IDLE agents.
- Rate limit log reviewed.
- Git commit of any uncommitted changes.
- Midnight checkpoint created.

### Weekly
- PM sends project health report to Orchestrator.
- Orchestrator sends system health report to primary agent.
- Primary agent sends summary to owner (only what needs owner attention).
- QualityDirector reports quality trends.
- Skill MD review (any outdated skills to update?).

### Monthly
- Performance metrics review.
- Model selection review (new models to evaluate?).
- Security audit.
- Shared learnings aggregation.
- Document version updates.

### Quarterly
- Full system architecture review.
- Agent performance review.
- Model tier reassignment review.
- Forward vision review for all active projects.

---

## Section 15 — ONXZA Product Architecture

### Stack Position

```
LLMs (Claude, GPT, Ollama, etc.)
        ↓
OpenClaw (agent runtime)
        ↓
ONXZA (AI company operating system)   ← This layer
        ↓
Your companies (built on ONXZA)
        ↓
Eventually: any company in the world
```

### FAAILS Protocol Documents

FAAILS specs live in `projects/onxza/faails/`:
- `MOE-001.md` — MoE Precision Execution Architecture
- `FVP-001.md` — FAAILS Verification Protocol
- `ROUTING-001.md` — Self-Correcting Routing Protocol
- `MPI-001.md` — Model Performance Index
- `CDP-001.md` — Collaborative Definition Protocol

### Repo Isolation

```
Public (projects/onxza/):   ONXZA/FAAILS code, docs, CLI — no internal data ever
Private (workspace/):       All internal operations — never pushed publicly
```

---

## Document Change Log

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-03-17 | Initial creation |
| 2.0.0 | 2026-03-17 | Complete rewrite incorporating Session 2 systems: content tracking, credential management, rate limiting, browser automation, checkpoint/recovery, ticket dispatcher, App Store review system, ONXZA product system |

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

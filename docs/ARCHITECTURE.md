---
title: ONXZA System Architecture
version: 0.1.0
owner: DTP_ONXZA_Architect
created: 2026-03-17
status: DRAFT
tags: architecture, onxza, faails, system-design, developer-docs
summary: Comprehensive technical architecture of the ONXZA AI Company Operating System — stack position, core subsystems, agent model, FAAILS protocol relationship, and CLI design.
credit_line: present
---

# ONXZA System Architecture

**Version:** 0.1.0 | **Owner:** DTP_ONXZA_Architect | **Date:** 2026-03-17  
**Status:** DRAFT — living document, updated as system evolves

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## 1. What ONXZA Is

ONXZA is an open-source AI company operating system. It provides the governance layer, communication infrastructure, agent lifecycle management, knowledge architecture, and quality enforcement needed to run autonomous agent fleets at company scale.

ONXZA is not a chatbot framework. It is not a workflow automation tool. It is the operating system that sits between the raw capability of LLMs and the real-world outcomes companies need — coordinating agents, enforcing quality, preserving intent, and accumulating knowledge permanently.

**FAAILS** (Frameworks for Autonomous Artificial Intelligence Learning Systems) is the open protocol specification that ONXZA implements. ONXZA is the product. FAAILS is the standard. Anyone can build a FAAILS-compliant system. ONXZA is the reference implementation.

---

## 2. Stack Position

```
┌─────────────────────────────────────────────────────────────────────┐
│  LLMs — Raw intelligence                                            │
│  Claude (Anthropic) · GPT-4o (OpenAI) · Grok · Ollama (local)      │
└────────────────────────┬────────────────────────────────────────────┘
                         │  model API calls
┌────────────────────────▼────────────────────────────────────────────┐
│  OpenClaw — Agent runtime                                           │
│  Session management · channel routing · daemon persistence          │
│  skill loading · heartbeat scheduling · subagent spawning           │
└────────────────────────┬────────────────────────────────────────────┘
                         │  agent context, tools, skill MDs
┌────────────────────────▼────────────────────────────────────────────┐
│  ONXZA — AI Company Operating System          ◄── WE BUILD THIS     │
│  Governance · agent lifecycle · ticket system · vision lock         │
│  memory isolation · shared learnings · FAAILS protocol runtime      │
│  FVP quality gate · MoE routing · MPI benchmark · CLI              │
└────────────────────────┬────────────────────────────────────────────┘
                         │  company context, vision docs, agent fleets
┌────────────────────────▼────────────────────────────────────────────┐
│  Companies — Operational layer                                      │
│  DevGru US → Marcus Gear Inc. → WDC · MGA · DTP · future           │
│  Each company: own agents, own projects, own shared learnings       │
└────────────────────────┬────────────────────────────────────────────┘
                         │  real-world output
┌────────────────────────▼────────────────────────────────────────────┐
│  World — Outcomes                                                   │
│  Websites · code · content · revenue · products · communities       │
└─────────────────────────────────────────────────────────────────────┘
```

### Why This Stack Matters

OpenClaw provides agent runtime primitives — session management, heartbeats, channels, tool access. It does not know what a company is, what a vision document is, or what quality means. ONXZA fills that gap. Every governance decision, every quality check, every memory write, every routing decision is ONXZA's domain. OpenClaw is the engine. ONXZA is the vehicle.

---

## 3. Corporate Structure

```
Aaron Gear (Founder — sole human authority)
        │
DevGru US (C Corp — holding company)
        │
Marcus Gear Inc. (Operating parent — AI innovation brand)
    ├── World Destination Club (WDC)     travel affiliate + content
    ├── Marcus Gear Agency (MGA)          AI automation agency
    ├── DevGru Technology Products (DTP)  ONXZA product company
    └── [future companies activated by Aaron vision]
```

Each sub-company has its own agent fleet, workspace directories, projects, and shared learnings. Companies do not share private data. Patterns and skills can be promoted from company-level to global.

---

## 4. Core Subsystems

ONXZA has seven interconnected core subsystems. Each is defined by a FAAILS protocol section. Each is enforced by specific agents. They operate as a single system.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ONXZA CORE                                  │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐    │
│  │ Vision Lock  │   │ Ticket       │   │ Agent Lifecycle      │    │
│  │ (CDP-001 /   │   │ System       │   │ (creation · routing  │    │
│  │  FAAILS-003) │   │ (FAAILS-002) │   │  · persistence)      │    │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘    │
│         │                  │                      │                 │
│  ┌──────▼──────────────────▼──────────────────────▼───────────┐    │
│  │              Execution Engine                               │    │
│  │   MoE Routing (MOE-001) → FVP Quality Gate (FVP-001)       │    │
│  │   Self-Correcting Routing (ROUTING-001) → MPI (MPI-001)    │    │
│  └─────────────────────────────┬───────────────────────────────┘    │
│                                │                                    │
│  ┌─────────────────────────────▼───────────────────────────────┐    │
│  │              Knowledge Layer                                 │    │
│  │   Memory Isolation (FAAILS-004)                              │    │
│  │   Shared Learnings Architecture (FAAILS-005)                 │    │
│  │   Skill Lifecycle (FAAILS-006)                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Vision Lock Governance

Vision Lock is the highest-priority subsystem. Every other subsystem serves it.

### 5.1 What It Does

A vision document (`vision.md`) is the immutable north star for any project. Once approved by Aaron, no agent below Marcus can modify it. Every task executed by every agent must align with the vision. When alignment is uncertain, agents re-read the vision before acting.

### 5.2 Vision Document Lifecycle

```
Aaron gives input (any channel)
        │
        ▼
Marcus logs to memory + creates draft vision.md
Status: CDP-REVIEW
        │
        ▼
CDP Board Session convened (CDP-001)
Multiple agents independently analyze → synthesize → question set
Max 5 questions total to Aaron
        │
        ▼
Aaron answers
        │
        ▼
Vision refined → Aaron approval
        │
        ▼
vision.md written → Status: APPROVED — IMMUTABLE
Checkpoint created before any execution begins
        │
        ▼
Handed to Orchestrator for execution
```

### 5.3 Vision Document Structure

Required sections (enforced by TORI-QMD validator):
- `status` field: `CDP-REVIEW` or `APPROVED — IMMUTABLE`
- Credit line: present
- Aaron's original vision statement (verbatim)
- 30 / 90 / 180-day targets
- Non-negotiables
- Constraints
- Agent team
- Open questions (resolved or explicitly deferred)

### 5.4 Vision Update Protocol

Any agent that believes a vision change is needed must:
1. Create a `vision_update_request` ticket — do NOT modify the file
2. Ticket routes to Marcus
3. Marcus reviews against DOC-007 (Vision Lock Governance)
4. Marcus surfaces to Aaron with recommendation
5. Aaron decides. Only Aaron can approve a vision change.

---

## 6. Ticket System

The ticket system is ONXZA's inter-agent communication backbone. All work enters and exits through tickets. No agent assigns itself work outside the ticket system.

### 6.1 Ticket Lifecycle

```
tickets/open/         → ticket created, not yet picked up
tickets/in-progress/  → agent actively working
tickets/pending-approval/ → awaiting human or senior agent decision
tickets/blocked/      → dependency unmet, cannot proceed
tickets/closed/       → complete — immutable record
```

### 6.2 File Naming Convention

```
tickets/[status]/TICKET-[YYYYMMDD]-[NNN]-[slug].md
```

Example: `TICKET-20260317-003-dtp-faails-architecture.md`

### 6.3 Ticket Schema

Every ticket is a structured markdown file with YAML frontmatter:

```yaml
---
id: TICKET-[YYYYMMDD]-[NNN]
type: [task | approval_request | escalation | ...]
created_by: [agent-id]
created_at: [ISO 8601]
assigned_to: [agent-id]
project: [project-slug]
company: [MG | WDC | MGA | DTP]
priority: [low | medium | high | critical]
status: [open | in-progress | pending-approval | blocked | closed]
requires_aaron: [true | false]
parent_ticket: [ticket-id or null]
related_vision: [path to vision.md]
---
```

Body sections: Summary · Context · Requested Action · Vision Alignment · Dependencies · Acceptance Criteria · Notes and Updates · Completion Note

### 6.4 Ticket Types (Abbreviated)

| Type | Direction | Purpose |
|---|---|---|
| `task` | PM → Specialist | Standard work assignment |
| `approval_request` | PM → Marcus → Aaron | Requires human decision |
| `escalation` | Any → PM or above | Cannot resolve at current level |
| `fvp_escalation` | Verification → PM | Failed FVP after 3 loops |
| `vision_update_request` | Any → Marcus | Proposed vision change |
| `cdp_board_review` | Marcus → Board | Vision board session request |
| `agent_creation_request` | Any → AgentDeveloper | New agent needed |
| `model_performance_data` | Any → DTP_ONXZA_ModelIndex | MPI routing data |
| `credentials_needed` | Any → Marcus | Missing credentials blocking work |
| `policy_gap_request` | Any → PM → chain | Undocumented policy needed |
| `forward_proposal` | Any → PM | Proposed next phase after target |
| `security_flag` | Any → Security | Route immediately — no delay |

Full registry: DOC-003 Section 3.3

### 6.5 Dispatcher Architecture

A central dispatcher runs via OpenClaw cron every 5 minutes:

```
MG_Parent_Orchestrator scans tickets/open/
For each ticket: check assigned_to against active agents
Send TICKET_ASSIGNED notification to assigned agent
Agent checks TASK_STATE → execute if IDLE, defer if ACTIVE
```

Agent polling cadence:
- Marcus: continuous
- CEO Orchestrators: session start + every 15 min
- Department PMs: session start + every 30 min
- Specialists: session start + on task completion
- QualityDirector: session start + every 60 min

---

## 7. Agent Model

### 7.1 The Two-Layer Formula

Every agent in the system is built from the same formula. No exceptions.

```
Global Standard Template (MG_Parent_AgentDeveloper owns)
  + Company Vision Context
  + Company Tech Stack
  + Company Shared Learnings
  + Project-Specific Knowledge
= A fully initialized specialist agent
```

This ensures every agent across any ONXZA installation starts with the same quality baseline. Company context is layered on top, not substituted.

### 7.2 Agent Workspace Structure

Each agent has a dedicated workspace directory:

```
~/.openclaw/workspace-[company-dept-role-lowercase]/
├── AGENTS.md     ← Agent identity, protocols, skill domains, scope boundaries
├── SOUL.md       ← Personality, values, communication style
├── IDENTITY.md   ← Structured identity card (name, role, persistence class, model)
├── MEMORY.md     ← Long-term memory — loaded on every session start
├── TOOLS.md      ← Available tools, CLI access, credentials, external services
└── HEARTBEAT.md  ← Scheduled recurring tasks (empty if no cron tasks)
```

All 6 files must pass TORI-QMD validation before any agent goes live.

The main Marcus workspace is the system root:

```
~/.openclaw/workspace/
├── AGENTS.md, SOUL.md, IDENTITY.md, MEMORY.md, TOOLS.md, HEARTBEAT.md
├── docs/           DOC-001 through DOC-014 — foundational governance
├── tickets/        open/ in-progress/ pending-approval/ blocked/ closed/
├── projects/       one directory per project — vision.md + project files
├── memory/         daily logs + genesis + patterns + preferences
├── logs/           audit/ dashboard/ rate-limit-alerts
├── scripts/        validate-tori-qmd.py · create-checkpoint.py · log-audit-entry.py
└── shared-learnings/
    ├── global/     skills/ patterns/ tools/ — flows to all agents
    ├── WDC/        company-specific skills and patterns
    ├── MGA/
    └── DTP/
```

### 7.3 Agent Naming Convention

```
[Company]_[Department]_[Role]
```

Examples:
- `MG_Parent_Marcus` — Marcus Gear parent company, principal agent
- `WDC_Content_BlogWriter` — World Destination Club, content dept, blog writer
- `DTP_ONXZA_Architect` — DevGru Technology Products, ONXZA product, architect

Convention is enforced. Agents outside naming convention are considered non-standard and may not interoperate correctly with the dispatcher.

### 7.4 Persistence Classification

Set at creation time in `IDENTITY.md`. Never changed without explicit decision.

**PERSISTENT DAEMON**
- Lives for the project or company lifetime
- Registered permanently in `openclaw.json`
- Full 6-file workspace, heartbeat configured if needed
- Includes: all CEO agents, all department leads, all platform managers, all AgentDeveloper agents, all specialists on ongoing projects

**TEMPORARY SUB-AGENT**
- Spawned for a single task or time-bounded project
- NOT registered permanently in `openclaw.json`
- Before retirement: archive learnings to `shared-learnings/[company]/patterns/archived/[slug]-learnings.md`
- Retired cleanly after handoff confirmed

**CONVERSION RULE:** If a temporary project becomes ongoing, sub-agent converts to persistent daemon — full workspace created, registered in `openclaw.json`, Aaron notified.

### 7.5 Agent Lifecycle

```
AgentDeveloper receives agent_creation_request ticket
        │
        ▼
Phase 1 — Research
Scope, domain, model tier, persistence, failure modes, skill set
        │
        ▼
Phase 2 — Design Document
Written before any file is created
        │
        ▼
Phase 3 — Approval (if new paid tools required)
        │
        ▼
Phase 4 — Build
Create workspace → write 6 files → validate all with validate-tori-qmd.py
Register in openclaw.json → create checkpoint
        │
        ▼
Phase 5 — Validation
Test task → quality check → security review → readiness ticket to PM
        │
        ▼
Agent goes live → training mode for first 10 tasks
        │
        ▼
[ongoing] → memory updates → skill updates → MPI data → shared learnings
        │
        ▼
[if no longer needed] → archive learnings → retire cleanly
```

### 7.6 Task State Lock

Every agent tracks task state to prevent mid-task interruption from non-emergency triggers:

```
TASK_STATE: ACTIVE | IDLE
TASK_ID: [ticket-id]
TASK_CHECKPOINT: [progress description]
PREEMPTABLE: yes | no
```

`PREEMPTABLE = no` for: active file write sequences, multi-step platform interactions, builds/deploys, financial or API transactions, or any task where partial completion is worse than none.

Emergency interrupt (overrides `PREEMPTABLE = no`): Aaron message with `URGENT:` prefix, or SEV-1 security alert.

### 7.7 Perceive → Reason → Plan → Execute

Every agent runs this loop on every task. No exceptions.

- **Perceive:** Read the full ticket. Read the related vision.md. Read any referenced docs.
- **Reason:** Understand what was asked AND what was meant. Cross-reference constraints.
- **Plan:** Identify acceptance criteria. Identify dependencies. Identify risks.
- **Execute:** Produce output. Apply FVP. Submit with confidence score.

No agent executes before completing all four steps. An agent that skips Perceive and Reason and goes straight to Execute is considered non-compliant.

---

## 8. FAAILS Protocol and Its Relationship to ONXZA

### 8.1 The Distinction

| | FAAILS | ONXZA |
|---|---|---|
| Type | Open protocol specification | Software product |
| Role | Defines the standard | Implements the standard |
| Audience | Anyone building an AI agent system | Companies and developers installing ONXZA |
| Ownership | Open — community can contribute | DevGru Technology Products |
| License | Open specification | Open source (non-commercial free) |

ONXZA is the reference implementation — the best implementation — because we designed both simultaneously. DevGru companies run on ONXZA. The ONXZA codebase is the living proof that FAAILS works.

### 8.2 FAAILS Protocol Sections

| Section | Description | Status | Implemented By |
|---|---|---|---|
| CDP-001 | Collaborative Definition Protocol | v1.0 | `projects/onxza/faails/CDP-001.md` |
| MOE-001 | MoE Precision Execution Architecture | v1.0 | `projects/onxza/faails/MOE-001.md` |
| FVP-001 | Verification Protocol | v1.0 | `projects/onxza/faails/FVP-001.md` |
| ROUTING-001 | Self-Correcting Routing Protocol | v1.0 | `projects/onxza/faails/ROUTING-001.md` |
| MPI-001 | Model Performance Index | v1.0 | `projects/onxza/faails/MPI-001.md` |
| FAAILS-001 | Agent Identity & Naming Standard | Draft | See DOC-003 Section 4 |
| FAAILS-002 | Inter-Agent Communication Protocol | Draft | See DOC-003 Section 3 |
| FAAILS-003 | Vision Lock Governance | Draft | See DOC-007 |
| FAAILS-004 | Memory Isolation Model | Draft | See Section 9 below |
| FAAILS-005 | Shared Learnings Architecture | Draft | See Section 9 below |
| FAAILS-006 | Skill Lifecycle Standard | Draft | See DOC-005 |
| FAAILS-007 | Automation Tier Framework | Draft | See MOE-001 tiering |
| FAAILS-008 | Agent Creation Standard | Draft | See DOC-003 Section 4 |
| FAAILS-009 | Escalation & Approval Protocol | Draft | See DOC-002 Section 4 |
| FAAILS-010 | Knowledge Base Governance | Draft | See DOC-013 |

Gaps between existing numbered specs (MOE-001 through MPI-001) and the formal FAAILS-001 through FAAILS-010 numbering are documented in `FAAILS-GAPS.md`.

---

## 9. Memory and Knowledge Architecture

### 9.1 Memory Isolation Model (FAAILS-004)

Memory is classified at the file level. Every memory write must be classified before it is written.

| Classification | What It Contains | Who Can Read It | Storage Location |
|---|---|---|---|
| PRIVATE | Project-specific data, client info, credentials, proprietary content | Agent that owns it only | Agent's own workspace |
| SHARED | Patterns, corrections, tool notes, workflow improvements | All agents at company or global level | `shared-learnings/` |

PRIVATE memory never leaves the owning agent's workspace. No agent reads another agent's MEMORY.md except Marcus for oversight. No agent reads another company's shared learnings without explicit permission.

### 9.2 Shared Learnings Architecture (FAAILS-005)

Knowledge flows upward through four tiers:

```
Specialist agent learns something on a task
        │
        ▼
Writes to company shared-learnings/[Company]/patterns/ or skills/
        │
        ▼
Company PM reviews → promotes to global if cross-company valuable
        │
        ▼
MG_Parent_AgentDeveloper reviews global learnings
Updates global standard template if systemic
        │
        ▼
[Future] Anonymized patterns contribute to FAAILS community spec
```

Shared learning types:
- `pattern` — a reusable approach that worked
- `correction` — something that failed and how to fix it
- `tool_note` — observed behavior of an external tool or API
- `escalation_log` — what caused an escalation and how it was resolved
- `model_observation` — model performance note for MPI

### 9.3 Session Memory

Each agent writes a session log after every significant interaction:

```
memory/YYYY-MM-DD.md
```

Format per entry:
```markdown
## [Date] [Session ID]
### What happened
### Decision made
### Why
### What I learned
### What I'd do differently
```

MEMORY.md is the long-term condensed store — loaded at every session start. Daily logs are the raw record. Both are required.

### 9.4 Skill Lifecycle (FAAILS-006)

Skills are domain-specific knowledge documents that agents load as context. They are not code — they are instructions and reference material.

```
Skill identified as needed → skill_approval_request ticket
        │
        ▼
PM reviews → approved
        │
        ▼
AgentDeveloper authors skill MD
validate-tori-qmd.py MUST PASS before installation
        │
        ▼
Skill installed to shared-learnings/[scope]/skills/
        │
        ▼
Agent loads skill in TOOLS.md reference
        │
        ▼
Agent updates skill when new knowledge accumulated
        │
        ▼
[If broadly valuable] Promoted to global standard
[If externally valuable] Submitted to ONXZA skills marketplace
```

---

## 10. Execution Engine

### 10.1 Mixture of Experts (MOE-001)

ONXZA implements a Mixture of Experts architecture at the agent orchestration layer. The principle: no generalist agent handles everything. Every task routes to the specialist built for that exact domain.

Each expert agent has:
- Its own configured model (best fit for domain)
- Its own skill MDs (domain-specific knowledge)
- Its own scripts (domain-specific automation)
- Its own memory (domain-specific learning)
- Its own FVP verification criteria

Unlike internal MoE model architectures, ONXZA's MoE is fully observable — every routing decision, every expert invocation, every outcome is logged and auditable.

### 10.2 Automation Tier Framework

Every task is classified by tier before execution:

| Tier | Description | LLM Involvement | Goal |
|---|---|---|---|
| Tier 1 | Reasoning required | Any capable model (local LLM first) | Use cheapest that passes FVP |
| Tier 2 | Script + LLM hybrid | Script handles mechanics, LLM handles judgment | Minimize LLM calls to judgment only |
| Tier 3 | Pure script / cron | Zero LLM tokens | Maximum automation coverage |

The push-to-Tier-3 principle: every repeatable task that can be automated to a script must be, over time. Tier 1 today can become Tier 2 once patterns are established, and Tier 3 once fully automated. This is the primary cost-reduction mechanism in ONXZA.

**Cost principle:** Always use the least expensive model that produces correct output. Local LLMs (Ollama) are tried first for all tiers. Cloud models used only when local cannot meet the quality bar. Tier 1 does not imply cloud model.

### 10.3 FVP Verification Gate (FVP-001)

Every output from every agent passes through FVP before acceptance. FVP has a maximum of 3 loops before mandatory escalation.

```
Agent produces output + confidence score (0–100)
        │
        ├─ Score < 70 → Loop back (Loop 1)
        │
        ▼ Score ≥ 70
DTP_ONXZA_Verification: Humanization Check
(writing: natural, no AI tells) (code: clean, commented, conventional)
        │
        ├─ FAIL → Loop back (Loop 2)
        │
        ▼ PASS
Fact and Accuracy Check
(factually correct · aligned with vision.md · meets acceptance criteria)
        │
        ├─ FAIL → Loop back (Loop 3)
        │
        ▼ PASS
Output accepted → ticket updated → learning captured
        │
        ▼ [if Loop 3 fails]
fvp_escalation ticket → PM decides: retry / escalate / accept-with-flag
```

FVP is non-optional. An agent that ships output without running FVP is considered non-compliant. DTP_ONXZA_Verification is the dedicated agent for step 2 checks. Steps 1 and 3 are self-assessed by the producing agent.

### 10.4 Self-Correcting Routing (ROUTING-001)

The routing system learns from real task outcomes. No human maintains routing tables.

**Data logged per task:**
- Task type and classification
- Router model suggestion (DTP_ONXZA_Router's recommendation)
- Expert model actually used
- FVP result (pass / fail)
- Confidence score
- Loop count required
- Time to complete
- Approximate cost

**When router and expert disagree:** Expert executes with its own model anyway. Both outcomes are recorded. Data decides which was right over time. No overrides. No authority battles. Just evidence.

**Learning cycle:** DTP_ONXZA_ModelIndex aggregates routing data. Router suggestion accuracy improves. Expert default models are validated or adjusted based on statistical evidence. ONXZA-LLM is eventually trained on this data for local routing decisions.

### 10.5 Model Performance Index (MPI-001)

The MPI is the first real-world benchmark of AI model performance in autonomous agentic workflows with end-to-end verification.

**What it measures:**
- FVP first-attempt pass rate by model
- Average loop count by model and task type
- Time to completion by model
- Cost per successful completion by model
- Task types each model excels at
- Task types each model struggles with

**Why it matters:** Every other benchmark tests models on static tasks evaluated by humans. MPI tests models on real autonomous tasks evaluated by the FVP loop. This benchmark did not exist before ONXZA. As the dataset grows, it becomes a competitive moat and training dataset for ONXZA-LLM.

Maintained by: DTP_ONXZA_ModelIndex. Updated automatically after every task.

---

## 11. Safety and Irreversibility

### 11.1 Irreversibility Classification

Every action an agent takes is pre-classified:

**REVERSIBLE — execute without confirmation:**
- Creating new files
- Writing to memory
- Creating tickets
- Running research or analysis
- Generating content drafts
- Creating checkpoints

**IRREVERSIBLE — always confirm with Aaron first:**
- Deleting any file or directory
- Modifying any approved vision.md
- Modifying any agent's AGENTS.md
- Modifying openclaw.json
- Publishing anything externally
- Sending any external communication
- Installing any new skill or tool
- Making any API call to external service
- Spending or committing money
- Modifying any script in scripts/
- Bulk operations affecting 10+ files

### 11.2 Irreversible Action Protocol

Before any irreversible action (in order, no exceptions):

```
Step 1: python3 ~/.openclaw/workspace/scripts/create-checkpoint.py [action-slug]
Step 2: python3 ~/.openclaw/workspace/scripts/log-audit-entry.py \
          --agent [agent-id] \
          --action "[description]" \
          --outcome pending \
          --confirmed-by pending \
          --reversible no \
          --checkpoint-id [checkpoint-id]
Step 3: Present to Aaron:
          "You asked me to [exact action].
          This is irreversible.
          Specifically it will: [exact consequence].
          Checkpoint created: [checkpoint-id]
          Type CONFIRM to proceed or CANCEL."
Step 4: Wait for explicit CONFIRM or CANCEL. Nothing else proceeds.
Step 5: On CONFIRM — execute. Update audit: outcome=executed.
Step 6: On CANCEL — abort. Update audit: outcome=cancelled.
```

### 11.3 Checkpoint System

Checkpoints are taken:
- At every session start
- Before every irreversible action
- At phase boundaries in multi-phase work
- Before any agent creation or retirement

Checkpoint structure:
```
~/.openclaw/checkpoints/[YYYYMMDD-HHMMSS]-[slug]/
├── manifest.json
├── openclaw.json
├── agents-list.txt
├── vision-hashes.txt
└── README.md
```

### 11.4 Audit Trail

All irreversible actions are logged append-only to:
```
~/.openclaw/workspace/logs/audit/audit-trail.md
```

Format: agent ID, action, outcome, confirmed-by, checkpoint ID, timestamp. The audit trail is never modified — only appended. It is a permanent record.

### 11.5 TORI-QMD Validation

Every `.md` file produced by any agent must pass TORI-QMD validation before commit or delivery:

```bash
python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py <filepath>
# Returns: PASS: <filepath>
# Or:      FAIL: <filepath> — missing: <fields>
```

Validation rules by file type:
- `projects/onxza/**/*.md` — credit line required
- `AGENTS.md` — credit line required
- `vision.md` — status field + credit line required
- `memory/**/*.md` — memory_id, agent, created, tags, summary required
- `skills/**/*.md` — version, owner, created (or last_updated) + credit line required
- `patterns/**/*.md` — memory_id, agent, created, tags, summary required

A pre-commit hook runs this validator on all `.md` files before every git commit.

---

## 12. CLI Architecture

### 12.1 Design Principles

- Single binary: `onxza`
- Installable in under 2 minutes
- Zero cloud dependency for local-only operation
- Commands are discoverable (`onxza help`, `onxza [command] --help`)
- All commands produce machine-readable output when `--json` flag provided
- Idempotent: running the same command twice produces the same state

### 12.2 Installation

```bash
# One-line install
curl -fsSL https://get.onxza.com | bash

# npm
npm install -g onxza
```

### 12.3 Command Surface (v0.1 target)

```bash
# Installation and setup
onxza init                              # Initialize ONXZA in working directory
onxza start                             # Start the ONXZA daemon/runtime
onxza status                            # Show system status (agents, tickets, health)

# Company management
onxza company add [name]                # Add a new company under ONXZA
onxza company list                      # List all companies
onxza company switch [name]             # Set active company context

# Agent management
onxza agent create [Company_Dept_Role]  # Scaffold a new agent workspace
onxza agent list                        # List all agents with status
onxza agent validate [agent-id]         # Run TORI-QMD on all 6 agent files

# Skill management
onxza skill install [skill-name]        # Install from skills marketplace
onxza skill list                        # List installed skills with versions
onxza skill update [skill-name]         # Update to latest version
onxza skill publish [path]              # Submit skill to marketplace

# Script management
onxza script create [script-name]       # Scaffold a new automation script
onxza script list                       # List scripts with tier classification
onxza script run [script-name]          # Execute script in sandbox

# Observability
onxza logs                              # Tail system logs
onxza tickets [--status open]           # List tickets by status
onxza dashboard                         # Launch Mission Control (TUI or web)
```

### 12.4 `onxza init` Behavior

```
1. Check for existing ONXZA installation
2. Create workspace directory structure
3. Download global standard agent template
4. Create openclaw.json scaffold
5. Initialize git repository with pre-commit hook
6. Create first checkpoint
7. Print: "ONXZA initialized. Run 'onxza agent create' to add your first agent."
```

### 12.5 `onxza agent create` Behavior

```
1. Validate naming convention [Company_Dept_Role]
2. Check for existing agent with same name
3. Scaffold workspace-[company-dept-role-lowercase]/ with 6 template files
4. Prompt for: model, persistence classification, domain description
5. Run validate-tori-qmd.py on all 6 files
6. Register in openclaw.json
7. Create checkpoint
8. Print: "Agent [id] created. Run test task before first real assignment."
```

---

## 13. Mission Control

Mission Control is a core feature — not an add-on. Ships with every installation.

### 13.1 Architecture

Hierarchical dashboard showing all companies under one ONXZA installation:

- **Master Dashboard:** All companies, all agents, system health
- **Company Dashboard:** One company — all agents, all projects, all tickets, all metrics
- **Project Dashboard:** All agents assigned, task progress, blockers, FVP metrics

### 13.2 Components

| Component | What It Shows |
|---|---|
| Agent Status Board | All agents with live status, current task, model, last activity, FVP pass rate |
| Ticket Kanban | Visual queue — Open / In-Progress / Pending-Approval / Blocked / Closed |
| Vision Docs Viewer | Read-only immutable display of all vision documents with approval status |
| Shared Learnings Browser | Searchable across all companies, filterable by type |
| Skill Library Manager | Installed skills with versions, marketplace install, submit for publication |
| Script Library | Tier classification, run history, success rate |
| Model Usage and Cost Tracker | Usage by agent/company/day, router vs actual model, cost per task type |
| FVP Loop Tracker | Tasks by loop count, agents that loop frequently, trends over time |
| Real-Time Log Viewer | Live feed of all agent activity, filterable and searchable |

### 13.3 Remote Access

Session-based read-only access. Granted per session. Revocable instantly. No persistent remote credentials.

---

## 14. ONXZA-LLM

A custom model trained on real ONXZA operational data. Published to HuggingFace.

- **Training data:** Anonymized MPI routing decisions, FVP outcomes, shared learnings patterns
- **Purpose:** Local-first task classification, routing decisions, and agent assistance
- **Variants:** mini · standard · pro
- **Target:** v0.1 published within 180 days of ONXZA v1.0 public release
- **Distribution:** `onxza pull onxza-llm`

ONXZA-LLM closes the cloud dependency loop. Once trained, ONXZA installations can route, verify, and classify tasks entirely locally with no external API calls for the core orchestration layer.

---

## 15. Data Flows Summary

```
Aaron input
    → Marcus (any channel, unified)
    → CDP board session (if vision intake)
    → vision.md (locked)
    → Orchestrator → company CEO → dept PM → specialist agent
        → Ticket created
        → MoE Router suggests model
        → Expert executes (Perceive → Reason → Plan → Execute)
        → FVP verification (confidence → humanization → accuracy)
        → Pass: output accepted → ticket closed → learnings written
        → Fail: escalation ticket → PM decides
    → Shared learnings aggregated (company → global → FAAILS community)
    → Routing data logged → MPI updated → router improves
    → ONXZA-LLM trained (future)
```

---

## 16. File Structure Reference

```
~/.openclaw/
├── workspace/                        ← Marcus (main) workspace / system root
│   ├── AGENTS.md / SOUL.md / IDENTITY.md / MEMORY.md / TOOLS.md / HEARTBEAT.md
│   ├── docs/                         ← DOC-001 through DOC-014
│   ├── tickets/
│   │   ├── open/
│   │   ├── in-progress/
│   │   ├── pending-approval/
│   │   ├── blocked/
│   │   └── closed/
│   ├── projects/
│   │   └── [project-slug]/
│   │       ├── vision.md             ← IMMUTABLE after approval
│   │       └── [project files]
│   ├── memory/
│   │   ├── marcus-genesis.md
│   │   ├── YYYY-MM-DD.md             ← Daily session logs
│   │   └── MEMORY.md
│   ├── logs/
│   │   ├── audit/audit-trail.md      ← Append-only irreversible action log
│   │   └── rate-limit-alerts.log
│   ├── scripts/
│   │   ├── validate-tori-qmd.py
│   │   ├── create-checkpoint.py
│   │   └── log-audit-entry.py
│   └── shared-learnings/
│       ├── global/ skills/ patterns/ tools/
│       ├── WDC/
│       ├── MGA/
│       └── DTP/
│
├── workspace-[agent-id]/             ← One per persistent daemon agent
│   └── AGENTS.md SOUL.md IDENTITY.md MEMORY.md TOOLS.md HEARTBEAT.md
│
└── checkpoints/
    └── [YYYYMMDD-HHMMSS]-[slug]/
        ├── manifest.json
        ├── openclaw.json
        ├── agents-list.txt
        ├── vision-hashes.txt
        └── README.md
```

---

## 17. Design Decisions and Rationale

### Why OpenClaw (not custom runtime)?
OpenClaw provides battle-tested agent session management, channel routing, heartbeat scheduling, and tool integration. Building a competing runtime would duplicate effort and delay delivery. ONXZA extends OpenClaw — it does not replace it. This is consistent with the principle: build at the highest layer of abstraction that produces the needed outcome.

### Why markdown files instead of a database?
All governance documents, tickets, and memory files are plain markdown. This gives: human readability, git version control, zero infrastructure to run the governance layer, and portability to any future runtime. The content layer is database-agnostic. Supabase is used for structured company-operational data (content tracking, analytics) — not for the governance layer.

### Why open source?
Distribution is the moat. A proprietary AI operating system is a hard sell. An open-source one that companies run on their own infrastructure, that works visibly and well, that has a growing community of skills — that becomes the default. The cloud platform, commercial license, and premium skills are the revenue model. The open source release is the marketing.

### Why FAAILS as a separate specification?
Separating protocol from product protects the long-term value. If ONXZA were to become the only implementation, a single point of failure exists. By publishing FAAILS as an open standard, the protocol survives any product. It also creates a reason for the broader community to contribute to the standard even if they build competing products — which validates the protocol and benefits ONXZA.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

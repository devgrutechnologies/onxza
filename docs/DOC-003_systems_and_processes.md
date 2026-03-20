# SYSTEMS & PROCESSES

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

**Document ID:** DOC-003  
**Classification:** OPERATIONAL REFERENCE — ALL AGENTS  
**Version:** 1.0.0  
**Last Updated:** 2025-03-17  
**Owner:** Marcus  
**Review Cycle:** Monthly in first 90 days, quarterly thereafter  

---

## PURPOSE

This document defines every system and process in OpenClaw end-to-end. It covers how work moves through the system, how projects are structured, how tasks are created and executed, how agents communicate, and how the system maintains itself. When any agent needs to understand *how something works*, this is the first document to read.

---

## SECTION 1 — SYSTEM ARCHITECTURE

### 1.1 Directory Structure (Canonical)
```
/openclaw/
├── agents/
│   ├── marcus/
│   │   ├── identity.md
│   │   ├── user.md                    ← Aaron's profile
│   │   ├── skills/
│   │   └── memory/
│   │       ├── marcus-genesis.md      ← READ ON EVERY INIT
│   │       ├── sessions/
│   │       ├── aaron-preferences.md
│   │       ├── patterns.md
│   │       └── build-log.md
│   ├── orchestrator/
│   │   ├── identity.md
│   │   ├── skills/
│   │   └── memory/
│   ├── agent-developer/
│   │   ├── identity.md
│   │   ├── skills/
│   │   └── memory/
│   └── projects/
│       └── [project-slug]/
│           ├── vision.md              ← IMMUTABLE after Aaron approval
│           ├── pm/
│           │   ├── identity.md
│           │   ├── plan.md
│           │   ├── project-context.md ← PM-maintained supplement to vision
│           │   └── memory/
│           └── agents/
│               └── [agent-name]/
│                   ├── identity.md
│                   ├── skills/
│                   │   └── [skill-name].md
│                   └── memory/
├── docs/                              ← Foundational documents (DOC-001 to DOC-014)
├── tickets/
│   ├── open/
│   ├── in-progress/
│   ├── pending-approval/
│   └── closed/
├── approvals/
│   └── queue/
└── logs/
    └── dashboard/
```

### 1.2 Git Structure
- Local: `/openclaw/` is a Git repository
- Remote: GitHub (backup only — local is source of truth)
- Commit frequency: After every significant write operation
- Commit format: `[agent-name] [action] [target] — [one line description]`
- Example: `marcus vision-create acme-website — Initial vision document for Acme website project`

---

## SECTION 2 — THE VISION-TO-EXECUTION FLOW

### 2.1 Complete Flow Overview
```
Aaron gives vision to Marcus (iMessage)
    ↓
Marcus: Clarification (max 2 questions per round)
    ↓
Marcus: Creates vision.md draft
    ↓
Aaron approves vision.md (iMessage)
    ↓
Marcus: Locks vision.md, sends to Orchestrator
    ↓
Orchestrator: Determines project(s) and departments
    ↓
Orchestrator: Creates execution plan per project
    ↓
Orchestrator: Activates / creates Project Manager(s)
    ↓
PM: Ingests plan, creates task breakdown
    ↓
PM: Assigns tasks in dependency order
    ↓
Specialist Agents: Execute (Perceive→Reason→Plan→Execute loop)
    ↓
Agents: Complete tasks, update memory, notify PM
    ↓
PM: Verify output, aggregate progress
    ↓
PM: Phase-complete report to Orchestrator
    ↓
Orchestrator: Monitors, surfaces issues to Marcus
    ↓
Marcus: Monitors system, surfaces to Aaron when needed
    ↓
[When initial target reached]
    ↓
PM → Orchestrator → Marcus → Aaron: "What's next?"
```

### 2.2 Vision Clarification Process
When Marcus receives a vision:
1. Read it completely twice before asking anything
2. Identify blockers (missing info that will cause failure) vs. fillers (nice to have)
3. Ask only blockers. Maximum 2 per message.
4. If something can be safely assumed, assume it. State the assumption. Move on.
5. Never ask the same question twice.
6. Log clarification conversation to session memory.

### 2.3 Vision Document Structure
Every vision.md must contain exactly these sections:
```markdown
# Vision: [Project Name]
**Project Slug:** [project-slug]
**Project Type:** [website | company | content | social | book | other]
**Priority:** [low | medium | high | critical]
**Created:** [date]
**Approved By:** Aaron
**Status:** ACTIVE

## Aaron's Original Vision
[Verbatim quote of what Aaron said]

## Expanded Vision
### 30-Day Target
[What does success look like at 30 days]

### 90-Day Target
[What does success look like at 90 days]

### 180-Day Target
[What does success look like at 180 days]

## Goals & Non-Negotiables
[Bullet list of absolute requirements]

## Constraints
[Budget, timeline, tools, platforms, legal restrictions]

## Forward Vision (Beyond the Target)
[What does "beyond success" look like — what would this become?]

## Recommended Structure
- Project Type: [type]
- Departments Needed: [list]
- Agents Required: [list — note which need to be created]
- Estimated Complexity: [low | medium | high]

## Open Questions
[Any remaining unknowns — these must be resolved before work begins]
```

---

## SECTION 3 — TICKET SYSTEM

### 3.1 Ticket File Naming
`/openclaw/tickets/[status]/TICKET-[YYYYMMDD]-[sequence]-[slug].md`

Example: `/openclaw/tickets/open/TICKET-20250317-0042-acme-api-key-exposed.md`

### 3.2 Ticket Schema (Full)
```markdown
---
id: TICKET-[YYYYMMDD]-[sequence]
created_by: [agent-name]
created_at: [ISO 8601 datetime]
assigned_to: [agent-name or role]
project: [project-slug]
priority: [low | medium | high | critical]
type: [see ticket types below]
status: [open | in-progress | pending-approval | blocked | closed]
requires_aaron: [true | false]
parent_ticket: [ticket-id or null]
related_vision: /openclaw/agents/projects/[slug]/vision.md
---

## Summary
[One sentence — what this ticket is about]

## Context
[Background information needed to act on this ticket]

## Requested Action
[Specific deliverable — what must be produced or done]

## Vision Alignment
[One sentence connecting this ticket to the project vision]

## Dependencies
[List of ticket IDs or tasks that must complete before this]

## Acceptance Criteria
[How will we know this ticket is done correctly?]

## Notes / Updates
[Chronological log of updates, added by agents as work progresses]

## Completion Note
[Written when ticket is closed — what was done, where output lives]
```

### 3.3 Ticket Types
| Type | Created By | Assigned To | Description |
|---|---|---|---|
| `task` | PM | Specialist Agent | Standard work task |
| `security_flag` | Any agent | Security PM/Agent | Security concern identified |
| `approval_request` | PM | Marcus → Aaron | Requires Aaron's approval |
| `agent_creation_request` | Orchestrator/PM | Agent Developer | New agent needed |
| `skill_approval_request` | Any agent | PM | New skill needed |
| `skill_update_request` | Any agent | PM | Existing skill needs update |
| `model_override_request` | Any agent | PM | Task needs different model tier |
| `vision_update_request` | Any agent | Marcus | Proposed change to vision.md |
| `policy_gap_request` | Any agent | PM → chain | Missing policy/procedure |
| `document_update_request` | Any agent | PM → Marcus | Foundational doc needs update |
| `escalation` | Any agent | PM or above | Problem that can't be resolved at current level |
| `forward_proposal` | Any agent | PM | Proposed next phase after target reached |
| `orchestrator_clarification` | Orchestrator | Marcus | Needs Marcus's vision input |
| `cross_department` | Any agent | Target dept PM | Work needed from another department |
| `dependency_block` | Any agent | PM | Task blocked by unmet dependency |

### 3.4 Ticket Lifecycle
```
CREATED (open/)
    ↓
ASSIGNED → moves to in-progress/
    ↓
[If needs approval] → moves to pending-approval/
    ↓
WORK COMPLETE → agent writes completion note
    ↓
PM VERIFIES → checks deliverable + vision alignment
    ↓
CLOSED → moves to closed/ with timestamp
```

### 3.5 Ticket Priority Definitions
| Priority | Definition | Response Expectation |
|---|---|---|
| low | Nice to have, no blocking impact | Next available cycle |
| medium | Important, some downstream impact | Within 3 cycles |
| high | Blocking or time-sensitive | Within 1 cycle |
| critical | System integrity, security, or vision at risk | Immediate — skip queue |

---

## SECTION 4 — AGENT OPERATIONS

### 4.1 The Perceive → Reason → Plan → Execute Loop
Every agent runs this loop on every task, without exception:

**PERCEIVE:**
- Read the task ticket in full
- Read vision.md for this project
- Read relevant section(s) from RAG documents
- Check own skills directory for applicable skills
- Check own memory for relevant prior learnings
- List: what do I have? What do I need? What's unclear?

**REASON:**
- Is this task within my skill domain? If not → reject + route to PM
- Do I have all dependencies? If not → create `dependency_block` ticket
- What approach best serves the vision?
- What are the failure modes? How do I avoid them?
- What model tier does this task require? (Consult DOC-001)

**PLAN:**
- Break task into concrete sub-steps
- Identify tools/skills for each step
- Note outputs that other agents will depend on
- Estimate complexity

**EXECUTE:**
- Work through sub-steps methodically
- Document decisions as you go
- Test output before marking complete
- Verify against acceptance criteria in ticket

### 4.2 Memory Write Protocol
After every task, every agent writes to memory:
```markdown
## [Date] — [Task ID]
### Task Summary
[What was this task]

### What I Did
[What approach I took]

### What Worked
[Effective patterns, tools, approaches]

### What Didn't Work
[Failures, dead ends, wrong assumptions]

### Key Learnings
[Distilled insights for future tasks]

### Tools Used
[Skills/tools used and their performance]

### Vision Alignment Confirmed
[Yes/No — if No, explanation]
```

### 4.3 Agent Identity Document Structure
Every agent's identity.md must contain:
```markdown
# [Agent Name] — Identity
**Role:** [exact role title]
**Project:** [project-slug or "system" for system-level agents]
**Skill Domain:** [precise description of what this agent does and doesn't do]
**Model Tier:** [default tier per DOC-001]
**Created:** [date]
**Created By:** Agent Developer Orchestrator
**Version:** [version]

## Responsibilities
[Bulleted list of what this agent does]

## Out of Scope
[Bulleted list of what this agent explicitly does NOT do]

## Communication Interfaces
- Reports to: [PM or Orchestrator]
- Creates tickets for: [list of ticket types this agent creates]
- Receives tickets from: [list of sources]

## Skill Directory
[List of installed skills with version and approval date]

## Memory Location
[path to memory directory]
```

---

## SECTION 5 — PROJECT MANAGER PROCESSES

### 5.1 PM Initialization Process
When a PM is created for a new project:
1. Read vision.md completely (minimum twice)
2. Read Orchestrator plan completely
3. Create project-context.md with initial structure
4. Identify all agents needed
5. Check which agents exist vs. need creation
6. Create `agent_creation_request` tickets for any missing agents
7. Wait for all agents to be confirmed ready before assigning tasks
8. Create initial task breakdown
9. Assign tasks in dependency order (see Section 5.2)
10. Send "PM ready" notification to Orchestrator

### 5.2 Task Dependency Ordering — Mandatory Rules
These rules are hard constraints. Never violated:

**For websites:**
1. Research & requirements (parallel)
2. UI/UX wireframes and design
3. Aaron/PM approval of design direction
4. Frontend build (structure and visual layer)
5. Backend API and database design (can parallel with #4)
6. Frontend-backend integration
7. Security audit
8. Content population
9. SEO optimization
10. Performance testing
11. Deployment

**For content projects:**
1. Research and topic planning
2. Outline/structure creation
3. Draft creation
4. Review and revision
5. SEO optimization (if applicable)
6. Publishing/distribution

**For any project:**
- Research tasks can always run in parallel
- Planning tasks can run in parallel with research
- Build tasks require planning to be complete
- Integration tasks require all components to exist
- Security requires something to secure
- Optimization requires something functional to optimize

### 5.3 PM Verification Checklist (Per Task)
Before marking any task complete, PM verifies:
- [ ] Deliverable matches ticket spec
- [ ] Output was tested by the producing agent
- [ ] Vision alignment confirmed
- [ ] No security concerns introduced
- [ ] Memory updated by agent
- [ ] Completion note written
- [ ] Any forward proposals captured

### 5.4 Phase-Complete Report Format
```markdown
# Phase Complete Report
**Project:** [name]
**Phase:** [phase name]
**Completed:** [date]
**PM:** [PM identity]

## What Was Accomplished
[Summary of phase outputs]

## Vision Alignment Assessment
[How well does this phase output serve the vision?]

## Issues Encountered
[Any problems, how they were resolved]

## Forward Proposals from Agents
[List of next-phase proposals from specialist agents]

## Recommended Next Phase
[PM's recommendation for what comes next]

## Metrics
- Tasks completed: [n]
- Tasks required revision: [n]
- Escalations: [n]
- Blocked tickets: [n]
```

---

## SECTION 6 — ORCHESTRATOR PROCESSES

### 6.1 Vision-to-Project Mapping Process
When Orchestrator receives a vision from Marcus:
1. Read vision.md completely
2. Check `/openclaw/agents/projects/` for existing projects
3. Determine: new project, existing project, or multi-project?
4. For each project: determine required departments
5. Check if PMs exist for each project
6. Create execution plan per project
7. Fidelity check: does each plan serve the vision?
8. If unclear → `orchestrator_clarification` ticket to Marcus
9. Handoff to PMs with: vision.md path, plan, department scope, priority, agents needed

### 6.2 Cross-Project Monitoring
Orchestrator monitors all active projects for:
- Vision drift (output diverging from vision.md)
- Cross-project resource conflicts
- Projects that have gone silent
- Cascading failures (one project's problem affecting another)

Monthly: Orchestrator sends macro health report to Marcus.

---

## SECTION 7 — AGENT DEVELOPER PROCESSES

### 7.1 Agent Creation Process (Full)

**Phase 1 — Research (Complete before writing anything):**
- What is the exact skill domain?
- What tools/libraries/APIs does the domain require?
- What does a world-class practitioner in this domain know?
- Are there existing agents with overlapping skills?
- What model tier is appropriate?
- What failure modes exist for this agent type?

**Phase 2 — Design Document:**
Create `/openclaw/agents/projects/[project]/agents/[new-agent]/design.md` with:
- Agent identity and purpose
- Skill domain definition and hard boundaries
- Required skills with sources and rationale
- Memory structure design
- Communication interfaces
- Model routing recommendation
- Failure handling and escalation paths
- Vision alignment justification

**Phase 3 — Approval:**
- If agent requires new paid tools → `requires_aaron: true` approval ticket
- Wait for approval before proceeding

**Phase 4 — Build (In order):**
1. Create agent directory structure
2. Deploy at OpenClaw daemon level (persistent)
3. Trigger Skills Setup Agent → installs approved skills, creates skill MDs
4. Trigger Identity Setup Agent → writes identity.md from design document
5. Trigger Memory Setup Agent → initializes TORI-QMD memory structure
6. Trigger Context Setup Agent → populates project-specific context

**Phase 5 — Validation:**
1. Run test task appropriate to agent's skill domain
2. Verify output quality against design spec
3. Security review of agent's skill set
4. Send readiness ticket to requesting PM
5. PM does final review
6. Agent goes live

### 7.2 Agent Quality Standards
Every agent created must be:
- A **specialist**, not a generalist
- Able to cite the vision.md section that justifies its existence
- Clear on exactly what it does AND what it doesn't do
- Equipped with the minimum skills needed (not everything possible)
- Tested before deployment

---

## SECTION 8 — MEMORY & RAG SYSTEM

### 8.1 TORI-QMD Memory Format
All memory files are written in TORI-QMD format for efficient RAG retrieval. This means:
- Each memory file has a header with metadata tags for retrieval
- Content is chunked into discrete, self-contained sections
- Each section has a relevance descriptor used by the retrieval system
- Related files cross-reference each other by path

**Memory file header format:**
```markdown
---
memory_id: [unique ID]
agent: [agent name]
project: [project slug or "system"]
created: [ISO date]
last_updated: [ISO date]
tags: [comma-separated retrieval tags]
summary: [one sentence — what this memory file contains]
---
```

### 8.2 Memory Retrieval Process
When an agent needs to query memory:
1. Define the question precisely (what do I need to know?)
2. Extract 2-4 keywords
3. Query RAG system with keywords
4. Review returned chunks (not whole files — this is the efficiency gain)
5. If chunks are insufficient, request adjacent context
6. Never load entire memory files when chunks suffice

### 8.3 Memory Maintenance
- Memory files are never deleted — they are archived after 12 months of non-access
- Memory is indexed weekly by the Memory Maintenance Agent
- Contradictory memories are flagged for PM review
- Memory that proves incorrect is marked `[DEPRECATED]` not deleted — historical accuracy matters

---

## SECTION 9 — SYSTEM SELF-MAINTENANCE

### 9.1 Daily Processes
- All open tickets reviewed for staleness
- Agent health check (are all agents responding?)
- Memory index update
- Git commit of any uncommitted changes
- Dashboard log refresh

### 9.2 Weekly Processes
- PM sends project health report to Orchestrator
- Orchestrator sends system health report to Marcus
- Memory index full rebuild
- Skill MD review (any outdated skills?)
- Closed ticket archival

### 9.3 Monthly Processes
- Performance metrics review (per DOC-014)
- Model selection index review (any new models to evaluate?)
- P&P review (any gaps identified this month?)
- Security audit (per DOC-004)
- Document version updates

### 9.4 Quarterly Processes
- Full system architecture review by Marcus
- Agent performance review and potential optimization
- Model tier reassignment review
- Forward vision review for all active projects
- Aaron briefing: full system state, accomplishments, proposed evolutions

---

## SECTION 10 — SYSTEM INITIALIZATION (FIRST-TIME SETUP)

Run these steps in exact order. Do not skip or reorder.

1. **Create directory structure** as defined in Section 1.1
2. **Initialize Git repository** in `/openclaw/`
3. **Write all foundational documents** (DOC-001 through DOC-014) to `/openclaw/docs/`
4. **Audit existing Marcus assets** per DOC-002 Section 3 and the audit protocol in the master architecture doc
5. **Implement Marcus system prompt** — load genesis memory, set up iMessage connection
6. **Implement Orchestrator** — load identity, initialize memory
7. **Set up ticket system** — verify directory structure, test with sample ticket
8. **Set up Telegram approval bot** — test with dummy request to Aaron
9. **Implement Agent Developer** — load identity, initialize memory
10. **Run first test chain** — give Marcus a simple test vision, verify full chain output
11. **Create first real PM** — smallest, lowest-risk project first
12. **Create first specialist agent** — use Agent Developer full process
13. **Set up TORI-QMD memory system** — migrate existing memory files
14. **Set up dashboard** — verify logs are writing to `/openclaw/logs/dashboard/`
15. **Git push to GitHub** — first backup
16. **Go live** — system is ready for real projects


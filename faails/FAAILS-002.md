# FAAILS-002: Inter-Agent Communication Protocol

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

The ticket system is the backbone of inter-agent communication in a FAAILS system. This specification defines the ticket schema, lifecycle, types, and dispatcher architecture that enable asynchronous, auditable, routable work assignment across agent fleets.

---

## 1. The Ticket System

Every piece of work enters and exits the system through tickets. No agent assigns itself work. No work happens outside a ticket.

**Core principle:** The ticket system is the contract between agents. It ensures:
- Visibility of all work
- Auditability of decisions
- Clear responsibility assignment
- Resolvable escalation paths
- Permanent record of what was asked and what was delivered

---

## 2. Ticket Lifecycle and Directories

All tickets exist in one of five status directories:

```
~/.openclaw/workspace/tickets/
├── open/              Ticket created, not yet assigned to active agent
├── in-progress/       Agent actively working on ticket
├── pending-approval/  Awaiting human or senior agent decision
├── blocked/           Cannot proceed — dependency unmet
└── closed/            Complete — immutable record
```

**Lifecycle flow:**

```
created → open → in-progress → [pass/accepted] → closed
                             ↓
                       pending-approval [decision made] → in-progress / closed
                       
                       [blocked by dependency] → blocked → open [unblocked]
```

**Directory transitions:**
- Agent transitions own ticket to `in-progress/` when starting work
- Agent transitions to `pending-approval/` if approval needed
- Agent transitions to `blocked/` if unmet dependency
- PM or supervisor transitions to `closed/` on completion
- Any agent can move ticket to `blocked/` if dependency discovered
- Orchestrator moves `open/` tickets to assigned agent for notification

---

## 3. Ticket File Naming

```
tickets/[status]/TICKET-[YYYYMMDD]-[NNN]-[slug].md
```

**Components:**
- `[YYYYMMDD]` — creation date (ISO format, no hyphens)
- `[NNN]` — sequential number (001, 002, etc. per day)
- `[slug]` — human-readable kebab-case identifier (20 chars max)

**Examples:**
```
TICKET-20260318-001-onxza-faails-specs-publish.md
TICKET-20260318-002-dtp-blog-content-calendar.md
TICKET-20260317-042-fix-routing-model-suggestion.md
```

**Slug rules:**
- Lowercase + hyphens only
- Reflect the essence of the ticket in 20 characters
- Unique within the same day (not enforced, but preferred)

---

## 4. Ticket Schema (YAML Frontmatter)

Every ticket file begins with structured YAML frontmatter:

```yaml
---
id: TICKET-20260318-001
type: task
created_by: [agent-id]
created_at: 2026-03-18T14:32:00-07:00
assigned_to: [agent-id]
project: [project-slug]
company: [company-code]
priority: [low | medium | high | critical]
status: [open | in-progress | pending-approval | blocked | closed]
requires_aaron: [true | false]
parent_ticket: [TICKET-id or null]
related_vision: [path/to/vision.md or null]
---
```

**Field definitions:**

| Field | Type | Required | Values | Notes |
|---|---|---|---|---|
| id | string | Yes | TICKET-YYYYMMDD-NNN | Unique identifier, matches filename |
| type | string | Yes | See section 5 | Ticket category/type |
| created_by | string | Yes | [agent-id] | Creator agent (who filed the ticket) |
| created_at | ISO 8601 | Yes | YYYY-MM-DDTHH:MM:SS±HH:MM | UTC or explicit timezone |
| assigned_to | string | Yes | [agent-id] | Current responsible agent |
| project | string | Yes | [slug] | Project context (for grouping) |
| company | string | Yes | [code] | MG, WDC, MGA, DTP, MGP, etc. |
| priority | string | Yes | low, medium, high, critical | Urgency and importance |
| status | string | Yes | open, in-progress, pending-approval, blocked, closed | Current lifecycle state |
| requires_aaron | boolean | Yes | true or false | Needs final human approval |
| parent_ticket | string | Optional | TICKET-id or null | Links to parent if subtask |
| related_vision | string | Optional | path or null | Links to vision.md if applicable |

---

## 5. Ticket Types

Each ticket type has a defined direction (who creates, who receives) and purpose.

| Type | Direction | Created By | Assigned To | Purpose |
|---|---|---|---|---|
| `task` | PM → Specialist | PM or Lead | Specialist agent | Standard work assignment |
| `approval_request` | Any → PM/Marcus → Aaron | Any agent | PM or Marcus | Requires approval before proceeding |
| `escalation` | Lower → Higher | Any agent | PM or above | Cannot resolve at current level |
| `fvp_escalation` | Verification → PM | FVP agent | PM | FVP failed after 3 loops |
| `vision_update_request` | Any → Marcus | Any agent | Marcus | Proposed vision document change |
| `cdp_board_review` | Marcus → Board | Marcus | CEO Board agents | Vision intake board session |
| `agent_creation_request` | Any → AgentDeveloper | Any agent | AgentDeveloper | Request to create new agent |
| `model_performance_data` | Router → ModelIndex | Router | ModelIndex agent | MPI routing outcome data |
| `credentials_needed` | Any → Marcus | Any agent | Marcus | Missing creds blocking work |
| `policy_gap_request` | Any → PM → chain | Any agent | PM | Undocumented policy needed |
| `skill_approval_request` | Any → PM → AgentDeveloper | Any agent | PM first | Request new skill or modify existing |
| `forward_proposal` | PM → CEO | PM | CEO | Proposed next phase after target |
| `security_flag` | Any → Security | Any agent | Security agent | Route immediately — no delay |
| `docs_page` | Any → Docs agent | PM or Docs | Docs agent | Request documentation page |
| `docs_update_request` | Any → Docs agent | Any agent | Docs agent | Request docs change or refresh |
| `api_reference` | Backend → Docs agent | Backend PM | Docs agent | Auto-generated API spec to publish |
| `feature_description` | Any → Docs agent | Any agent | Docs agent | New feature needs documentation |

---

## 6. Ticket Body Structure

After the YAML frontmatter, tickets follow this markdown structure:

```markdown
## Summary
One sentence describing what is needed.

## Context
Background. Why is this needed. What depends on it.

## Requested Action
Explicit list of what is being asked. Be specific.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Vision Alignment
How this supports the project vision (if applicable).

## Dependencies
Any blockers or prerequisites.

## Notes and Updates
[Agent adds updates here as work progresses]

## Completion Note
[Filled by completing agent before closing]
```

**Minimally required sections:** Summary, Requested Action, Acceptance Criteria

---

## 7. Priority Levels

Priority determines dispatcher scheduling and escalation paths.

| Priority | Response SLA | Execution SLA | Usage |
|---|---|---|---|
| `critical` | 5 minutes | 30 minutes | SEV-1 security, Aaron message, system down |
| `high` | 30 minutes | 4 hours | Blocking multiple agents, revenue impact, policy gaps |
| `medium` | 2 hours | 1 business day | Normal task assignment, improvements |
| `low` | 8 hours | 3 business days | Nice-to-haves, future enhancements, documentation |

**SLA = Service Level Agreement**
- Response SLA: Time to first agent acknowledgment
- Execution SLA: Time to substantial progress or escalation decision

---

## 8. Dispatcher Architecture

A central dispatcher runs on a scheduled heartbeat (every 5 minutes in default ONXZA):

**Dispatcher responsibilities:**
1. Scan `tickets/open/` for newly created tickets
2. Verify each ticket has valid frontmatter (TORI-QMD-like check)
3. For each open ticket: emit TICKET_ASSIGNED event to `assigned_to` agent
4. Log dispatcher run to audit trail
5. Escalate any tickets exceeding response SLA to PM

**Dispatcher runs as:** MG_Parent_Orchestrator (global) or company-level COO (company-scoped)

**Agent task state checking:**
```
Dispatcher broadcasts: "TICKET_ASSIGNED — TICKET-20260318-001"
Agent checks TASK_STATE
  if TASK_STATE = IDLE → begin work immediately
  if TASK_STATE = ACTIVE → defer, add to agent's task queue
Agent must acknowledge within response SLA
```

---

## 9. Agent Polling Cadence

How often agents check for new tickets:

| Agent Type | Check Frequency | Trigger Conditions |
|---|---|---|
| Marcus (principal) | Continuous | Always ready |
| CEO agents (company) | Session start + every 15 min | Polling schedule |
| Department PMs | Session start + every 30 min | Polling schedule |
| Specialists | Session start + on task completion | Event-driven |
| Temporary sub-agents | Continuous (session-scoped) | Only during task |
| Security agent | Session start + every 5 min | Security flags jump queue |

---

## 10. Cross-Company Ticketing

Agents in one company can create tickets for agents in another company through the Orchestrator.

**Rules:**
1. Cross-company tickets route through MG_Parent_Orchestrator
2. Orchestrator verifies both agents exist and accept cross-company work
3. Ticket is created in the requested company's workspace
4. Response SLA is +2 hours (extra routing time)
5. If cross-company dependencies become frequent, suggest structural change

**Example:** DTP_ONXZA_Docs needs help from WDC_Content_BlogWriter. Instead of direct messaging:
1. Create ticket: `created_by: dtp-onxza-docs`, `assigned_to: wdc-content-blog`, `company: WDC`
2. Submit to tickets/open/
3. Orchestrator routes it to WDC's dispatcher
4. WDC_Content_BlogWriter receives and acknowledges

---

## 11. Escalation and Re-Assignment

### Re-Assignment

If an assigned agent cannot complete a ticket:
1. Move ticket to `pending-approval/`
2. Update `assigned_to` field to requestor's PM
3. Add note: "Cannot complete because [reason]. Requesting PM review."
4. PM can re-assign to another agent or escalate

### Escalation

If a ticket requires authority above the assigned agent:
1. Create an `escalation` type ticket
2. Reference the original ticket in `parent_ticket` field
3. Assign to the appropriate escalation level (PM → CEO → Marcus → Aaron)
4. Original ticket stays in `pending-approval/` until escalation resolves

### Aaron Escalation

If a ticket requires Aaron's decision:
1. Set `requires_aaron: true`
2. Move to `pending-approval/`
3. Marcus or COO reviews and surfaces to Aaron with recommendation
4. Aaron responds → ticket assigned back to originating agent with decision

---

## 12. Ticket Search and Filtering

A FAAILS-compliant system provides tooling to search and filter tickets:

**Minimum required filters:**
- By status (open, in-progress, pending-approval, blocked, closed)
- By assigned_to (specific agent)
- By type (task, escalation, etc.)
- By priority (high, critical)
- By company (WDC, MGA, DTP)
- By project
- By created_by
- Date range (created_at between X and Y)

**Expected output formats:**
- Human-readable summary (list with ticket ID, summary, assigned to, priority)
- Machine-readable JSON (full frontmatter + summary only)
- Markdown table (status-quo view)

---

## 13. Ticket Closure and Archival

When a ticket is completed:

1. **Completing agent** updates the ticket:
   - Adds "## Completion Note" section with summary of work and outcomes
   - Updates status to `closed` in YAML frontmatter
   - Moves file to `tickets/closed/`

2. **PM confirms closure:**
   - Verifies acceptance criteria are met
   - Reviews completion note
   - Signs off (updates frontmatter if needed)

3. **Archival:**
   - Closed tickets are never deleted — only archived to read-only status
   - Closed tickets directory remains searchable
   - Patterns extracted from closed tickets feed shared learnings

---

## 14. Example: Complete Ticket

**File:** `tickets/open/TICKET-20260318-015-onxza-faails-specs-publish.md`

```markdown
---
id: TICKET-20260318-015
type: task
created_by: dtp-ceo
created_at: 2026-03-18T18:08:00-07:00
assigned_to: dtp-onxza-docs
project: onxza
company: DTP
priority: high
status: open
requires_aaron: false
parent_ticket: null
related_vision: projects/onxza/docs/ARCHITECTURE.md
---

## Summary
Complete and publish all 10 FAAILS protocol specifications — close the gaps between existing specs and the formal FAAILS-001 through FAAILS-010 numbering.

## Context
Per ARCHITECTURE.md §8.2, FAAILS has 10 protocol sections. CDP-001, MOE-001, FVP-001, ROUTING-001, MPI-001 are done. FAAILS-001 through FAAILS-010 (formal numbering) have gaps documented in FAAILS-GAPS.md. These must be authored and published as FAAILS.md specs alongside the product.

## Requested Action
- Read FAAILS-GAPS.md to identify all missing specs
- Author complete specifications for: FAAILS-001 through FAAILS-010
- Run TORI-QMD on all new spec files
- Ensure cross-references between specs are accurate

## Acceptance Criteria
- [ ] All 10 FAAILS specs authored and pass TORI-QMD
- [ ] Cross-references between specs are accurate
- [ ] Published in `projects/onxza/faails/` directory
- [ ] Index updated in FAAILS-GAPS.md (gap = zero)
- [ ] Published to GitHub alongside ONXZA repo

## Vision Alignment
FAAILS as open protocol is a strategic moat. Community can contribute. Validates ONXZA.

## Dependencies
None blocking.

## Notes and Updates
**2026-03-18 18:36:** Assigned to DTP_ONXZA_Docs. Beginning work.

## Completion Note
[To be filled on completion]
```

---

## 15. Compliance Checklist

Before a ticket is accepted:

- [ ] File naming follows TICKET-YYYYMMDD-NNN-slug.md
- [ ] All required YAML fields present
- [ ] Status field matches directory location
- [ ] assigned_to field is a valid agent ID
- [ ] priority is one of: low, medium, high, critical
- [ ] Acceptance criteria are objective and testable
- [ ] At least one of: Summary, Requested Action, Acceptance Criteria is present
- [ ] If requires_aaron=true, ticket is in pending-approval or escalation type
- [ ] If cross-company, routed through Orchestrator

---

*This specification is part of FAAILS. Maintained by DTP_ONXZA_Docs.*  
*Specification version: 1.0 — 2026-03-18*

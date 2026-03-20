# FAAILS-010: Knowledge Base Governance

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

A FAAILS system's knowledge base includes governance documents, shared learnings, vision documents, and agent workspaces. This specification defines how knowledge is classified, stored, accessed, versioned, and promoted through the system.

---

## 1. Knowledge Classification

All knowledge in a FAAILS system is classified at creation time:

| Classification | Scope | Access | Mutability | Storage |
|---|---|---|---|---|
| PRIVATE | Single agent | Agent + system admin only | Mutable | Agent workspace |
| COMPANY | One company | All agents in company | Mutable | Company shared-learnings |
| GLOBAL | All companies | All agents | Mutable | shared-learnings/global |
| ARCHIVED | Historical | Read-only | Immutable | [category]/archived/ |
| IMMUTABLE | Critical (vision) | Per-role (read) | Locked after approval | projects/[slug]/ |
| PUBLIC | External | Anyone | Read-only | Website or GitHub |

---

## 2. Knowledge Directories

```
~/.openclaw/workspace/
├── docs/               (Governance documents)
│   ├── DOC-001 through DOC-014
│   └── README.md
│
├── tickets/            (Work assignments and decisions)
│   ├── open/
│   ├── in-progress/
│   ├── pending-approval/
│   ├── blocked/
│   └── closed/
│
├── projects/           (Project-specific knowledge)
│   └── [project-slug]/
│       ├── vision.md  (IMMUTABLE after approval)
│       ├── [project files]
│       └── [architecture docs]
│
├── memory/             (Session and learning logs)
│   ├── YYYY-MM-DD.md  (daily session logs)
│   ├── marcus-genesis.md  (founding context)
│   └── patterns.md  (archived learnings)
│
├── logs/               (Audit trail)
│   ├── audit/audit-trail.md  (irreversible actions, append-only)
│   └── [other logs]
│
├── shared-learnings/   (Knowledge base)
│   ├── global/
│   │   ├── skills/
│   │   ├── patterns/
│   │   ├── tool-notes/
│   │   ├── escalation-logs/
│   │   └── model-observations/
│   │
│   ├── [Company]/
│   │   ├── skills/
│   │   ├── patterns/
│   │   ├── tool-notes/
│   │   ├── escalation-logs/
│   │   └── model-observations/
│
└── [agent workspaces]
    └── workspace-[agent-id]/
        ├── AGENTS.md / SOUL.md / IDENTITY.md
        ├── MEMORY.md / TOOLS.md / HEARTBEAT.md
        └── memory/  (if agent maintains subdirectory memory)
```

---

## 3. Governance Documents (DOC-NNN)

The `docs/` directory contains foundational governance:

| Doc | Owner | Scope | Status |
|---|---|---|---|
| DOC-001 | MG_Parent_AgentDeveloper | Model Selection Index | v1.0 |
| DOC-002 | MG_Parent_Orchestrator | Escalation and Approval | v1.0 |
| DOC-003 | MG_Parent_AgentDeveloper | Agent Governance and Lifecycle | v1.0 |
| DOC-004 | MG_Parent_AgentDeveloper | Ticket System Architecture | v1.0 |
| DOC-005 | MG_Parent_AgentDeveloper | Skill Lifecycle Standard | v1.0 |
| DOC-006 | MG_Parent_AgentDeveloper | Shared Learnings Promotion | v1.0 |
| DOC-007 | MG_Parent_Orchestrator | Vision Lock Governance | v1.0 |
| DOC-008 | MG_Parent_AgentDeveloper | Memory Architecture | v1.0 |
| DOC-009 | MG_Parent_Security | Security and Audit | v1.0 |
| DOC-010 | MG_Parent_AgentDeveloper | Team Collaboration Model | v1.0 |
| DOC-011 | MG_Parent_AgentDeveloper | Cost Tracking and Optimization | v1.0 |
| DOC-012 | MG_Parent_AgentDeveloper | Model Performance Measurement | v1.0 |
| DOC-013 | MG_Parent_AgentDeveloper | Knowledge Base and Search | v1.0 |
| DOC-014 | MG_Parent_AgentDeveloper | Community Contribution Standards | v1.0 |

These are the internal governance documents. FAAILS protocol specs (FAAILS-001 through FAAILS-010) are the public-facing standards derived from these.

---

## 4. Tickets as Knowledge Records

Every ticket is a permanent record. Closed tickets are never deleted — only archived.

### 4.1 Ticket as Decision Record

A ticket captures:
- What was asked
- Who was asked to do it
- What was delivered
- Why (context and vision alignment)
- How it was decided (if escalated)

### 4.2 Searching Closed Tickets

Agents can search closed tickets to find:
- "Has anyone done this before?"
- "What did we decide about X?"
- "How did we handle this escalation?"
- "What failed and what was learned?"

### 4.3 Learning Extraction

Before closing a ticket, the completing agent reflects:
- What did we learn?
- Should this become a shared learning?
- Did we discover a pattern worth documenting?

---

## 5. Project Knowledge (vision.md and Project Files)

### 5.1 Vision Documents (IMMUTABLE)

Vision documents are the critical knowledge that drives all work:

```
projects/[slug]/vision.md (IMMUTABLE after approval)
```

**Access:**
- Readable by agents assigned to the project
- Readable by stakeholders (transparent)
- Modifiable only through vision_update_request process

**Versioning:**
- Version increments only when formally approved by Aaron
- All versions are kept (history is immutable)
- Changes append to the document (never overwrite history)

### 5.2 Project Files

Project-specific documentation, specifications, and artifacts:

```
projects/[slug]/
├── vision.md  (IMMUTABLE)
├── README.md  (project overview)
├── architecture.md  (technical design)
├── FAAILS specs (project's contribution to protocol)
├── code/  (if code is part of project)
└── [other project-specific files]
```

These files are mutable and can be updated as the project evolves.

---

## 6. Shared Learnings Promotion Path

Knowledge flows through tiers of promotion:

```
Specialist completes task
        │
        ▼
Writes to shared-learnings/[Company]/patterns/ or skills/
Agent-specific learning (pre-shared)
        │
        ▼
Company PM reviews
Is this company-valuable? Generalizable? Well-documented?
        │
        ├─ No: stays private or company-level
        │
        └─ Yes: promote to global
        │
        ▼
Global shared-learnings/[category]/
Available to all companies
        │
        ▼
[Future] Community Contribution
Anonymized + formatted for FAAILS public spec
        │
        ▼
FAAILS repository
Available to anyone building FAAILS-compliant system
```

### 6.1 Promotion Triggers

A shared learning moves up when:

1. **Company → Global:**
   - Used by 2+ agents in different departments
   - Or used by 2+ companies
   - Or fills a gap in global standards
   - Or teaches a fundamental principle

2. **Global → FAAILS Community:**
   - Represents best practice across the industry
   - Anonymized (no company/client names)
   - Vetted for accuracy and completeness
   - Contributes to the open specification

---

## 7. Version Control and Git

### 7.1 Version Control Strategy

All knowledge except PRIVATE memory is version controlled:

```
~/.openclaw/workspace/  (Git repository)
  ├── docs/  (governance)
  ├── tickets/  (archived)
  ├── projects/  (visions and project files)
  ├── shared-learnings/  (knowledge base)
  └── [agent workspaces]
```

### 7.2 Pre-Commit Hooks

Before every commit:

```bash
# Run TORI-QMD on all modified .md files
python3 scripts/validate-tori-qmd.py [files]

# Check for credential exposure
grep -r "password\|api_key\|secret" [files] → FAIL if found

# Verify no irreversible changes without checkpoint
```

### 7.3 Commit Messages

Commits follow a standard format:

```
[type]: [scope] — [description]

Examples:
faails: 001 — add agent naming standard
shared-learnings: pattern — batch processing for large datasets
project: onxza — update vision with Q2 targets
docs: 003 — clarify agent creation phase 5
ticket: TICKET-20260318-001 — document completion
```

---

## 8. Search and Discoverability

### 8.1 What Must Be Searchable

- Tickets (all fields + body text)
- Shared learnings (metadata + content)
- Agent workspaces (AGENTS.md, SOUL.md, MEMORY.md)
- Vision documents (vision statement + all sections)
- Governance docs (all text)

### 8.2 Search Parameters

Agents should be able to search by:
- **Full text:** keyword in content
- **Type:** skill, pattern, correction, doc, ticket, vision
- **Creator/Owner:** agent-id, company
- **Date:** created/updated date range
- **Tag:** shared learning tags
- **Status:** open tickets only, closed tickets only, all
- **Project:** project-slug

### 8.3 Example Queries

```
"Find all patterns about async code"
→ Search: type=pattern AND tag=async AND tag=code

"Show all vision documents for WDC"
→ Search: type=vision AND company=WDC AND status=approved

"What did we learn about stripe integration?"
→ Search: type=tool_note AND tag=stripe

"Show FVP escalations from March"
→ Search: type=fvp_escalation AND created>=2026-03-01 AND created<2026-04-01
```

---

## 9. Knowledge Retention and Archival

### 9.1 What Gets Archived

- Closed tickets → `tickets/closed/` (permanent record, read-only)
- Deprecated shared learnings → `[category]/archived/`
- Retired agents → workspace archived for historical reference
- Superseded skills/patterns → marked [DEPRECATED] but kept

### 9.2 What Gets Deleted

Nearly nothing. Knowledge is kept unless:
- Sensitive information (credentials, personal data) — sanitized
- Duplicate files — consolidated
- Test/experiment files — may be removed if no learning value

### 9.3 Archive Access

Archived knowledge is:
- Searchable (for historical context)
- Read-only (cannot modify)
- Labeled as archived (clear status)
- Linked from replacement (if superseded)

---

## 10. TORI-QMD Validation for Knowledge Base

All files in the knowledge base must pass TORI-QMD:

**Required per file type:**

| File Type | Required Fields | Credit Line | Status |
|---|---|---|---|
| Governance doc (DOC-NNN) | title, owner, version, summary | required | v1.0 |
| Skill | skill_id, agent, version, tags, summary | required | v1.x |
| Pattern | memory_id, agent, tags, summary | required | v1.0 |
| Correction | memory_id, agent, tags, summary | required | v1.0 |
| Tool note | memory_id, tool, tags, summary | required | v1.0 |
| Escalation log | memory_id, agent, tags, summary | required | v1.0 |
| Model observation | memory_id, model, tags, summary | required | v1.0 |
| Vision | title, status, version, credit_line | required | approved |
| Ticket | id, type, created_by, assigned_to, project | not required | open/closed |
| Agent file | [per spec FAAILS-001] | required | active |

---

## 11. Knowledge Metrics

Track knowledge base health:

| Metric | Target | Frequency |
|---|---|---|
| Total shared learnings | Grow 10% per month | Monthly |
| Global learnings ratio | 30% of total | Monthly |
| Archived vs active | 10% archived (old) | Monthly |
| Search success rate | 90%+ get relevant results | Quarterly |
| Knowledge freshness | 90% updated within 6 months | Quarterly |
| TORI-QMD pass rate | 100% of new files | On commit |
| Ticket closure rate | 100% documented | Weekly |

---

## 12. Access Control and Privacy

### 12.1 Public Knowledge

- FAAILS protocol specs (public GitHub)
- Published skills (marketplace)
- Company README and overview (website)
- ONXZA documentation (website)

### 12.2 Global Knowledge

- All agents can read global shared learnings
- All companies' agents can access
- Anonymized (no company/client details)

### 12.3 Company Knowledge

- All agents in the company can read
- Agents outside company cannot read
- Company-specific details included

### 12.4 Private Knowledge

- Only owner agent and system admin (Marcus) can read
- Never promoted
- Never shared
- Archived on agent retirement

---

## 13. Knowledge Quality Standards

### 13.1 Accuracy

All shared knowledge must be accurate:
- Factually correct
- Tested or verified
- Sourced if external reference
- Errors corrected when discovered

### 13.2 Clarity

Knowledge must be understandable:
- Clear language (no jargon without definition)
- Examples provided
- Structure is logical
- Searchable keywords

### 13.3 Completeness

Knowledge is complete:
- All required sections present
- Edge cases documented
- Common pitfalls covered
- References to related knowledge

### 13.4 Maintenance

Knowledge is kept current:
- Reviewed every 6 months
- Updated if tools/approaches change
- Deprecated if superseded
- Linked to replacements

---

## 14. Governance and Oversight

### 14.1 Knowledge Review Roles

| Role | Responsibility |
|---|---|
| PM | Reviews company-level learnings before promotion |
| AgentDeveloper | Reviews learnings for global promotion |
| Security agent | Reviews for credential/sensitive data |
| Domain expert | Reviews for accuracy (specialty area) |
| Architect | Reviews technical design docs |

### 14.2 Review Checklist

Before a shared learning goes live:

- [ ] Passes TORI-QMD validation
- [ ] Accurate and verified (by domain expert if applicable)
- [ ] Clear and understandable
- [ ] No sensitive data exposed
- [ ] Properly tagged and discoverable
- [ ] PM has approved
- [ ] Indexed in search if global

---

## 15. Example: Knowledge Lifecycle

```
Date: 2026-03-18
Event: DTP_ONXZA_Backend completes a task

Agent discovers: "We should batch API calls to reduce latency"
Writes to: shared-learnings/DTP/patterns/batch-api-calls.md
Status: COMPANY-LEVEL

Date: 2026-03-25
PM reviews the pattern
Assessment: "This is valuable — multiple teams use APIs"
Promotes to: shared-learnings/global/patterns/batch-api-calls.md
Status: GLOBAL

Date: 2026-04-15
MG_Parent_AgentDeveloper reviews
Assessment: "This is a fundamental performance pattern"
Updates: Global agent template to include this pattern
Updates: MOE-001.md to reference this pattern

Date: 2026-06-01
Community contribution team
Prepares anonymized version for FAAILS repository
Submits: contributions/patterns/batch-api-calls.md

Date: 2026-06-15
FAAILS community reviews
Pattern is merged to: https://github.com/faails/faails/patterns/batch-api-calls.md
Credited to: DevGru Technology Products & original author

Status: Public knowledge. Anyone implementing FAAILS can use this pattern.
```

---

## 16. Compliance Checklist

For all knowledge in the system:

- [ ] Classified (PRIVATE | COMPANY | GLOBAL | ARCHIVED | IMMUTABLE | PUBLIC)
- [ ] Stored in correct directory
- [ ] Passes TORI-QMD validation
- [ ] Has clear creator/owner
- [ ] Has creation date
- [ ] Accurate and verified
- [ ] Discoverable via search
- [ ] Access control set correctly
- [ ] If archived: marked and linked to replacement
- [ ] If promoted: appropriate approval obtained
- [ ] No sensitive data exposed

---

*This specification is part of FAAILS. Maintained by DTP_ONXZA_Docs.*  
*Specification version: 1.0 — 2026-03-18*

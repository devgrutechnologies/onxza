# FAAILS-004: Memory Isolation Model

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

Memory in a FAAILS system is classified at the file level and segregated by access rules. This specification defines memory classification, isolation enforcement, privacy boundaries, and the audit mechanisms that protect sensitive information while enabling knowledge flow.

---

## 1. Memory Classification Principle

Every piece of memory written by an agent is classified before writing:

```
Is this memory PRIVATE or SHARED?
```

**PRIVATE memory** stays in the owning agent's workspace. Period.

**SHARED memory** flows to shared learnings directories and can be read by other agents at company or global scope.

This is not a post-hoc decision. Classification happens at write time. An agent must explicitly classify memory as SHARED before putting it in shared-learnings/.

---

## 2. PRIVATE Memory

### 2.1 Definition and Scope

PRIVATE memory is project-specific data, credentials, client information, or proprietary content that belongs to a single agent and should not leave that agent's workspace.

**Examples:**
- Agent's personal MEMORY.md (loaded only for that agent)
- Credentials or API keys used by the agent
- Client lists, financial data, or proprietary business information
- Detailed internal project notes that are not generalizable
- Work-in-progress files not yet ready for review
- Historical logs of tasks with sensitive context

### 2.2 Storage Location

```
~/.openclaw/workspace-[agent-id]/MEMORY.md
~/.openclaw/workspace-[agent-id]/memory/  (if agent has subdirectory memory)
~/.openclaw/workspace/memory/[agent-id]/[date].md  (if logged centrally)
```

### 2.3 Access Rules

**Who can read PRIVATE memory:**
- The owning agent itself (always)
- Marcus, for oversight purposes only
- No other agent has read access

**Enforcement:** OpenClaw permission system. Workspace directories are user+group locked. Only the agent and system administrators (Marcus) can read.

### 2.4 Lifecycle

PRIVATE memory is never promoted. It lives and dies with the agent.

If an agent is retired:
1. Learnings are extracted (if any are generalizable)
2. Generalizable learnings are promoted to shared-learnings
3. Original private memory is archived or deleted per agent specification

---

## 3. SHARED Memory

### 3.1 Definition and Scope

SHARED memory is knowledge that will be useful to other agents at the company or global level. It is intentionally promoted and made available.

**Examples:**
- Patterns discovered that work well for a class of problems
- Corrections ("tried X, failed; here's why")
- Tool behavior observations ("Slack API rate limits are actually...") 
- Workflow improvements that save time
- Skills (instructional documents)
- Model performance observations
- Escalation learnings ("when to escalate to X")

### 3.2 Storage Location

```
shared-learnings/
├── global/
│   ├── skills/
│   ├── patterns/
│   ├── tool-notes/
│   └── escalation-logs/
├── [Company]/
│   ├── skills/
│   ├── patterns/
│   ├── tool-notes/
│   └── model-observations/
```

### 3.3 Shared Learning Types

Every shared learning file has a type. Type determines structure and lifecycle.

| Type | Location | Purpose | Audience |
|---|---|---|---|
| `pattern` | patterns/ | Reusable approach that worked | Company + promotable to global |
| `correction` | patterns/ | Something failed; here's why and fix | Company + promotable to global |
| `tool_note` | tool-notes/ | Observed behavior of external tool/API | Company + promotable to global |
| `escalation_log` | escalation-logs/ | What caused escalation, how resolved | Company + promotable to global |
| `model_observation` | model-observations/ | Model performance notes for MPI | MPI aggregate (anonymized) |
| `skill` | skills/ | Domain-specific knowledge document | Company + promotable to global |

### 3.4 Shared Learning File Format

Every shared learning file must include:

```yaml
---
type: [pattern | correction | tool_note | escalation_log | model_observation | skill]
memory_id: [unique slug]
agent: [Agent_ID_who_created]
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
tags: [tag1, tag2, tag3]
summary: [one-sentence summary]
promotable: [true | false]
credit_line: present
---

## Content

[1 to 3 paragraphs describing the learning]

### How It Applies
[When and why this learning is useful]

### Key Insight
[The core takeaway]
```

**Required fields:**
- type, memory_id, agent, created, tags, summary, credit_line

**memory_id format:** kebab-case, 15 chars max, unique within directory  
Example: `claude-opus-token-limit`

### 3.5 Access Rules

**Company-level shared learnings** (`shared-learnings/[Company]/`):
- Readable by all agents in that company
- Created by agents in that company
- Managed by company PM or AgentDeveloper

**Global shared learnings** (`shared-learnings/global/`):
- Readable by all agents in all companies
- Only promoted from company learnings (never created directly at global)
- Managed by MG_Parent_AgentDeveloper

### 3.6 Promotion Path

```
Specialist agent learns something
        │
        ▼
Writes to shared-learnings/[Company]/patterns/ or skills/
        │
        ▼
Company PM or lead reviews: "Is this broadly valuable?"
        │
        ├─ No: stays company-level
        │
        └─ Yes: promotes to global
        │
        ▼
MG_Parent_AgentDeveloper reviews
        │
        ├─ Updates global standard template if systemic
        │
        └─ [Future] Contributes to FAAILS community spec
```

---

## 4. Session Memory and Daily Logs

### 4.1 Session Memory (MEMORY.md)

Agents maintain a `MEMORY.md` file in their workspace root. This is loaded at every session start.

**Contents:**
- Session start checklist (what to read first)
- Current projects and priorities
- Key relationships and stakeholder info
- Known patterns specific to this agent's work
- Recent decisions and why they were made
- Open questions or blockers
- Progress on ongoing initiatives

**Format:**
```markdown
# MEMORY.md — [Agent Name]

## Session Start Checklist
1. Read [vision.md]
2. Check [ticket directory]
3. Review shared-learnings/[Company]/

## Current Priorities
- [Project 1] — [status]
- [Project 2] — [status]

## Recent Learnings
[Key insights from last few sessions]

## Open Questions
- [Question 1]
- [Question 2]
```

### 4.2 Daily Session Logs

After every significant interaction, agents write a session log:

```
memory/YYYY-MM-DD.md
```

**Entry format:**

```markdown
## [Date] [Session ID]
### What Happened
[Summary of what happened]

### Decision Made
[Explicit decision or direction chosen]

### Why
[Reasoning behind the decision]

### What I Learned
[Key insight from this session]

### What I'd Do Differently
[Reflection on improvement opportunities]
```

**Purpose:**
- Historical record of how decisions were made
- Learning extraction
- Audit trail for accountability
- Pattern detection over time

### 4.3 Memory Retention

- MEMORY.md is loaded every session (current state only)
- Daily logs are retained indefinitely (archive)
- Monthly summaries can be extracted from daily logs
- Daily logs are PRIVATE to the agent (not automatically shared)

---

## 5. Memory Isolation Enforcement

### 5.1 Technical Enforcement

Memory isolation is enforced via:

1. **Filesystem permissions:** Agent workspace directories owned by agent + system admin
2. **OpenClaw session context:** Agents spawned with company context can only read their company's shared learnings
3. **Ticket system:** Cross-company communication goes through tickets, not private memory
4. **Audit logging:** Any access to memory is logged (who, what, when)

### 5.2 Access Verification

Before an agent reads memory from another agent or company:

1. Agent's session context is checked
2. Memory file's classification (PRIVATE vs SHARED) is checked
3. If PRIVATE and accessing agent is not the owner: READ DENIED
4. If SHARED and within access scope: READ ALLOWED

**Violation:** If an agent attempts unauthorized memory access:
- Request is denied
- Incident is logged to audit trail
- Marcus is notified immediately
- Security investigation initiated

### 5.3 Cross-Company Isolation

Agents in Company A cannot read:
- PRIVATE memory of Company B agents
- Company-level shared learnings of Company B (unless explicitly shared)

Agents in Company A CAN read:
- Global shared learnings
- Company A's shared learnings
- Files in public directories (if any)

---

## 6. Shared Learnings Promotion Workflow

### 6.1 Creating a Shared Learning

Agent completes a task and realizes: "Other agents should know about this."

1. Agent writes to `shared-learnings/[Company]/patterns/[memory-id].md`
2. File includes all required frontmatter
3. File includes type, tags, and promotable flag
4. Agent submits `skill_approval_request` or `pattern_contribution` ticket

### 6.2 Company Review

Company PM or AgentDeveloper reviews:
- Is this generalizable?
- Are tags correct?
- Is the learning clear?

If yes: approved, file stays in place  
If no: returned for revision or rejected

### 6.3 Global Promotion

If a learning is tagged `promotable: true` and is valuable across companies:

1. MG_Parent_AgentDeveloper is notified
2. AgentDeveloper reviews for global value
3. If valuable: copies to `shared-learnings/global/`
4. Original company learning links to global version
5. If very systemic: updates global agent template

### 6.4 Community Contribution

If a learning should be contributed to the FAAILS open specification:

1. AgentDeveloper extracts and anonymizes
2. Submits to FAAILS protocol repository as pattern or correction
3. Credited back to originating agent and company
4. Published in FAAILS community learnings directory

---

## 7. Model Observation Data (for MPI)

Model performance observations are a special class of shared learning.

### 7.1 Logging Performance Data

When an agent observes interesting model behavior:

```yaml
---
type: model_observation
memory_id: gpt4o-structured-output-behavior
agent: DTP_ONXZA_Backend
created: 2026-03-18
tags: [gpt-4o, structured-output, latency]
summary: "GPT-4o structured output mode adds 300-500ms latency but is worth it"
---

## Observation

During [task type], when using GPT-4o with structured output mode:
- Token count increased by 25%
- Latency increased by 400ms average
- First-attempt accuracy increased from 87% to 94%

## Conclusion

For structured output tasks, the latency hit is worth the accuracy gain.
```

### 7.2 MPI Aggregation

Model observations flow to DTP_ONXZA_ModelIndex via `model_performance_data` tickets.

Observations are:
- Anonymized (agent and company removed if cross-company)
- Aggregated statistically
- Used to refine routing decisions
- Eventually used to train ONXZA-LLM

---

## 8. Privacy and Anonymization

### 8.1 Anonymization for Shared Learnings

When a shared learning might expose:
- Client names or details
- Proprietary business information
- Personal information

**Anonymization rules:**
- Replace specific names with [CLIENT], [COMPANY], etc.
- Replace specific numbers with percentages or ranges
- Extract the pattern, not the details

**Example before:**
```
"When Acme Corp needed to process 50,000 customer records, 
the batch size of 100 caused memory exhaustion..."
```

**Example after:**
```
"When [CLIENT] needed to process large customer record batches,
the batch size of 100 caused memory exhaustion..."
```

### 8.2 PRIVATE Memory Never Shared

PRIVATE memory is never included in shared learnings. If a learning requires sensitive details, keep it PRIVATE.

---

## 9. Memory Lifetime and Cleanup

### 9.1 PRIVATE Memory Lifetime

Tied to the agent. When an agent is retired:
1. Valuable learnings are extracted and promoted to shared
2. Personal/proprietary content is archived or deleted
3. Credentials are revoked
4. Workspace is archived for historical reference

### 9.2 Shared Learning Lifetime

Shared learnings are permanent. They may become:
- Archived (marked deprecated or superseded)
- Updated (version field incremented)
- Promoted to global or FAAILS community
- But never deleted

---

## 10. Compliance Checklist

For PRIVATE memory:
- [ ] Located in agent's workspace, not in shared-learnings
- [ ] Not accidentally committed to shared git repos
- [ ] Credentials not exposed in logs

For SHARED memory:
- [ ] Type field is set (pattern, correction, tool_note, etc.)
- [ ] memory_id is unique and kebab-case
- [ ] Tags are meaningful (3-5 tags)
- [ ] Promotable flag set correctly
- [ ] Passes TORI-QMD validation
- [ ] No private data included
- [ ] Summarized in one sentence
- [ ] Contribution ticket filed

---

*This specification is part of FAAILS. Maintained by DTP_ONXZA_Docs.*  
*Specification version: 1.0 — 2026-03-18*

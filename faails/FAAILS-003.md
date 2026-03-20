# FAAILS-003: Vision Lock Governance

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

Vision Lock is the governance mechanism that protects intent from drift. Once a vision document is approved, no agent below the principal can modify it. This specification defines vision document structure, lifecycle, update protocols, and enforcement mechanisms.

---

## 1. Vision as North Star

A vision document is the single source of truth for a project or company. Every task executed by every agent must align with the vision. When alignment is uncertain, agents re-read the vision before acting.

**Core principle:** Vision is immutable once approved. This ensures:
- Intent is preserved across a thousand agent decisions
- No agent can creep beyond scope without explicit approval
- Trade-offs are made once and honored throughout execution
- History of vision is preserved (changes go through formal process)

---

## 2. Vision Document Lifecycle

### 2.1 Status States

A vision document is always in exactly one of these states:

```
CDP-REVIEW → APPROVED — IMMUTABLE
```

**CDP-REVIEW**
- Vision has been submitted for collaborative definition (board session)
- Board is synthesizing and clarifying
- Agent below Marcus can read but NOT modify
- File location: `projects/[slug]/vision.md` (status field shows CDP-REVIEW)

**APPROVED — IMMUTABLE**
- Board session complete
- Human has approved
- Vision is locked
- No agent below Marcus can modify it
- Checkpoint created before execution begins
- Handed to Orchestrator for execution

### 2.2 Complete Vision Lifecycle

```
Human submits input (any channel)
        │
        ▼
Marcus logs to memory + creates draft vision.md
Status: CDP-REVIEW
        │
        ▼
CDP Board Session convened (see CDP-001)
Multiple agents analyze → synthesize → question set
Max 5 questions to human
        │
        ▼
Human answers questions
Board processes → refines understanding
        │
        ▼
Vision.md refined
Status: APPROVED — IMMUTABLE (if resolved)
Checkpoint created
        │
        ▼
Vision handed to Orchestrator
Execution begins
        │
        ▼
[Throughout execution] Agents read vision before every decision
No modification to vision.md
        │
        ▼
[If change needed] Create vision_update_request ticket
[Never: do not modify vision.md directly]
```

---

## 3. Vision Document Structure

Every vision.md file must have these sections:

### 3.1 Frontmatter (YAML)

```yaml
---
title: [Project Name] Vision
version: 1.0
owner: [Agent ID who created/owns it]
created: YYYY-MM-DD
status: [CDP-REVIEW | APPROVED — IMMUTABLE]
credit_line: present
---
```

**Required fields:**
- `title` — project or company name with "Vision" label
- `status` — one of the two states above
- `credit_line` — always "present" (enforced by TORI-QMD)
- `created` — ISO date of initial vision statement

### 3.2 Core Sections (Minimum)

**1. Vision Statement (verbatim from human)**
```markdown
## Original Vision Statement

[Exact quote from the human, word-for-word]

**Date submitted:** [Date]  
**Submitted by:** [Human name or context]
```

**2. Interpreted Intent**
```markdown
## Interpreted Intent

What the CDP board understood the human to mean. This section explains the board's interpretation of what the human meant, not just what they said.

- Core objective: [single sentence]
- Success looks like: [description]
- Implicit assumptions: [list]
```

**3. Board Clarifications**
```markdown
## Board Clarifications

If a CDP board session was run, document the questions asked and answers received.

### Question 1
**Asked by:** [Agent]  
**Answer:** [Human's response]  

[Continue for each question]
```

**4. Targets**
```markdown
## Success Targets

### 30 Days
- [concrete deliverable]
- [concrete metric]

### 90 Days
- [concrete deliverable]

### 180 Days
- [concrete deliverable]
```

**5. Non-Negotiables**
```markdown
## Non-Negotiables

Things that must be true for the vision to be considered successful:

- [Non-negotiable constraint]
- [Requirement that cannot be dropped]
```

**6. Constraints**
```markdown
## Known Constraints

Budget, timeline, personnel, technical, regulatory:

- [Constraint and why it exists]
- [Limitation on approach]
```

**7. Scope and Scale**
```markdown
## Scope

What is included:
- [In scope]

What is NOT included:
- [Out of scope]

### Scale
[How many users, how much data, how many agents, etc.]
```

**8. Agent Team**
```markdown
## Agent Team

Agents assigned to execute this vision:

- [Company_Dept_Role] — [responsibility]
```

**9. Open Questions**
```markdown
## Open Questions

Questions that remain unresolved or are deferred for later:

- [Question] — Status: [resolved | deferred until day 30 | etc.]
```

**10. What Comes After (Forward Vision)**
```markdown
## Forward Vision

What happens after the 180-day target is reached. What's the next chapter.

- [Future direction]
- [Expansion idea]
```

---

## 4. Vision Update Protocol

If an agent believes a vision change is needed, the protocol is formal:

### 4.1 Creating a Vision Update Request

1. Agent creates a `vision_update_request` ticket
2. **Do NOT modify the vision.md file directly**
3. Ticket describes:
   - What needs to change
   - Why the change is needed
   - Impact on execution if not changed
   - Proposed new language (if applicable)

### 4.2 Approval Chain

```
Agent creates vision_update_request ticket
        │
        ▼
Marcus reviews (checks against DOC-007 Vision Lock Governance)
        │
        ├─ Marcus rejects: ticket closed, vision unchanged
        │
        └─ Marcus recommends approval → surfaces to human
        │
        ▼
Human decides: approve or reject
        │
        ├─ Human rejects: vision unchanged
        │
        └─ Human approves
        │
        ▼
Marcus updates vision.md
Increments version field
Adds note: "Updated [date] — [reason]"
Creates new checkpoint
Ticket closed
```

### 4.3 Rules for Vision Changes

Only Marcus or the human can approve vision changes. An agent cannot approve changes to a vision, even if the agent is the project PM.

No vision change is automatically approved. Every change goes through the human.

---

## 5. Vision Immutability Enforcement

### 5.1 File Hash Checkpointing

At the moment a vision is approved:

```bash
sha256sum projects/[slug]/vision.md > projects/[slug]/.vision-checkpoint
```

The hash is recorded in the checkpoint directory.

### 5.2 Access and Read Verification

Before every agent action that references a vision:
1. Agent reads vision.md
2. System computes current SHA256
3. System compares to .vision-checkpoint hash
4. If hashes differ: agent is alerted ("Vision.md has been modified since approval")
5. If hashes match: vision is treated as authoritative

### 5.3 Modification Attempt Blocking

If any agent attempts to modify an APPROVED vision directly:
1. OpenClaw permission system denies write access
2. Error: "vision.md is immutable. Create vision_update_request ticket instead."
3. Incident logged to audit trail
4. Marcus is notified

---

## 6. Multiple Visions in a Company

A company can have multiple active visions (one per project). Each is independent.

**Rules:**
- No vision overrides another vision
- When a task could align with multiple visions, agent makes the judgment call and documents which vision it prioritized
- If conflict is irresolvable, agent escalates

**Example:** DevGru Technology Products has:
- `projects/onxza/vision.md` — ONXZA product vision
- `projects/faails-community/vision.md` — FAAILS open standard vision
- `projects/model-index/vision.md` — Model Index competitive moat vision

Each is independent. An agent executing ONXZA tasks uses only the ONXZA vision.

---

## 7. Vision as a Tie-Breaker

When an agent has competing instructions:

```
Ticket from PM says: "Do X"
Vision says: "We prioritize Y"
What wins?
```

**Rule:** Vision wins. Always. The vision is the immutable north star. If a task conflicts with vision, agent:
1. Escalates to PM immediately
2. Documents the conflict
3. Waits for PM guidance (which usually results in the ticket being wrong, not the vision)

---

## 8. Vision Transparency and Access

All visions are human-readable and transparent.

**Reading visions:**
- Agents can read any vision in their own company
- Agents can read global visions (if any)
- Agents cannot read other companies' visions without permission

**Publishing visions:**
- Company visions are internal documents
- If a vision is intended for public knowledge, it is published to a public README or website
- The vision.md file itself remains the internal authoritative version

---

## 9. Vision File Naming and Location

```
~/.openclaw/workspace/projects/[project-slug]/vision.md
```

All project visions live in the projects directory with their related project files.

**Example paths:**
- `projects/onxza/vision.md`
- `projects/world-destination-club/vision.md`
- `projects/ai-agency-automation/vision.md`

---

## 10. TORI-QMD Validation for Visions

All vision.md files must pass TORI-QMD validation:

**Required fields:**
- title
- status (must be "CDP-REVIEW" or "APPROVED — IMMUTABLE")
- created date
- credit_line
- Minimum 500 words of content (original statement + interpreted intent)

**Validation command:**
```bash
python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py projects/[slug]/vision.md
```

A vision file cannot be approved until it passes TORI-QMD.

---

## 11. Vision History and Versioning

Vision documents never delete old content. They append.

**Structure for a vision with update history:**

```markdown
---
version: 2.0
status: APPROVED — IMMUTABLE
last_updated: 2026-03-18
---

## Original Vision Statement
[Version 1.0 statement]

## Vision Update (2026-03-18)
Approved by: [Human]  
Changed: [What changed]  
Reason: [Why]  

### Updated Vision Statement
[Version 2.0 statement]
```

Version increments with each approved change. Full history is maintained.

---

## 12. Escalation: Irresolvable Vision Ambiguity

If during execution an ambiguity in the vision cannot be resolved:

1. Agent flags the issue
2. Creates an `escalation` ticket
3. Ticket references the vision file and the specific ambiguous section
4. Agent proposes 2–3 possible interpretations
5. PM or Marcus clarifies
6. If no clarification emerges: escalate to the human
7. Human decides

Vision is never left in an ambiguous state for execution. Ambiguity is escalated, not ignored.

---

## 13. Vision and Shared Learnings

When a vision is completed or a major phase ends:

1. Agents extract learnings from the vision execution
2. Patterns are written to `shared-learnings/[company]/patterns/`
3. Key insights from the vision inform shared learning promotion
4. Vision.md serves as a historical record for future similar projects

---

## 14. Compliance Checklist

Before a vision goes live (APPROVED — IMMUTABLE):

- [ ] Title field set correctly
- [ ] Status field explicitly says "APPROVED — IMMUTABLE"
- [ ] Original vision statement is verbatim from human
- [ ] Interpreted intent section is present
- [ ] 30 / 90 / 180-day targets are concrete (not vague)
- [ ] Non-negotiables are stated
- [ ] Constraints are documented
- [ ] Scope (in/out) is clear
- [ ] Agent team is assigned
- [ ] Open questions section exists (even if "None")
- [ ] Forward vision is documented
- [ ] Passes TORI-QMD validation
- [ ] Checkpoint created pre-approval
- [ ] Human has explicitly approved

---

*This specification is part of FAAILS. Maintained by DTP_ONXZA_Docs.*  
*Specification version: 1.0 — 2026-03-18*

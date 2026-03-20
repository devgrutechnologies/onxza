---
doc_id: ONXZA-DOC-006
title: Agent Communication Standards
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: communication, tickets, escalation, reporting, inter-agent, all-agents
summary: How every agent in ONXZA communicates. Ticket format, escalation paths, reporting standards, and inter-agent protocols. Consistent communication is what makes a multi-agent system coherent.
---

# ONXZA Agent Communication Standards

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0

---

## Overview

All inter-agent communication in ONXZA is ticket-based. No verbal instructions between agents. Tickets create auditability. Verbal instructions create chaos and cannot be recovered.

---

## Section 1 — Communication Hierarchy

```
System Owner  ←→  Primary Agent (iMessage / direct chat)
                      ↕  (tickets: primary_to_orchestrator)
                   Orchestrator
                      ↕  (tickets: orchestrator_to_pm)
                   Project Manager(s)
                      ↕  (tickets: task / all types)
                   Specialist Agents
```

**Rules:**
- No agent skips a level **except** SEV-1 security events (go directly to primary agent).
- No agent below the primary contacts the system owner.
- All inter-agent communication is ticket-based.
- Every ticket references the relevant `vision.md`.

---

## Section 2 — Ticket Communication Standards

### Writing Good Tickets

A good ticket is **self-contained**. The recipient should be able to act on it without asking for clarification.

**Required elements:**

| Element | Description |
|---|---|
| **Summary** | One sentence. What is this ticket? |
| **Context** | What does the recipient need to know to act? Assume they have no prior context. |
| **Requested Action** | Specific deliverable. Not "look into X" — "produce Y that does Z by [date]." |
| **Vision Alignment** | One sentence connecting this to `vision.md`. |
| **Acceptance Criteria** | How will we know it's done correctly? |

**Common failures to avoid:**

| Bad | Good |
|---|---|
| "Fix the thing" | "Fix null reference error in user authentication endpoint — line 47 of auth.js" |
| "Look into the API" | "Document all available endpoints for the AWIN API and output to `skills/awin-api.md`" |
| "Help with content" | "Write 5 blog post outlines targeting the keyword 'best guided tours in Paris', each 100 words" |
| Missing context | Include everything the recipient needs — they start with zero context |
| No acceptance criteria | "Done when: PM can review 5 blog outlines in `content/outlines/paris-tours/`" |

### Ticket Update Standards
When updating a ticket in progress, append to the Notes section:
```
### [ISO Date] [Agent Name]
[What happened / what was done / current state]
```
**Never overwrite prior notes. Always append.**

---

## Section 3 — Escalation Communication

### Escalation Message Format

When escalating a ticket upward:

```
ESCALATION — [SEVERITY: LOW | MEDIUM | HIGH | CRITICAL]
From: [Agent Name / Role]
Escalating To: [Recipient]
Original Ticket: [TICKET-ID]
Project: [Project Name]

Why This Needs Your Attention:
[One paragraph — what happened, why it can't be resolved at current level]

What I've Already Tried:
- [Approach 1]
- [Approach 2]

What I Need From You:
[Specific — a decision, a resource, or an action]

Time Sensitivity:
[Is this blocking other work? What's the impact of delay?]
```

### Primary Agent → Owner Message Format

For surfacing issues to the system owner:

```
[Project Name] — [Issue Type]

Situation: [1-2 sentences what's happening]
Impact: [what happens if not addressed]
My recommendation: [what the primary agent thinks should happen]

Do you want me to [specific action]?
```

Keep it short. Surface one issue per message. The owner should be able to respond YES/NO or give a direction in under 10 seconds.

---

## Section 4 — Cross-Department Communication

When a specialist agent needs something from another department:

1. Agent creates ticket type `cross_department`.
2. Routes to **own PM first** — not directly to other department.
3. Own PM reviews, approves, routes to target PM.
4. Target PM assigns to appropriate specialist.
5. Response routes back the same way.

**Never:** Agent A contacts Agent B in another department directly. Always through PMs.

---

## Section 5 — Reporting Standards

### Agent Task Completion Report

```markdown
## Task Complete: [TICKET-ID]
**Agent:** [name]
**Completed:** [ISO date]

### What Was Delivered
[Specific description of output + where it lives]

### Vision Alignment
[Confirmed: yes | no + one sentence]

### Issues Encountered
[Any problems and how they were resolved]

### Next Steps Identified
[Any forward proposals for PM consideration]
```

### PM Weekly Status Report

```markdown
## Weekly Status: [Project Name]
**Week:** [date range]
**PM:** [name]

### Progress
- Tasks completed: [n]
- Tasks in progress: [n]
- Tasks blocked: [n]
- New tickets created: [n]

### Accomplishments
[Bullet list of meaningful progress this week]

### Blockers
[What's stuck, why, and what is needed to unblock]

### Risks
[What might become a problem in the next 1-2 weeks]

### Next Week Plan
[Priority tasks and expected completions]
```

---

## Section 6 — Communication Tone Standards

| Context | Tone |
|---|---|
| Agent-to-agent tickets | Precise, structured, factual, complete |
| PM to Orchestrator | Clear, factual, with explicit ask |
| Orchestrator to primary agent | Strategic summary, only what requires primary attention |
| Primary agent to owner | Natural, direct, trusted advisor — never robotic |
| Any message | Never vague; always specify the exact deliverable |

---

## Section 7 — What Not to Do

| Don't | Do Instead |
|---|---|
| Send verbal instructions to another agent | Create a ticket |
| Skip the PM and go directly to another specialist | Route through your PM |
| Contact the system owner directly | Route through the primary agent |
| Leave a ticket with no acceptance criteria | Define how done looks |
| Overwrite notes on an existing ticket | Append a new timestamped entry |
| Escalate to avoid doing the work | Escalate only when you genuinely cannot resolve |
| Ask the same question twice | Check the governance docs first |

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

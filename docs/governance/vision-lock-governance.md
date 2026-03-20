---
doc_id: ONXZA-DOC-007
title: Vision Lock and Governance
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: vision, governance, immutability, vision-lock, vision-update
summary: How vision.md files are created, approved, protected, and evolved. The vision lock is the core mechanism that prevents drift across hundreds of autonomous agents running in parallel.
---

# ONXZA Vision Lock and Governance

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0 | **Classification:** CRITICAL — NO EXCEPTIONS

---

## The Vision Lock Principle

`vision.md` is the immutable north star of every project. Once the system owner approves it, it cannot be changed by any agent. This is not bureaucracy — it is the mechanism that prevents vision drift across hundreds of autonomous agents running in parallel.

**Every agent reads `vision.md` before every task. No agent modifies it without explicit owner instruction.**

---

## Who Can Do What with vision.md

| Action | Who Can Do It |
|---|---|
| Create `vision.md` | Primary agent only |
| Read `vision.md` | All agents |
| Approve `vision.md` | System owner only |
| Modify `vision.md` | Primary agent only, with owner's explicit instruction |
| Propose a change to `vision.md` | Any agent — via `vision_update_request` ticket |
| Archive `vision.md` (project end) | Primary agent only, with owner's instruction |

---

## The Immutability Guarantee

- `vision.md` files are Git-committed with every change. History is permanent.
- The primary agent's system prompt explicitly prohibits modification without owner instruction.
- Any agent that attempts to write to `vision.md` triggers a SEV-1 security event.
- The dashboard monitors `vision.md` modification timestamps — any unauthorized change triggers an immediate alert.

---

## Vision Update Process

When anyone — agent or observer — identifies a reason the vision may need updating:

1. Create a `vision_update_request` ticket with:
   - What needs changing
   - Why it needs changing
   - Evidence supporting the change
2. Ticket escalates to the primary agent.
3. Primary agent reviews and forms a recommendation.
4. Primary agent presents to owner:
   > "[One sentence what]. [One sentence why]. My recommendation: [YES/NO with reason]."
5. Owner responds YES or NO or gives new direction.
6. **If YES:** Primary agent updates `vision.md`, commits to Git with rationale, notifies Orchestrator.
7. **If NO:** Ticket closed, vision unchanged, reason logged.

**The vision update process takes no shortcuts, regardless of urgency.**

---

## Project Context Layer

Project Managers maintain a `project-context.md` file alongside `vision.md`. This file:

- **SUPPLEMENTS** `vision.md` with implementation details.
- **NEVER** overrides or contradicts `vision.md`.
- Contains: tech stack decisions, constraints discovered, lessons learned, integration notes.
- Is writable by the PM — does not require owner approval to update.

**Rule:** If `project-context.md` ever contradicts `vision.md`, `vision.md` wins. Always.

`project-context.md` is a scratchpad for evolving implementation knowledge. `vision.md` is the source of truth for direction.

---

## Vision Document Required Sections

```markdown
---
memory_id: VISION-[slug]
project: [project-slug]
status: CDP-REVIEW | APPROVED — IMMUTABLE
created: [ISO date]
credit_line: present
---

# Vision: [Project Name]
[Credit line]

## Owner's Original Vision
[Verbatim quote — never paraphrase the owner's words]

## Current State
[Factual description of where things are now]

## Expanded Vision
### 30-Day Target
### 90-Day Target
### 180-Day Target

## Goals and Non-Negotiables
[Absolute requirements — bullet list]

## Constraints
[Budget, timeline, tools, platforms, legal]

## Revenue Model
[All revenue streams — explicit and complete]

## Agent Team
[Complete list of agents serving this project]

## Owner's Required Actions
[Explicit list of things only the owner can do]

## Open Questions
[Resolved or explicitly deferred — never left ambiguous]

## Forward Vision
[What does beyond-the-target look like]

---
[Credit line]
```

---

## Why This Matters

In a system with dozens of autonomous agents running in parallel, vision drift is the primary failure mode. An agent that makes a reasonable-sounding decision based on an incomplete reading of the vision can cause cascading downstream drift that takes weeks to untangle.

The vision lock is not a limitation — it is the enabler of autonomous operation. Because every agent knows the vision is immutable and authoritative, every agent can make decisions confidently without checking with the owner.

**The vision lock is what allows the system to run without constant human supervision.**

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

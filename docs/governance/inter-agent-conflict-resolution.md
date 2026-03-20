---
doc_id: ONXZA-DOC-009
title: Inter-Agent Conflict Resolution
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: conflict, resolution, agents, scope, priority, vision
summary: How ONXZA handles conflicts between agents — scope disputes, contradictory outputs, priority collisions, and vision interpretation disagreements. Every conflict gets a resolver and a closed outcome.
---

# ONXZA Inter-Agent Conflict Resolution

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0

---

## Types of Conflict

| Type | Definition | Resolver |
|---|---|---|
| **Scope conflict** | Two agents claiming the same task | PM — assigns clearly, updates both agent identities if scope is ambiguous |
| **Output conflict** | Two agents produced contradictory outputs | PM — reviews against `vision.md`, picks winner, explains why |
| **Priority conflict** | Two tickets competing for the same agent's time | PM — assigns priority explicitly |
| **Cross-project conflict** | Two projects need the same resource simultaneously | Orchestrator — prioritizes based on vision priority levels |
| **Skill conflict** | Two agents want to install the same skill differently | PM + AgentDeveloper — standardize the skill |
| **Vision interpretation conflict** | Agents disagree on what the vision requires | Primary agent — re-reads `vision.md`, issues definitive interpretation |

---

## Resolution Principles

1. **`vision.md` always wins.** When agents disagree on direction, whoever is closer to the vision is right. No vote. No compromise. Read the vision.

2. **PM has final say within a project.** Not voted on. PM decides and documents the rationale.

3. **No conflict is left unresolved.** Every conflict gets a ticket, a resolver, and a closed outcome. Open conflicts are a system health failure.

4. **The resolution becomes policy.** Once resolved, the reasoning is written into `project-context.md` so the same conflict does not recur. A conflict that happens twice is a policy failure.

---

## Conflict Resolution Ticket Format

```markdown
---
id: TICKET-[YYYYMMDD]-[sequence]
type: conflict_resolution
parties: [agent-id-1, agent-id-2]
project: [project-slug]
priority: high
status: open
---

## Conflict Description
What are the two positions?
- **Agent 1 ([agent-id]):** [Their position]
- **Agent 2 ([agent-id]):** [Their position]

## Evidence from vision.md
[Exact quote from vision.md relevant to this conflict]

## Resolution
[PM / Orchestrator / Primary agent decision — one clear sentence]

## Rationale
[Why this interpretation of the vision. Be specific enough that the reasoning can be applied to similar situations.]

## Future Guidance
[How should agents handle similar situations going forward? This is what gets written to project-context.md.]

## Notes
[Chronological updates]

## Completion Note
[Written when closed]
```

---

## How to Raise a Conflict

Any agent that identifies a conflict with another agent's work:

1. **Do not escalate verbally** — create a `conflict_resolution` ticket.
2. Describe both positions fairly — include the other agent's reasoning, not just your own.
3. Include the relevant `vision.md` quote.
4. Route to PM.

**Do not continue the conflicting work** while the resolution is pending. Creating a conflict and then continuing as if you've already won creates compounding problems.

---

## Cross-Project Conflicts

When two projects need the same resource:
- The Orchestrator is the resolver.
- Resolution is based on priority levels set in each `vision.md`.
- If priorities are equal, the system owner is the tiebreaker.
- Both project PMs are notified of the resolution and its rationale.

---

## Learning from Conflicts

Every resolved conflict is an opportunity to prevent the next one. After resolution:
1. Write the resolution rationale to `project-context.md`.
2. If the conflict reveals an ambiguity in `vision.md`, create a `vision_update_request` ticket.
3. If the conflict reveals a gap in policies, create a `policy_gap_request` ticket.

A system that resolves conflicts without learning from them is not improving.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

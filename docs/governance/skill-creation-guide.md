---
doc_id: ONXZA-DOC-005
title: Skill Creation Guide
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: skills, tools, libraries, approval, documentation, versioning
summary: How to research, document, approve, install, maintain, and deprecate ONXZA agent skills. Includes the skill MD format, approval workflow, and research template.
---

# ONXZA Skill Creation Guide

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0

---

## What Is a Skill?

A skill is any tool, library, API, framework, script, or capability an agent uses to perform its function. Skills must be documented as skill MD files, versioned, and validated with TORI-QMD frontmatter before use.

**Skills are living documents.** An agent that writes a skill MD once and never updates it is not functioning correctly. When an agent learns something new about a tool, the skill MD gets updated.

---

## Section 1 — Skill MD Format

Every approved skill has a markdown document in the agent's `skills/` directory.

```markdown
---
version: [semver — e.g., 1.2.0]
owner: [agent-id]
created: [ISO date]
last_updated: [ISO date]
source: [URL to official repo or registry]
license: [license type]
cost: [free | $X/month | usage-based]
network_access: [yes | no]
tags: [comma-separated retrieval tags]
summary: [one sentence — what this skill does for this agent]
---

# [Skill Name]

## What This Skill Does
[Clear description of capability]

## Why This Agent Uses It
[Specific justification — what task does this enable?]

## Installation
```bash
[exact install command]
```

## Basic Usage
[Code example showing how this agent uses this skill]

## Security Notes
[Any network calls, permissions, known issues]

## Known Limitations
[Edge cases, failure modes, context window considerations]

## Update Procedure
[How to update this skill when new versions release]

## Changelog
| Version | Date | Change |
|---|---|---|
| 1.0.0 | [date] | Initial |

---
[Credit line]
```

---

## Section 2 — Skill Approval Workflow

```
Agent identifies need
        ↓
Research: best tool, source, security review, license, cost
(Use research template in Section 3)
        ↓
Create skill_approval_request ticket with full research
        ↓
PM reviews against security vetting checklist (DOC-004 Section 3.2)
        ↓
FREE + SAFE + WELL-DOCUMENTED?
  YES → PM approves, agent installs
  NO  → Orchestrator → Primary Agent → Owner approval
        ↓
On approval: install, create skill MD, commit to Git, update memory
```

**No skill is ever installed without approval. Ever.**

---

## Section 3 — Skill Research Template

Before requesting approval, complete this research. Include it in the `skill_approval_request` ticket.

```markdown
## Skill Research: [Skill Name]
**Researched By:** [agent-id]
**Date:** [date]
**Task Requiring This Skill:** [ticket-id]

### Problem to Solve
[What can the agent not do without this skill?]

### Alternatives Considered
| Tool | Pros | Cons | Why Rejected |
|---|---|---|---|
| [alt 1] | | | |
| [alt 2] | | | |

### Recommended Tool
**Name:** 
**Source:**
**Stars / Downloads:**
**Last Updated:**
**License:**
**Cost:**
**Network Access:** [yes / no — if yes, what does it call?]
**Permissions Required:**
**Security Assessment:** [pass / flag — with explanation]
**Why Best Choice:**

### Installation Command
```bash
[exact command]
```

### Test Plan
[How you'll verify the skill works correctly in a sandbox]
```

---

## Section 4 — Living Skills — Maintenance Protocol

### When to Update a Skill

- Agent learns a more efficient usage pattern → update `Basic Usage`
- New limitation discovered → update `Known Limitations`
- Security issue identified → update `Security Notes`, escalate per DOC-004
- New version released → test, update version, update `Changelog`
- Better alternative identified → begin deprecation process

### Update Process

1. Update the relevant section(s) of the skill MD.
2. Increment the version number:
   - **Patch** (1.0.0 → 1.0.1): minor note additions, formatting
   - **Minor** (1.0.0 → 1.1.0): new usage patterns, limitation discoveries
   - **Major** (1.0.0 → 2.0.0): fundamental change to how the skill is used
3. Add entry to the `Changelog` section.
4. Run `validate-tori-qmd.py` on the updated file.
5. Commit to Git.

---

## Section 5 — Skill Aggregation Flow

The best skills discovered at the agent level get elevated to company and global standards:

```
Agent writes/updates skill
        ↓
Company AgentDeveloper reviews company skills quarterly
Best skills elevated to company standard
        ↓
Global AgentDeveloper reviews global skills quarterly
Best skills elevated to global standard
        ↓
Global standard skills reviewed for ONXZA public library
Published with full credit line
```

This creates a compounding learning effect — every agent benefits from every other agent's discoveries.

---

## Section 6 — Skill Deprecation

When a skill is outdated or a better alternative exists:

1. Agent creates `skill_update_request` ticket to PM with research on the replacement.
2. PM approves replacement.
3. Old skill MD renamed to `[name].deprecated.md`.
4. New skill installed per normal approval workflow.
5. Old skill removed after a 90-day grace period.

**Never delete deprecated skill MDs immediately.** Other agents may be using the same skill — the grace period allows for safe migration.

---

## Section 7 — Skill Safety Standards

### Approved Sources
- Official package registries (npm, PyPI, Homebrew, etc.)
- GitHub repositories with:
  - Active maintenance (commit within 6 months)
  - Active issue tracker (maintainer responds to issues)
  - At least 100 stars
  - Verifiable author identity

### Automatic Flags (require primary agent / owner approval)
- Skill makes network calls to external servers
- Skill requires root or admin access
- Skill accesses filesystem outside the agent's designated directory
- Skill has less than 6 months of maintenance history
- More than 30% of the skill's code is minified or obfuscated
- Unknown author with no public identity

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

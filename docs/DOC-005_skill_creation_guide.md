# SKILL CREATION GUIDE

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

**Document ID:** DOC-005  
**Classification:** OPERATIONAL REFERENCE  
**Version:** 1.0.0  
**Last Updated:** 2025-03-17  
**Owner:** Agent Developer Orchestrator  

---

## PURPOSE
A skill is any tool, library, API, or capability an agent uses. This document defines how skills are researched, documented, approved, installed, maintained, and deprecated.

---

## SECTION 1 — SKILL MD FORMAT
Every approved skill has a markdown document in the agent's `/skills/` directory.

```markdown
---
skill_id: [unique ID]
skill_name: [human readable name]
version: [version installed]
agent: [agent this skill belongs to]
project: [project slug or "system"]
approved_by: [PM or Aaron]
approved_date: [ISO date]
source: [URL to official repo or registry]
license: [license type]
cost: [free | $X/month | usage-based]
network_access: [yes | no]
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
[Edge cases, failure modes]

## Update Procedure
[How to update this skill when new versions release]
```

---

## SECTION 2 — SKILL APPROVAL WORKFLOW

1. Agent identifies need → writes research note
2. Research: best tool, source, security review, license, cost
3. Creates `skill_approval_request` ticket with full research
4. PM reviews against DOC-004 skill vetting checklist
5. If free + safe + well-documented → PM approves, agent installs
6. If cost / network / security flag → Orchestrator → Marcus → Aaron
7. Agent installs, creates skill MD, commits to Git, updates memory

---

## SECTION 3 — SKILL RESEARCH TEMPLATE

```markdown
## Skill Research: [Skill Name]
**Researched By:** [agent]
**Date:** [date]
**Task Requiring This Skill:** [ticket ID]

### Alternatives Considered
| Tool | Pros | Cons | Why Rejected |
|---|---|---|---|

### Recommended Tool
**Name:** 
**Source:** 
**Stars/Downloads:**
**Last Updated:**
**License:**
**Cost:**
**Network Access:**
**Security Assessment:**
**Why Best Choice:**
```

---

## SECTION 4 — SKILL DEPRECATION

1. Agent identifies skill as outdated or better alternative exists
2. Creates `skill_update_request` ticket to PM with research
3. PM approves replacement
4. Old skill MD renamed to `[name].deprecated.md`
5. New skill installed per normal workflow
6. Old skill removed after 90-day grace period


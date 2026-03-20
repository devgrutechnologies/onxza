---
title: Global Standard Agent Template
version: 1.0.0
owner: DTP_ONXZA_Architect
created: 2026-03-18
status: APPROVED
tags: template, agent, onxza, scaffolding, agent-create
summary: Reference template for all 6 agent workspace files. Used by `onxza agent create` and `onxza init` to scaffold new agents. Defines the quality baseline every ONXZA agent inherits.
credit_line: "Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs."
---

# Global Standard Agent Template

**Version:** 1.0.0 | **Owner:** DTP_ONXZA_Architect | **Date:** 2026-03-18

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Overview

This directory contains the 6 template files used to scaffold every agent workspace in ONXZA. Per ARCHITECTURE.md §7.1, every agent is built from:

```
Global Standard Template (this directory)
  + Company Vision Context
  + Company Tech Stack
  + Company Shared Learnings
  + Project-Specific Knowledge
= A fully initialized specialist agent
```

The templates use **Mustache-style** variable substitution (`{{VARIABLE_NAME}}`). Sections wrapped in `{{#VAR}}...{{/VAR}}` render only when the variable is set. Sections wrapped in `{{^VAR}}...{{/VAR}}` render only when the variable is NOT set (fallback content).

---

## Template Files

| File | Purpose | TORI-QMD Requirements |
|---|---|---|
| `AGENTS.md` | Agent identity, protocols, scope, responsibilities | Credit line required |
| `SOUL.md` | Personality, values, working style | None (no TORI-QMD rules for SOUL.md) |
| `IDENTITY.md` | Structured identity card | None (no TORI-QMD rules for IDENTITY.md) |
| `MEMORY.md` | Long-term memory store | None (agent root MEMORY.md is not in memory/ path) |
| `TOOLS.md` | Available tools and shared resources | None (no TORI-QMD rules for TOOLS.md) |
| `HEARTBEAT.md` | Recurring scheduled tasks | None (no TORI-QMD rules for HEARTBEAT.md) |

All 6 files are required. An agent without all 6 files is considered incomplete and will fail `onxza agent validate`.

---

## Template Variables

### Required Variables

| Variable | Description | Example |
|---|---|---|
| `AGENT_ID` | Kebab-case agent identifier | `dtp-onxza-architect` |
| `AGENT_NAME` | PascalCase display name (Company_Dept_Role) | `DTP_ONXZA_Architect` |
| `COMPANY_SLUG` | Short company identifier | `DTP` |
| `COMPANY_FULL_NAME` | Full company display name | `DevGru Technology Products` |
| `DEPARTMENT` | Department within the company | `ONXZA` |
| `ROLE` | Role title | `Platform Architect` |
| `MODEL` | LLM model identifier (without provider prefix) | `claude-opus-4-6` |
| `PERSISTENCE_CLASS` | `persistent` or `temporary` | `persistent` |
| `REPORTS_TO` | Agent or role this agent reports to | `DTP_CEO` |
| `CREATED_DATE` | ISO date of agent creation | `2026-03-18` |

### Optional Variables

| Variable | Description | Default Behavior |
|---|---|---|
| `RESPONSIBILITIES` | Array of responsibility strings | Placeholder text shown |
| `TICKET_TYPES_CREATE` | Array of ticket type strings | `task`, `escalation` |
| `TICKET_TYPES_RECEIVE` | Array of ticket type strings | `task` |
| `SOUL_STATEMENT` | Custom soul/personality paragraph | Placeholder text shown |
| `COMPANY_CONTEXT` | Memory context paragraph | Placeholder text shown |
| `TOOLS` | Array of tool/capability strings | Placeholder text shown |
| `COMPANY_VISION_PATH` | Relative path to company vision.md | Section omitted |
| `HEARTBEAT_ENABLED` | Boolean — does this agent have heartbeat? | No heartbeat section |
| `HEARTBEAT_SCHEDULE` | Cron expression string | `none` |
| `HEARTBEAT_TASKS` | Array of custom heartbeat task strings | Default check for stale tickets |

---

## Usage in `onxza agent create`

```bash
# Interactive — prompts for all required variables
onxza agent create DTP_ONXZA_NewRole

# With flags — skip prompts
onxza agent create DTP_ONXZA_NewRole \
  --model claude-sonnet-4-6 \
  --persistence persistent \
  --reports-to DTP_ONXZA_PM
```

### What `onxza agent create` does:

1. **Parse** the agent name → extract Company, Department, Role
2. **Validate** naming convention matches `[Company]_[Dept]_[Role]`
3. **Check** Agent Registry for duplicates
4. **Prompt** for any missing required variables (model, persistence, reports-to)
5. **Copy** all 6 templates to `~/.openclaw/workspace-[agent-id]/`
6. **Substitute** all `{{VARIABLE}}` placeholders with provided values
7. **Run** `validate-tori-qmd.py` on all 6 files
8. **Register** agent in `openclaw.json` (agents.list)
9. **Update** Agent Registry (`docs/AGENT-REGISTRY.md`)
10. **Create** checkpoint
11. **Print** success message with next steps

---

## Usage in `onxza init`

During `onxza init`, the template is downloaded to the local ONXZA installation:

```
~/.openclaw/workspace/projects/onxza/templates/agent/
```

This path is the canonical source. All agent creation reads templates from here. Custom templates can extend (not replace) the standard by adding company-specific template overlays:

```
projects/onxza/templates/agent-overlays/
├── ceo.md         ← Additional AGENTS.md content for CEO agents
├── coo.md         ← Additional AGENTS.md content for COO agents
└── specialist.md  ← Additional AGENTS.md content for specialist agents
```

Overlays are appended to the standard template sections — they never replace them.

---

## Customization Guide

### Company-Level Customization

Companies can define default values for their agents in `openclaw.json` → `companies.list[]`:

```json
{
  "slug": "DTP",
  "name": "DevGru Technology Products",
  "defaults": {
    "model": "claude-sonnet-4-6",
    "sharedLearningsPath": "shared-learnings/DTP",
    "visionPath": "projects/onxza/vision.md"
  }
}
```

These defaults are used when `onxza agent create` is run for that company — reducing the number of prompts.

### Role-Based Customization

After scaffolding, the agent creator (typically `[Company]_AgentDeveloper`) customizes:

1. **AGENTS.md** — Fill in specific responsibilities, ticket types, domain scope
2. **SOUL.md** — Write a unique soul statement for the agent's domain
3. **TOOLS.md** — List actual tools and credentials the agent needs
4. **HEARTBEAT.md** — Configure heartbeat schedule if applicable

The template provides the structure. The AgentDeveloper provides the substance.

### Post-Customization Validation

After customization, always validate:

```bash
onxza agent validate [agent-id]
# Runs validate-tori-qmd.py on all 6 files
# Checks openclaw.json registration
# Verifies workspace directory structure
```

---

## Template Versioning

Templates are versioned alongside the ONXZA release. The version in the README frontmatter tracks the template version. When templates change:

1. Update template files
2. Bump version in README frontmatter
3. Document changes in ONXZA CHANGELOG.md
4. Existing agents are NOT auto-updated — templates apply to new agents only
5. A future `onxza agent upgrade` command will apply template updates to existing agents

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

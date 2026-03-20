---
title: "openclaw.json — Central Registry Reference"
version: 1.0.0
owner: DTP_ONXZA_Architect
created: 2026-03-18
status: APPROVED
tags: openclaw-json, registry, agents, companies, schema, reference
summary: Complete reference for openclaw.json — the central configuration registry for all ONXZA agents, companies, and system configuration.
credit_line: "Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs."
---

# openclaw.json — Central Registry Reference

**Version:** 1.0.0 | **Owner:** DTP_ONXZA_Architect | **Date:** 2026-03-18

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## 1. Overview

`openclaw.json` is the single source of truth for an ONXZA installation. It defines:

- **Every registered agent** — identity, model, workspace, persistence class
- **Every registered company** — name, slug, vision path, shared learnings path
- **System configuration** — gateway, channels, plugins, hooks, auth
- **Dispatcher configuration** — routing strategy, polling cadence, ticket scanning

Every `onxza agent create` writes to this file. Every `onxza company add` writes to this file. The dispatcher reads it. The validator checks it. It is the registry backbone.

**Location:** `~/.openclaw/openclaw.json`

**Schema:** `projects/onxza/schemas/openclaw.schema.json`

---

## 2. File Structure

```json
{
  "$schemaVersion": "1.0.0",
  "meta": { ... },
  "wizard": { ... },
  "auth": { ... },
  "agents": {
    "defaults": { ... },
    "list": [ ... ]
  },
  "companies": {
    "list": [ ... ]
  },
  "dispatcher": { ... },
  "tools": { ... },
  "broadcast": { ... },
  "commands": { ... },
  "session": { ... },
  "hooks": { ... },
  "channels": { ... },
  "gateway": { ... },
  "skills": { ... },
  "plugins": { ... }
}
```

### Required Sections

| Section | Purpose |
|---|---|
| `$schemaVersion` | Schema version this file conforms to |
| `meta` | File metadata — last touched version and timestamp |
| `agents` | Agent registry with defaults and list |

All other sections are optional and have sensible defaults.

---

## 3. Sections Reference

### 3.1 `$schemaVersion`

```json
"$schemaVersion": "1.0.0"
```

SemVer string. Used by `onxza config validate` to select the correct schema, and by `onxza config migrate` to determine required migrations. Files without this field are treated as version `0.0.0`.

### 3.2 `meta`

```json
"meta": {
  "lastTouchedVersion": "2026.3.13",
  "lastTouchedAt": "2026-03-18T23:36:48.620Z"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `lastTouchedVersion` | string | yes | ONXZA CLI version that last wrote the file |
| `lastTouchedAt` | ISO 8601 | yes | Timestamp of last modification |

### 3.3 `agents`

The agent registry. Every persistent daemon agent must be listed here. Temporary sub-agents are NOT registered (per FAAILS-001).

#### `agents.defaults`

Default values inherited by all agents:

```json
"defaults": {
  "model": { "primary": "anthropic/claude-sonnet-4-6" },
  "workspace": "/Users/you/.openclaw/workspace",
  "memorySearch": { "extraPaths": ["docs", "projects", "shared-learnings"] }
}
```

#### `agents.list[]`

Each agent entry:

```json
{
  "id": "dtp-onxza-architect",
  "workspace": "/Users/you/.openclaw/workspace-dtp-onxza-architect",
  "model": { "primary": "anthropic/claude-opus-4-6" },
  "company": "DTP",
  "persistence": "persistent",
  "disabled": false,
  "tags": ["architecture", "onxza"]
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | string | yes | — | Unique kebab-case agent ID |
| `workspace` | path | yes | — | Absolute path to agent workspace |
| `model` | object | no | inherits defaults | Model config with `primary` and optional `fallback` |
| `default` | boolean | no | false | Primary agent flag (only one should be true) |
| `company` | string | no | — | Company slug this agent belongs to |
| `persistence` | string | no | persistent | `persistent` or `temporary` |
| `heartbeat` | object | no | — | Heartbeat schedule override |
| `memorySearch` | object | no | inherits defaults | Memory search path override |
| `disabled` | boolean | no | false | If true, agent is registered but inactive |
| `tags` | string[] | no | — | Tags for filtering and routing |

### 3.4 `companies`

The company registry. Introduced in schema v1.0.0.

```json
"companies": {
  "list": [
    {
      "slug": "DTP",
      "name": "DevGru Technology Products",
      "parent": "MG",
      "visionPath": "projects/onxza/vision.md",
      "sharedLearningsPath": "shared-learnings/DTP",
      "created": "2026-03-17T00:00:00Z"
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | yes | PascalCase identifier (used in paths and agent naming) |
| `name` | string | yes | Full display name |
| `parent` | string | no | Parent company slug (for subsidiaries) |
| `visionPath` | string | no | Relative path to vision.md |
| `sharedLearningsPath` | string | no | Relative path to shared learnings |
| `created` | ISO 8601 | no | When the company was registered |
| `disabled` | boolean | no | If true, company is inactive |

### 3.5 `dispatcher`

Controls the central ticket dispatcher behavior.

```json
"dispatcher": {
  "enabled": true,
  "scanIntervalMinutes": 5,
  "ticketBasePath": "tickets",
  "routing": {
    "strategy": "registry",
    "moeModelRef": "anthropic/claude-sonnet-4-6"
  },
  "pollingCadence": {
    "principal": 0,
    "orchestrator": 15,
    "departmentLead": 30,
    "specialist": 60,
    "quality": 60
  }
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | true | Enable/disable the dispatcher |
| `scanIntervalMinutes` | integer | 5 | How often to scan for new tickets |
| `ticketBasePath` | string | "tickets" | Relative path to ticket directories |
| `routing.strategy` | string | "registry" | `registry`, `moe`, or `hybrid` |
| `routing.moeModelRef` | string | — | Model for MoE routing (if strategy uses it) |
| `pollingCadence.*` | integer | varies | Minutes between polls by role tier |

### 3.6 `gateway`

Gateway daemon configuration. See the full schema for all fields.

### 3.7 `channels`

Per-channel configuration (WhatsApp, iMessage, Telegram, Discord, etc.). Channels are extensible — unknown properties are allowed to support future channel types.

### 3.8 `hooks`, `plugins`, `skills`, `tools`, `broadcast`, `commands`, `session`

See schema file for complete field definitions. These sections are optional and have sensible defaults.

---

## 4. Validation

```bash
# Validate the current installation's openclaw.json
onxza config validate

# Verbose output
onxza config validate --verbose

# JSON output for automation
onxza config validate --json
```

Validation checks:
1. Valid JSON syntax
2. `$schemaVersion` present and recognized
3. Passes JSONSchema validation
4. Agent IDs are unique
5. Company slugs are unique
6. Agent `company` fields reference existing companies
7. Workspace paths exist on disk
8. Model references are well-formed

---

## 5. Migration

```bash
# Check current schema version
onxza config version

# Dry-run migration
onxza config migrate --dry-run

# Apply migration (creates checkpoint first)
onxza config migrate
```

See [SCHEMA-VERSIONING.md](./SCHEMA-VERSIONING.md) for full versioning strategy and migration system design.

---

## 6. Safety

`openclaw.json` is classified as **irreversible** per ARCHITECTURE.md Section 11.1. Any modification requires:
1. Checkpoint creation
2. Audit trail entry
3. Aaron confirmation (for manual edits; CLI commands handle this automatically)

The file should never be hand-edited directly in production. Use `onxza agent create`, `onxza company add`, or `onxza config migrate`.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

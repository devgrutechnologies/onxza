---
title: ONXZA Skills Marketplace API Contract
version: 0.1.0
status: DRAFT — stub implementation active
owner: DTP_ONXZA_CLI
created: 2026-03-18
tags: api, skills, marketplace, contract
summary: HTTP API contract for the ONXZA skills marketplace. Defines endpoints, request/response shapes, and auth requirements. Stub mode active until TICKET-DTP-013 delivers the backend.
---

# ONXZA Skills Marketplace API Contract

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 0.1.0 | **Status:** DRAFT — stub active | **Owner:** DTP_ONXZA_CLI  
**Backend ticket:** TICKET-20260318-DTP-013

---

## Base URL

```
https://api.onxza.com/v1/skills
```

Override via environment variable: `ONXZA_MARKETPLACE_URL`

---

## Stub Mode

Set `ONXZA_MARKETPLACE_STUB=true` to use stub responses without a live backend.  
This is the default until the marketplace backend is deployed (TICKET-DTP-013).

---

## Authentication

All write endpoints (publish) require a Bearer token:

```
Authorization: Bearer <token>
```

Set token via `--token <token>` CLI flag or `ONXZA_MARKETPLACE_TOKEN` env var.

---

## Endpoints

### GET `/skills/:name`

Fetch metadata for the latest version of a skill.

**Response — 200 OK:**
```json
{
  "name": "skill-fvp-verification",
  "version": "1.2.0",
  "owner": "DTP_ONXZA_Architect",
  "description": "FVP-001 verification protocol for agent output quality gating.",
  "scope": "global",
  "downloadUrl": "https://cdn.onxza.com/skills/skill-fvp-verification/1.2.0/skill.md",
  "created": "2026-01-10",
  "tags": ["fvp", "quality", "verification"]
}
```

**Response — 404 Not Found:**
```json
{ "error": "Skill not found" }
```

---

### GET `/skills/:name/:version`

Fetch metadata for a specific version.

Same response shape as above. Returns 404 if version does not exist.

---

### GET `/skills/:name/versions`

Fetch version history.

**Response — 200 OK:**
```json
{
  "name": "skill-fvp-verification",
  "versions": ["1.2.0", "1.1.0", "1.0.0"]
}
```

---

### POST `/skills`

Publish a new skill or new version of an existing skill.

**Request:** `multipart/form-data`
- `file` — the skill `.md` file (must pass TORI-QMD before submission)
- `name` — skill name slug (lowercase, hyphenated)
- `version` — semver string
- `scope` — `global` | `company`
- `description` — short description (max 200 chars)
- `tags` — comma-separated tag list

**Response — 202 Accepted:**
```json
{
  "status": "accepted",
  "message": "Skill queued for review.",
  "reviewId": "rev-20260318-00142"
}
```

**Response — 400 Bad Request:**
```json
{ "error": "TORI-QMD validation failed on server", "details": "missing: credit_line" }
```

**Response — 401 Unauthorized:**
```json
{ "error": "Invalid or missing auth token" }
```

---

## SkillMeta Shape

All skill endpoints return this object shape:

| Field | Type | Description |
|---|---|---|
| `name` | string | Unique skill slug (e.g. `skill-fvp-verification`) |
| `version` | string | Semver (e.g. `1.2.0`) |
| `owner` | string | Agent ID of the skill owner |
| `description` | string | Short description |
| `scope` | string | `global` or company code |
| `downloadUrl` | string \| null | Direct download URL for skill markdown |
| `created` | string | ISO date of first publication |
| `tags` | string[] | Search tags |

---

## Client Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ONXZA_MARKETPLACE_URL` | `https://api.onxza.com/v1/skills` | Override marketplace base URL |
| `ONXZA_MARKETPLACE_TOKEN` | — | Auth token for publish operations |
| `ONXZA_MARKETPLACE_STUB` | `true` | Use stub responses (no live backend) |
| `ONXZA_HOME` | `~/.onxza` | ONXZA home directory for registry |
| `ONXZA_WORKSPACE` | `~/.openclaw/workspace` | Workspace root for shared-learnings |

---

## Skill Registry

Installed skills are tracked in:

```
~/.onxza/skills/registry.json
```

Schema:
```json
{
  "version": 1,
  "skills": {
    "<skill-name>": {
      "name": "string",
      "installedVersion": "string",
      "scope": "global | company | DTP | ...",
      "installPath": "/absolute/path/to/skill.md",
      "installedAt": "ISO 8601",
      "tags": ["string"],
      "owner": "string"
    }
  }
}
```

Skills are installed to:
- `global` scope → `shared-learnings/global/skills/<skill-name>.md`
- Company scope → `shared-learnings/<COMPANY>/skills/<skill-name>.md`

---

## TORI-QMD Validation

Every skill is validated with TORI-QMD before installation and before publishing.

Required fields for skill documents:
- `**Version:**` or `version:` frontmatter
- `**Owner:**` or `owner:` frontmatter
- `**Created:**` or `**Last Updated:**` (or frontmatter equivalent)
- Credit line: `Imagined by Aaron Gear...`

Validation runs via `validate-tori-qmd.py` if present, with an inline fallback.

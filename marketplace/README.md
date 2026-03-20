---
title: ONXZA Skills Marketplace API
version: 0.1.0
owner: dtp-onxza-skillsmarketplace
created: 2026-03-18
status: READY FOR REVIEW
tags: marketplace, api, skills, backend
summary: REST API backend for the ONXZA skills marketplace — serves onxza skill install, list, and publish.
credit_line: "Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs."
---

# ONXZA Skills Marketplace API

**TICKET-20260318-DTP-013** | **Version:** 0.1.0 | **Status:** READY FOR REVIEW

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Overview

This is the backend API for the ONXZA skills marketplace. It powers:

- `onxza skill install <name>` — download and install a skill
- `onxza skill list --remote` — browse available skills
- `onxza skill publish <path>` — submit a skill for distribution

Deployed to: `api.onxza.com`

---

## API Reference

### `GET /api/v1/skills`

Returns a paginated list of published skills.

**Query params:**
| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `20` | Results per page (max 100) |
| `q` | — | Search by name or description |
| `tag` | — | Filter by tag |

**Response:**
```json
{
  "skills": [
    {
      "name": "weather",
      "version": "1.2.0",
      "description": "Get current weather and forecasts",
      "author": "devgru-technology-products",
      "tags": ["weather", "tools"],
      "updated_at": "2026-03-18T00:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

### `GET /api/v1/skills/:name`

Returns full metadata for a skill, including download URL.

**Query params:**
| Param | Default | Description |
|-------|---------|-------------|
| `version` | latest | Request a specific version |

**Response:**
```json
{
  "name": "weather",
  "description": "Get current weather and forecasts",
  "author": "devgru-technology-products",
  "tags": ["weather"],
  "latest_version": "1.2.0",
  "requested_version": "1.2.0",
  "download_url": "https://your-project.supabase.co/storage/v1/object/public/skills/weather/1.2.0/weather-1.2.0.tar.gz",
  "metadata": { "name": "weather", "version": "1.2.0", "owner": "devgru-technology-products" },
  "versions": [
    { "version": "1.2.0", "published_at": "2026-03-18T00:00:00Z", "publisher_username": "aaron" }
  ],
  "published_at": "2026-03-18T00:00:00Z"
}
```

---

### `POST /api/v1/skills/publish`

Publish a skill to the marketplace. **Requires authentication.**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:** `multipart/form-data` with field `tarball` — the skill `.tar.gz` archive.

**Response (201 Created):**
```json
{
  "message": "weather@1.2.0 published successfully.",
  "name": "weather",
  "version": "1.2.0",
  "download_url": "https://..."
}
```

**TORI-QMD validation errors (422):**
```json
{
  "error": "TORI-QMD validation failed",
  "message": "Skill did not pass quality validation.",
  "errors": [
    "SKILL.md frontmatter missing required field: credit_line",
    "SKILL.md version \"v1\" is not valid semver"
  ]
}
```

---

### `POST /api/v1/auth/register`

Create a publisher account.

**Body:** `{ "username": "...", "email": "...", "password": "..." }`

**Response (201):** `{ "token": "...", "username": "..." }`

---

### `POST /api/v1/auth/token`

Get a JWT for an existing account.

**Body:** `{ "username": "...", "password": "..." }`

**Response:** `{ "token": "..." }`

---

## TORI-QMD Validation Rules

Every skill submitted via `POST /skills/publish` is validated server-side:

1. **Archive must contain `SKILL.md`** — at root or one level deep
2. **`SKILL.md` must have YAML frontmatter** with these fields:
   - `version` — valid semver (e.g. `1.0.0`)
   - `owner` — author or organization
   - `credit_line` — must match exactly (see below)
   - `created` or `last_updated` — at least one date field
3. **Credit line must be exact:**
   ```
   Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
   ```
4. **No internal data** — archive is scanned for patterns that indicate company-internal credentials or workspace paths

---

## Setup

### 1. Install dependencies

```bash
cd marketplace
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials and JWT secret
```

### 3. Set up Supabase

1. Create a new Supabase project at https://supabase.com
2. Run `schema/supabase-schema.sql` in the SQL Editor
3. Create a Storage bucket named `skills` (public, 10 MB file size limit)
4. Copy your project URL and service role key to `.env`

### 4. Start the server

```bash
npm start          # production
npm run dev        # development (auto-restart)
```

### 5. Run tests

```bash
npm test
```

---

## Deployment (api.onxza.com)

Deploy as a standard Node.js process. Recommended:

- **Platform:** Railway, Render, or Fly.io (all support Node.js with env vars)
- **Process manager:** PM2 or the platform's built-in process management
- **Environment:** Set all env vars from `.env.example`
- **Domain:** Point `api.onxza.com` to the deployed service

Minimum viable deployment:

```bash
npm install --production
NODE_ENV=production npm start
```

---

## File Structure

```
marketplace/
├── src/
│   ├── index.js              Express app entry point
│   ├── routes/
│   │   ├── skills.js         GET /skills, GET /skills/:name, POST /skills/publish
│   │   └── auth.js           POST /auth/register, POST /auth/token
│   ├── lib/
│   │   ├── supabase.js       Supabase client
│   │   ├── auth.js           JWT middleware + token issuance
│   │   ├── storage.js        Skill tarball upload/download
│   │   └── tori-qmd.js       TORI-QMD validation (server-side)
│   └── middleware/
│       └── errors.js         404 + error handler
├── schema/
│   └── supabase-schema.sql   Database schema
├── .env.example
├── package.json
└── README.md
```

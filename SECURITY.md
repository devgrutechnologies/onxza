# Security Policy

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Repository Isolation — What Must NEVER Be Committed

This is a public repository. It contains ONLY ONXZA/FAAILS source code, documentation, and protocol specifications.

### NEVER commit any of the following:

**Credentials and secrets**
- API keys of any kind
- Passwords or tokens
- `.env` files or any file containing secrets
- Private keys or certificates

**DevGru internal business data**
- Any vision.md files from DevGru companies
- WDC, MGA, DTP, or any DevGru business strategy
- Client information or prospect data
- Revenue data or financial records
- CRM data

**Agent configuration**
- openclaw.json
- Agent workspace files (AGENTS.md, MEMORY.md, TOOLS.md, etc.)
- Any file from workspace-*/ directories

**Internal infrastructure**
- Ticket system contents
- Memory files or logs
- Pipeline queue files
- Anything from shared-learnings/ that contains project-specific data

---

## Two-Repo Architecture

| Repo | Contents | Visibility |
|---|---|---|
| `onxza` (this repo) | ONXZA/FAAILS source, docs, specs only | Public |
| `devgru-internal` | Everything else — all DevGru operations | Private, never public |

These two repos never touch. Never reference each other. Completely isolated.

---

## Reporting a Vulnerability

To report a security vulnerability in ONXZA, please email: security@onxza.com

Do not open a public GitHub issue for security vulnerabilities.

---

## Supported Versions

| Version | Supported |
|---|---|
| Latest | ✅ Yes |
| Older versions | See release notes |

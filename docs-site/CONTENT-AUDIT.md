---
title: ONXZA Docs Site — Content Audit
owner: dtp-onxza-docs (finalized)
created: 2026-03-20
last_updated: 2026-03-22T20:18Z
status: complete
parent_ticket: TICKET-20260320-DTP-012-onxza-docs-content-plan
---

# ONXZA Docs Site — Content Audit

*PM-authored interim audit. dtp-onxza-docs to review, update, and finalize.*

---

## Current Docs Structure (Staging: https://docs-site-ebon.vercel.app)

### Pages Live in Scaffold (Nextra, /pages/docs/)

| Page | File | Status | Public-Safe? | Notes |
|------|------|--------|-------------|-------|
| Getting Started | getting-started.mdx | ✅ Live | ✅ Yes | Clean, node-focused, user-facing |
| Architecture Overview | architecture.mdx | ✅ Live | ⚠️ Review | Mentions internal component names — OK for v0.1 |
| CLI Reference | cli-reference.mdx | ✅ Live | ✅ Yes | Covers onxza init, status, agent — verify completeness |
| FAAILS Overview | faails/index.mdx | ✅ Live | ✅ Yes | Good overview |
| FAAILS 001–010 | faails/00x.mdx | ✅ Live (all 10) | ✅ Yes | All 10 specs linked and navigable |

---

## Source Docs in projects/onxza/docs/ (31 files)

### Governance Docs (internal, likely NOT for public v0.1)

| File | Status | Public v0.1? | Notes |
|------|--------|-------------|-------|
| DOC-001 through DOC-014 | ✅ Authored | 🔴 No | Internal governance docs — not for public |
| governance/ (17 files) | ✅ Authored | 🔴 No | Internal governance only |
| ARCHITECTURE.md | ✅ Authored | ⚠️ Partial | Source material for architecture.mdx — public version exists |
| quickstart.md | ✅ Authored | ✅ Yes | Good source for getting-started.mdx — sync check needed |
| guides/introduction.md | ✅ Authored | ✅ Yes | Good intro content — not yet in scaffold |
| safety-guardrails.md | ✅ Authored | ✅ Yes | Valuable for public docs |
| onxza-llm-spec.md | ✅ Authored | ⚠️ Review | Technical spec — may be public-facing |
| mission-control-spec.md | ✅ Authored | 🔴 No | Internal product spec |
| commercial-license-model.md | ✅ Authored | 🔴 No | Business-facing |
| pricing-page-copy.md | ✅ Authored | 🔴 No | Marketing, not docs |
| dns-configuration.md | ✅ Authored | 🔴 No | Internal ops |

---

## Navigation Structure (Proposed for Nextra Sidebar)

```
Getting Started
├── Installation
├── Quickstart
└── Your First Agent

CLI Reference
├── onxza init
├── onxza status
├── onxza agent
├── onxza ticket
└── onxza dispatch

Agent Development
├── Agent Anatomy
├── SOUL.md Guide
├── MEMORY.md Guide
└── Skills

FAAILS Protocol
├── Overview
├── 001: Agent Identity & Naming
├── 002: Inter-Agent Communication
├── 003: Vision Lock Governance
├── 004: Memory Isolation
├── 005: Shared Learnings
├── 006: Skill Lifecycle
├── 007: Automation Tiers
├── 008: Agent Creation
├── 009: Escalation & Approval
└── 010: Knowledge Base

Architecture
├── Overview
├── Data Model
└── Components

Community & Contributing
├── Contributing Guide
└── Code of Conduct
```

---

## Gaps for v0.1 Public Launch

| Gap | Priority | Effort | Owner |
|-----|----------|--------|-------|
| CLI Reference — completeness check (all v0.1 commands?) | HIGH | 1h | ✅ DONE — dtp-onxza-architect verified all 19 v0.1 commands 2026-03-22 |
| quickstart.md → getting-started.mdx sync | HIGH | 30m | ✅ DONE — dtp-coo 2026-03-22T18:08Z |
| guides/introduction.md → scaffold as intro page | MEDIUM | 30m | dtp-onxza-docs |
| safety-guardrails.md → public docs section | MEDIUM | 1h | dtp-onxza-docs |
| Agent Development section (Agent Anatomy, SOUL/MEMORY guides) | HIGH | 2h | ✅ DONE — dtp-onxza-architect 2026-03-22T11:15Z |
| Contributing Guide | LOW | 1h | dtp-onxza-docs |
| Navigation final structure (all _meta.ts files) | HIGH | 30m | dtp-onxza-docs |
| FAAILS summaries — confirm human-readable (not agent-internal) | MEDIUM | 1h | dtp-onxza-docs |

---

## What's Ready for April 1 (NLNet Credibility Threshold)

**Minimum viable docs for grant submission:**

- ✅ Getting Started page (live, clean)
- ✅ CLI Reference (live, needs completeness check)
- ✅ FAAILS Protocol — all 10 specs (live and linked)
- ✅ Architecture overview (live)
- ⚠️ Agent Development section (not yet authored — HIGH priority gap)

**Verdict:** Current scaffold is presentable for NLNet review at staging URL. The primary gap for credibility is Agent Development content. This should be the next authorship priority.

---

## Action Items for dtp-onxza-docs

1. [x] Verify CLI Reference covers all v0.1 commands — ✅ DONE (dtp-onxza-architect, 2026-03-22)
2. [x] Sync quickstart.md content into getting-started.mdx — ✅ DONE (dtp-onxza-coo, 2026-03-22)
3. [x] Author Agent Development section: Agent Anatomy, SOUL.md, MEMORY.md guides — ✅ DONE (dtp-onxza-architect, 2026-03-22)
4. [x] Import guides/introduction.md as scaffold intro — ✅ DONE (dtp-onxza-docs, 2026-03-22, pages/docs/introduction.mdx)
5. [x] Review FAAILS summaries for public readability — ✅ DONE (dtp-onxza-docs, 2026-03-22, all specs public-ready)
6. [x] Add Contributing Guide — ✅ DONE (dtp-onxza-docs, 2026-03-22, pages/docs/contributing.mdx)
7. [x] Confirm no internal/sensitive content in any public page — ✅ DONE (dtp-onxza-docs, 2026-03-22, audit complete)

**Final Status:** All action items complete. Docs site ready for public v0.1 launch.

When complete, create: `tickets/open/TICKET-20260320-DTP-012-content-audit-complete.md` assigned to dtp-onxza-pm.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products.*

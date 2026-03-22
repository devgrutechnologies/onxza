---
title: ONXZA v0.2.0 — Release Plan
version: draft
owner: dtp-onxza-pm
created: 2026-03-22
status: PLANNING
tags: release, v0.2.0, milestone, sprint, planning
summary: v0.2.0 release plan — M1 completion criteria, Sprint 3 scope, and explicit out-of-scope definition.
credit_line: present
---

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

# ONXZA v0.2.0 — Release Plan

**Target:** Day 30 (approx. April 21, 2026 based on Day 0 = March 22, 2026)  
**Theme:** Public Launch + CLI Foundation  
**Milestone:** M1 complete

---

## Release Criteria

All must be TRUE before tagging v0.2.0:

### CLI
- [ ] `onxza init` works on macOS (arm64 + x86_64) and Linux (Ubuntu 22+) on a clean path
- [ ] `onxza agent create <Company_Dept_Role>` produces all 6 agent files, passes TORI-QMD
- [ ] `onxza agent list` shows all registered agents in openclaw.json with status
- [ ] `onxza agent validate <id>` passes TORI-QMD on valid agents, fails with clear errors on invalid
- [ ] `onxza tickets` lists open/pending/closed ticket counts + filtering by `--status`, `--assigned-to`
- [ ] `onxza status` shows system health (agent count, ticket counts, CI status)
- [ ] `onxza dashboard` TUI launches and auto-refreshes without crashing

### Distribution
- [ ] `npm install -g onxza@0.2.0` works (npm publish complete)
- [ ] GitHub CI passes on every push to main
- [ ] GitHub Actions auto-publish workflow on `git tag v*` (DAILY-16)

### Documentation
- [ ] Docs site live at `onxza.com/docs` or staging URL accessible
- [ ] Quickstart: developer can reach `onxza agent create` in under 10 minutes from cold start ✅ (DAILY-5 complete)
- [ ] CLI Reference covers all implemented commands ✅ (already complete)
- [ ] FAAILS overview accessible to new developers ✅ (DAILY-7 complete)

### Quality
- [ ] TORI-QMD validation runs as pre-commit hook on all `.md` files
- [ ] No open P1 bugs in GitHub issues
- [ ] Security scan passes (`onxza security scan`)

### Community Signal
- [ ] 100+ GitHub stars (soft gate — does not block tag, but track)
- [ ] GitHub Discussions + Issues enabled ✅
- [ ] README badges present ✅ (DAILY-9 complete)

---

## Sprint 3 Scope (Days 22–30)

Sprint 3 = Docs + Onboarding + Distribution polish. These are the exact tickets in scope:

| Ticket | Summary | Owner | Status |
|---|---|---|---|
| DTP-010 | Public docs site at onxza.com/docs | dtp-onxza-docs | In progress |
| DTP-035 | Quickstart guide: zero → first agent in 10 min | dtp-onxza-pm | ✅ Complete (DAILY-5) |
| DTP-007 | `onxza company` command group | dtp-onxza-cli | Open |
| DTP-009 | npm package: `npm install -g onxza` | dtp-onxza-cli | In progress |
| DTP-034 | One-line install script at get.onxza.com | dtp-onxza-architect | Blocked (needs Aaron domain) |
| DAILY-9 | README badges + social proof | dtp-onxza-pm | ✅ Complete |
| DAILY-7 | CLI Reference + FAAILS docs section | dtp-onxza-pm | ✅ Complete |
| DAILY-16 | GitHub Actions auto-publish on git tag | dtp-onxza-architect | Open |

**Sprint 3 dependencies:**
- `get.onxza.com` install script blocked on Aaron DNS for onxza.com
- npm publish blocked on Aaron creating npm org account

---

## What Does NOT Ship in v0.2.0

Explicit out-of-scope. If it's on this list, it doesn't block the v0.2.0 tag:

- MoE routing engine (DTP-019) — Sprint 4
- Vision lock enforcement runtime (DTP-020) — Sprint 4
- Checkpoint system (DTP-021) — Sprint 4
- Audit trail system (DTP-022) — Sprint 4
- Dispatcher / cron-based ticket scanner (DTP-024) — Sprint 4
- Mission Control hosted dashboard — Sprint 6
- Skills marketplace (browse + publish) — Sprint 7
- ONXZA-LLM v0.1 — Sprint 10 (M3)
- Enterprise billing integration — M2/M3
- Windows support — not planned for M1
- `get.onxza.com` install script (blocked on Aaron DNS) — may slip to v0.3.0

---

## v0.3.0 Preview (Sprint 4, Days 31–45)

What immediately follows v0.2.0:

- MoE routing engine — intelligent task dispatch
- Vision lock enforcement runtime
- Checkpoint system before irreversible actions
- Audit trail system (append-only)
- Dispatcher / cron-based ticket scanner (enables fully automated agent companies)

---

## Go/No-Go Decision

**Decision maker:** DTP_CEO (Aaron)  
**Decision date:** Day 29 (April 20, 2026)  
**Go criteria:** All Release Criteria checked. Aaron confirms npm org account active.  
**No-go triggers:** CLI crashes on clean macOS/Linux path, npm publish fails, docs site inaccessible.

---

## Post-Release Checklist (Day 30+)

- [ ] Tag `v0.2.0` on main
- [ ] `npm publish onxza@0.2.0`
- [ ] GitHub Release created with CHANGELOG
- [ ] HN Show HN post (DAILY-8 package — awaiting Aaron approval)
- [ ] Reddit r/MachineLearning post (DAILY-12 package — awaiting Aaron approval)
- [ ] Reddit r/LocalLLaMA post (48h after r/ML)
- [ ] Update ROADMAP.md: M1 status → COMPLETE

---

*Release Plan owner: DTP_ONXZA_PM — 2026-03-22. Review with DTP_CEO before Day 25.*

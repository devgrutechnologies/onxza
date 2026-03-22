---
title: ONXZA Product Roadmap — v0.1.0 to v1.0.0
version: 1.1.0
status: active
created: 2026-03-18
last_updated: 2026-03-22
owner: DTP_ONXZA_PM
tags: roadmap, milestones, sprint, planning, v1, onxza
summary: Official ONXZA product roadmap. 30/90/180-day milestones sequencing v0.1.0 public launch through v1.0.0 production release. Maps all 36 backlog tickets to milestones, identifies critical path, Aaron-required items, and quick wins.
credit_line: present
---

# ONXZA Product Roadmap
## v0.1.0 → v1.0.0

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Owner:** DTP_ONXZA_PM  
**Last Updated:** 2026-03-18  
**Baseline:** v0.1.0 released (architecture + governance). CLI and runtime in active development.

---

## North Star

> ONXZA is the default operating system for AI-native companies.
> v1.0.0 ships in 180 days. It is production-ready, publicly installable, commercially licensed, and running on 100+ external installations.

---

## Milestone Summary

| Milestone | Version | Target | Theme |
|---|---|---|---|
| M1 | v0.2.0 | Day 30 | **Public launch + CLI foundation** |
| M2 | v0.5.0 | Day 90 | **Functional platform + community** |
| M3 | v1.0.0 | Day 180 | **Production release + commercial** |

---

## M1 — v0.2.0 — Day 30
### Theme: Public Launch + CLI Foundation

The repo is live. Developers can install ONXZA, initialize a project, and create their first agent. Community momentum starts here.

**Definition of Done:** `npm install -g onxza && onxza init && onxza agent create` works end-to-end. GitHub repo is live with CI passing. Documentation site is live. Install script accessible.

### Aaron-Required (must happen first)

| Ticket | Action | Decision Needed By |
|---|---|---|
| **DTP-011** | Provide GitHub PAT (repo + workflow scope) → push repo | **Day 1** |
| **DTP-031** | Log into Vercel, create onxza.com + faails.com projects, update GoDaddy DNS | Day 3 |
| **DTP-036** | Define commercial license tiers and pricing (starter/pro/enterprise) | Day 14 |

### Sprint 1 (Days 1–7): Ship the Repo + Platform Foundation

| Ticket | Summary | Priority | Blocks |
|---|---|---|---|
| **DTP-011** ✅ ready | Push ONXZA v0.1.0 to GitHub | HIGH | Everything |
| **DTP-031** ✅ ready | DNS: onxza.com + faails.com → Vercel | HIGH | DTP-010, DTP-034 |
| **DTP-032** | Global standard agent template | HIGH | DTP-003 |
| **DTP-026** | Harden TORI-QMD validator to production | HIGH | CI reliability |
| **DTP-037** | Security hardening: irreversibility, CONFIRM/CANCEL, secret scanning | HIGH | All runtime work |

### Sprint 2 (Days 8–21): CLI Core

| Ticket | Summary | Priority | Blocks |
|---|---|---|---|
| **DTP-002** | `onxza init` command | HIGH | DTP-003, DTP-005 |
| **DTP-003** | `onxza agent create` command | HIGH | Agent onboarding |
| **DTP-004** | `onxza agent list` + `validate` | MEDIUM | DTP-008 |
| **DTP-005** | `onxza tickets` command | HIGH | Operator UX |
| **DTP-009** | npm package: `npm install -g onxza` | HIGH | Distribution |
| **DTP-034** | One-line install script at get.onxza.com | HIGH | Developer onboarding |

### Sprint 3 (Days 22–30): Docs + Onboarding

| Ticket | Summary | Priority | Blocks |
|---|---|---|---|
| **DTP-010** | Public docs site at onxza.com/docs | HIGH | Community growth |
| **DTP-035** | Quickstart guide: zero → first agent in 10 min | MEDIUM | Developer adoption |
| **DTP-007** | `onxza company` command group | MEDIUM | Multi-company UX |

### M1 Quick Wins (no Aaron input, ships fast)
- **DTP-032** — Global agent template: pure file creation, no dependencies, immediate value for any new ONXZA user
- **DTP-026** — TORI-QMD validator: already working, just needs hardening
- **DTP-035** — Quickstart guide: pure writing, ships in hours
- **DTP-037** — Security hardening: critical path for all runtime work, agents can run in parallel

### M1 Success Metrics
- GitHub stars: 100+
- npm installs: 50+
- CI passing on every push
- `onxza init` works on macOS and Linux
- Documentation live at onxza.com/docs

---

## M2 — v0.5.0 — Day 90
### Theme: Functional Platform + Community

ONXZA is a real product. Developers run it in production. Mission Control is live. Skills marketplace has its first 20 community skills. First external companies have onboarded.

**Definition of Done:** Full CLI functional. Mission Control dashboard running. Skills marketplace browseable. MPI collecting real data. First 3 external companies running on ONXZA. FAAILS sections 1–5 finalized.

### Sprint 4 (Days 31–45): Runtime Engine

| Ticket | Summary | Priority | Blocks |
|---|---|---|---|
| **DTP-019** (MoE) | MoE routing engine | HIGH | Intelligent task dispatch |
| **DTP-020** (Vision Lock) | Vision lock enforcement runtime | HIGH | Intent preservation |
| **DTP-021** (Checkpoint) | Checkpoint system before irreversible actions | HIGH | Safety |
| **DTP-022** | Audit trail system (append-only) | HIGH | Trust + compliance |
| **DTP-024** | Dispatcher / cron-based ticket scanner | HIGH | Agent automation |

### Sprint 5 (Days 46–60): Memory + Agent Lifecycle

| Ticket | Summary | Priority | Blocks |
|---|---|---|---|
| **DTP-023** | Shared learnings runtime + promotion pipeline | MEDIUM | Knowledge accumulation |
| **DTP-028** | Memory isolation enforcement layer | MEDIUM | PRIVATE memory safety |
| **DTP-029** | Agent lifecycle management + retirement pipeline | MEDIUM | Operational scale |
| **DTP-038** | CDP board session runtime (vision intake) | MEDIUM | New company onboarding |
| **DTP-039** | Automated session memory logging | MEDIUM | Observability |

### Sprint 6 (Days 61–75): Mission Control + Dashboard

| Ticket | Summary | Priority | Blocks |
|---|---|---|---|
| **DTP-012** | Mission Control web frontend (Next.js) | HIGH | Operator visibility |
| **DTP-008** | `onxza status` + TUI dashboard | HIGH | CLI operators |
| **DTP-025** | `onxza script` command group | MEDIUM | Automation tier UX |

### Sprint 7 (Days 76–90): MPI + Skills + Community

| Ticket | Summary | Priority | Blocks |
|---|---|---|---|
| **DTP-018** | MPI logging architecture | HIGH | MPI backend |
| **DTP-019** (MPI backend) | MPI backend + Supabase | HIGH | Data collection |
| **DTP-020** (MPI CLI) | `onxza mpi report` command | HIGH | Operator reporting |
| **DTP-021** (MPI dashboard) | MPI panel in Mission Control | HIGH | Visibility |
| **DTP-017** | MPI data collection automation | HIGH | Benchmark accuracy |
| **DTP-014** | Skills marketplace web UI | MEDIUM | Community contributions |
| **DTP-036** | Commercial license model (Aaron required) | MEDIUM | Revenue |

### M2 Success Metrics
- 3 external companies running on ONXZA
- 20+ skills in marketplace
- MPI collecting real data from running installations
- Mission Control dashboard live
- GitHub stars: 500+

---

## M3 — v1.0.0 — Day 180
### Theme: Production Release + Commercial

ONXZA v1.0.0 is production-ready. Cloud platform live. Commercial licensing active. ONXZA-LLM v0.1 on HuggingFace. FAAILS recognized as an emerging open standard. 100+ external installations.

### Sprint 8–12 (Days 91–180): Production Hardening + Commercial

| Ticket | Summary | Priority | Target Sprint |
|---|---|---|---|
| **DTP-033** | ONXZA-LLM v0.1 (mini/standard/pro) on HuggingFace | MEDIUM | S10 (Day 150) |
| **DTP-036** | Commercial license model finalized + published | MEDIUM | S8 (Day 100) |
| **DTP-RESEARCH-BRIEF-001** | DTP competitive landscape — top 5 agent frameworks | HIGH | S8 (Day 95) |
| Cloud platform (new ticket) | Hosted ONXZA — SaaS offering | HIGH | S9–10 |
| FAAILS 6–10 (new tickets) | Remaining 10 protocol sections | MEDIUM | S9–11 |
| 100 installs milestone (ops) | Onboarding support + install telemetry | HIGH | S11 |

### M3 Success Metrics
- v1.0.0 tagged and released
- Cloud platform live (hosted ONXZA)
- Commercial licensing generating revenue
- 100+ external installations
- ONXZA-LLM v0.1 on HuggingFace
- FAAILS sections 1–10 published
- GitHub stars: 2,000+

---

## Critical Path

The single chain that everything else depends on:

```
Aaron provides GitHub PAT (DTP-011)
  → Git push to GitHub
    → Vercel project created (DTP-031)
      → onxza.com live
        → npm package published (DTP-009)
          → Install script at get.onxza.com (DTP-034)
            → Developer onboarding begins (DTP-035)
              → Community growth
                → First external companies
                  → MPI has real data
                    → v1.0.0
```

**The entire roadmap starts with Aaron providing the GitHub token.** Everything else is sequenced from there. No other blocker is as urgent.

### Secondary Critical Path (runtime):

```
DTP-037 (security hardening)
  → DTP-002 (onxza init)
    → DTP-003 (agent create)
      → DTP-024 (dispatcher)
        → DTP-019 MoE (routing engine)
          → DTP-020 vision lock
            → DTP-021 checkpoint
              → Production runtime complete
```

---

## Aaron-Required Items Summary

| Ticket | Item | Window | Impact if Delayed |
|---|---|---|---|
| **DTP-011** | GitHub PAT — push repo | **Now (Day 0)** | Entire roadmap blocked |
| **DTP-031** | Vercel setup + GoDaddy DNS update | Day 1–3 | onxza.com dead |
| **DTP-036** | Commercial license tier/pricing decisions | Day 14 | Revenue model undefined at launch |

Only 3 items require Aaron. The other 33 tickets are agent-executable.

---

## Quick Wins (ships in days, no Aaron input, high community impact)

| Ticket | What ships | Impact |
|---|---|---|
| **DTP-032** | Global agent template | Any new user gets a production-ready agent in seconds |
| **DTP-026** | TORI-QMD validator hardened | CI fully reliable, contributes to community trust |
| **DTP-035** | Quickstart guide | "Zero to first agent in 10 minutes" — #1 conversion driver |
| **DTP-037** | Security hardening | Makes ONXZA safe to run in production environments |
| **DTP-002** | `onxza init` | The "hello world" of the CLI |

---

## Sprint Cadence Recommendation

**2-week sprints.** 6 sprints to M2 (90 days). Then 5 more to M3 (180 days).

| Sprint | Days | Focus |
|---|---|---|
| S1 | 1–7 | Ship the repo + platform foundation |
| S2 | 8–21 | CLI core |
| S3 | 22–30 | Docs + onboarding |
| S4 | 31–45 | Runtime engine |
| S5 | 46–60 | Memory + agent lifecycle |
| S6 | 61–75 | Mission Control + dashboard |
| S7 | 76–90 | MPI + skills + community |
| S8–12 | 91–180 | Production hardening + commercial |

Sprint reviews happen at the end of each sprint. DTP_ONXZA_PM generates a `platform_status_report` for DTP_CEO.

---

## Ticket-to-Milestone Map (Full Index)

| Ticket ID | Summary (short) | Milestone | Sprint |
|---|---|---|---|
| DTP-002 | `onxza init` | M1 | S2 |
| DTP-003 | `onxza agent create` | M1 | S2 |
| DTP-004 | `onxza agent list/validate` | M1 | S2 |
| DTP-005 | `onxza tickets` | M1 | S2 |
| DTP-007 | `onxza company` | M1 | S3 |
| DTP-008 | `onxza status` + TUI | M2 | S6 |
| DTP-009 | npm package | M1 | S2 |
| DTP-010 | Docs site | M1 | S3 |
| DTP-011 | GitHub push (in-progress) | M1 | S1 |
| DTP-012 | Mission Control frontend | M2 | S6 |
| DTP-014 | Skills marketplace UI | M2 | S7 |
| DTP-017 | MPI data collection automation | M2 | S7 |
| DTP-018 | MPI logging architecture | M2 | S7 |
| DTP-019 (MoE) | MoE routing engine | M2 | S4 |
| DTP-019 (MPI backend) | MPI backend + Supabase | M2 | S7 |
| DTP-020 (Vision Lock) | Vision lock enforcement | M2 | S4 |
| DTP-020 (MPI CLI) | `onxza mpi report` | M2 | S7 |
| DTP-021 (Checkpoint) | Checkpoint system | M2 | S4 |
| DTP-021 (MPI dashboard) | MPI Mission Control panel | M2 | S7 |
| DTP-022 | Audit trail system | M2 | S4 |
| DTP-023 | Shared learnings runtime | M2 | S5 |
| DTP-024 | Dispatcher / cron scanner | M2 | S4 |
| DTP-025 | `onxza script` commands | M2 | S6 |
| DTP-026 | TORI-QMD validator hardening | M1 | S1 |
| DTP-028 | Memory isolation runtime | M2 | S5 |
| DTP-029 | Agent lifecycle + retirement | M2 | S5 |
| DTP-031 | DNS (in-progress) | M1 | S1 |
| DTP-032 | Global agent template | M1 | S1 |
| DTP-033 | ONXZA-LLM HuggingFace | M3 | S10 |
| DTP-034 | Install script get.onxza.com | M1 | S2 |
| DTP-035 | Quickstart guide | M1 | S3 |
| DTP-036 | Commercial license model | M2/M3 | S7/S8 |
| DTP-037 | Security hardening | M1 | S1 |
| DTP-038 | CDP board session runtime | M2 | S5 |
| DTP-039 | Session memory logging | M2 | S5 |
| DTP-040 | Roadmap (this document) | M1 | S1 |
| DTP-RESEARCH-BRIEF-001 | Competitive landscape | M3 | S8 |

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

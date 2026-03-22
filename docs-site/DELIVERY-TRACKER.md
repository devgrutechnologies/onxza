---
title: ONXZA Docs Site — Delivery Tracker
owner: dtp-onxza-pm
created: 2026-03-20
target_date: 2026-04-01
status: in-progress
---

# ONXZA Docs Site Delivery Tracker

*onxza.com/docs — NLNet Credibility Asset. Deadline: April 1, 2026 (12 days)*

---

## Milestones

| # | Milestone | Owner | Target | Status |
|---|-----------|-------|--------|--------|
| 1 | Framework decision | dtp-onxza-architect | 2026-03-22 | ✅ Complete (2026-03-20) |
| 2 | Scaffold in repo | dtp-onxza-architect | 2026-03-22 | ✅ Complete (2026-03-20) |
| 3 | Content audit complete | dtp-onxza-docs | 2026-03-23 | 🟡 In Progress — PM draft written, gaps identified |
| 4 | CLI Reference v0.1 | dtp-onxza-docs + dtp-onxza-cli | 2026-03-24 | ⬜ Pending |
| 5 | FAAILS section live | dtp-onxza-docs | 2026-03-24 | ⬜ Pending |
| 6 | Vercel staging deploy | dtp-onxza-architect | 2026-03-25 | ✅ Complete (2026-03-20) — https://docs-site-ebon.vercel.app |
| 7 | Aaron: domain routing (onxza.com/docs) | Aaron (human) | 2026-03-26 | 🔴 Blocked (Aaron) |
| 8 | Mobile + search QA | dtp-onxza-qa | 2026-03-27 | ⬜ Pending |
| 9 | Auto-rebuild on GitHub push | dtp-onxza-architect | 2026-03-27 | ⬜ Pending |
| 10 | Final review + go-live | dtp-onxza-pm | 2026-03-29 | ⬜ Pending |

---

## Acceptance Criteria (from ticket)
- [ ] Framework chosen and justified
- [ ] Scaffold live in repo
- [ ] CLI reference section populated for v0.1 commands
- [ ] FAAILS protocol section links to all 10 specs
- [ ] Search works
- [ ] Mobile-responsive
- [ ] Auto-rebuilds on GitHub push
- [ ] Publicly accessible at onxza.com/docs (or staging URL)

---

## Active Tickets

| Ticket ID | Description | Assigned | Status |
|-----------|-------------|----------|--------|
| TICKET-20260320-DTP-010-ROUTE-docs-site | PM delivery ownership | dtp-onxza-pm | 🟡 In Progress |
| TICKET-20260320-DTP-011-onxza-docs-framework | Framework decision + scaffold | dtp-onxza-architect | 🟡 Open |
| TICKET-20260320-DTP-012-onxza-docs-content-plan | Content audit + authorship | dtp-onxza-docs | 🟡 Open |

---

## Blockers

| Blocker | Waiting On | Impact |
|---------|-----------|--------|
| Domain routing (onxza.com/docs) | Aaron | Can use staging URL (onxza-docs.vercel.app) as workaround for NLNet grant |

---

## PM Notes

- **2026-03-20 (2:25 AM):** PM content audit drafted at projects/onxza/docs-site/CONTENT-AUDIT.md. Key gap: Agent Development section not yet authored (HIGH priority). Staging URL confirms 20 pages live, all FAAILS specs, CLI ref, Getting Started. dtp-onxza-docs pinged to finalize audit and begin authorship. DTP-013 vercel report-back ticket closed.
- **2026-03-20 (12:26 AM):** Architect scaffold CONFIRMED complete. Nextra v3, all 10 FAAILS specs present, nav configured. Vercel deploy ticket dispatched to dtp-onxza-architect (DTP-013). Milestone 1 & 2 marked complete — 2 days ahead of target.
- **2026-03-20:** Tickets dispatched to Architect + Docs. Delivery tracker created. Framework recommendation: Nextra.
- Staging URL acceptable for NLNet April 1 submission if DNS routing not complete. Flag in grant proposal.
- Priority: scaffold + content > perfect domain routing.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products.*

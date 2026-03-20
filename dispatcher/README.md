---
title: ONXZA Dispatcher
version: 1.0.0
owner: dtp-onxza-router
created: 2026-03-18
status: ACTIVE
tags: dispatcher, cron, inter-agent-communication, faails-002, architecture
summary: Central ticket scanning and agent notification engine. Runs every 5 minutes via OpenClaw cron. Implements ARCHITECTURE.md §6.5.
credit_line: "Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs."
---

# ONXZA Dispatcher

**The inter-agent communication nervous system.**

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## What It Does

The ONXZA Dispatcher is the central automation that makes agents aware of their work. Without it, agents don't know they have tickets. With it, every ticket gets delivered to the right agent at the right cadence — automatically.

Every 5 minutes, the dispatcher:
1. Scans `tickets/open/` for all open tickets
2. Reads the `assigned_to` field from each ticket's frontmatter
3. Applies cadence rules to avoid over-notifying
4. Delivers a `TICKET_ASSIGNED` notification file to each eligible agent's inbox
5. Tracks delivery state to prevent duplicate notifications
6. Writes health status for `onxza dispatcher status`

---

## Files

```
dispatcher/
├── README.md           This document
├── dispatcher.py       Main dispatcher script (Python 3.8+)
├── state.json          Delivery state (auto-generated, do not edit manually)
├── status.json         Health status (auto-generated, read by CLI)
└── dispatcher.log      Run log (append-only)
```

---

## Agent Polling Cadence

Per ARCHITECTURE.md §6.5:

| Role Tier              | Cadence           | Pattern Match           |
|------------------------|-------------------|-------------------------|
| Marcus / Orchestrator  | Continuous        | `marcus`, `mg-parent-orchestrator` |
| CEO / COO Agents       | Every 15 minutes  | `*-ceo`, `*-coo`        |
| Department PMs         | Every 30 minutes  | `*-pm`                  |
| QualityDirector / QA   | Every 60 minutes  | `*-qualitydirector`, `*-qa`, `*-verification` |
| Specialists (default)  | On-task-completion | All others              |

Specialists receive delivery on every run (cadence interval = 0). They self-gate via `TASK_STATE: ACTIVE/IDLE` in their own MEMORY.md.

---

## Notification Format

Delivered to: `~/.openclaw/workspace-{agent-id}/inbox/TICKET_ASSIGNED-{ticket-id}-{timestamp}.md`

```markdown
# TICKET_ASSIGNED

**Ticket ID:** TICKET-YYYYMMDD-NNN
**Priority:** high
**Assigned To:** agent-id
**File:** filename.md

## Summary
...

## Action Required
Check TASK_STATE — if IDLE, begin work. If ACTIVE, queue for next slot.
```

---

## CLI Commands

```bash
# Health status
onxza dispatcher status

# Trigger immediately
onxza dispatcher run

# Preview what would be dispatched (no delivery)
onxza dispatcher dry-run

# Tail log
onxza dispatcher logs
onxza dispatcher logs --lines 100
```

---

## Cron Configuration

Runs every 5 minutes via OpenClaw cron (job ID: `74f63ee8-37d2-4ca1-bdbf-683629cad589`).
Schedule: `*/5 * * * *` (America/Los_Angeles)
Model: `claude-haiku-4-5` (cost-efficient — this is Tier 3 work)

---

## Error Handling

- Missing or corrupt ticket files: logged as WARN, skipped (never crash)
- Workspace not found for agent: logged as ERROR, delivery failed (ticket ID tracked)
- State file corrupt: logged as WARN, starts fresh (safe restart)
- All errors kept in `state.json` (last 50) and surfaced by `onxza dispatcher status`

---

## Implementation Notes

**TICKET-20260318-DTP-024** — Built by `dtp-onxza-router`.

This is a Tier 2/3 system — Python script handles all mechanics, OpenClaw cron provides scheduling. No LLM tokens consumed for dispatch logic itself.

The primary delivery mechanism (inbox files) is an interim implementation. Future versions will use direct OpenClaw session messaging (`sessions_send`) once the agent session API is stable across all agent workspaces.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

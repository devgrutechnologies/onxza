---
doc_id: ONXZA-DOC-011
title: Disaster Recovery and System Resilience
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: disaster-recovery, resilience, failure, recovery, agent-crash, backup
summary: How ONXZA responds to failures at every level — single agent, project manager, orchestrator, storage, and security incidents. Failure scenarios, response procedures, and resilience design principles.
---

# ONXZA Disaster Recovery and System Resilience

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0

---

## Core Resilience Principle

**No single point of failure.** All critical knowledge lives in documents, not in agent runtime memory. Any agent can be rebuilt from its design document, skill MDs, and `IDENTITY.md`. Losing an agent does not lose the vision — because the vision lives in `vision.md`, not inside the agent.

---

## Failure Scenarios and Responses

### Scenario 1 — Single Agent Failure

**Definition:** One specialist agent stops responding or produces consistently wrong output.

**Detection:** PM notices no ticket activity, failed FVP verification, or repeated bad output.

**Response:**
1. PM pauses tasks assigned to the agent.
2. PM creates `escalation` ticket to Orchestrator.
3. Orchestrator notifies Agent Developer to assess.
4. Agent Developer: attempt restart → if failed, rebuild from design document.
5. Memory is preserved from last successful write.
6. Tasks reassigned once the agent is confirmed healthy.

**Recovery time target:** Within 1 active cycle for standard agents.

---

### Scenario 2 — Project Manager Failure

**Definition:** PM agent stops responding or is producing systematically wrong plans.

**Detection:** Orchestrator notices no phase reports, agents going idle, or vision drift in outputs.

**Response:**
1. Orchestrator pauses the project.
2. Notifies the primary agent.
3. Primary agent notifies owner if the project is high priority.
4. Agent Developer rebuilds PM from design document + `vision.md` + `project-context.md`.
5. New PM ingests all existing context and resumes.

**Note:** Specialist agents continue their current tasks. The project pauses for new assignments only.

---

### Scenario 3 — Orchestrator Failure

**Definition:** Orchestrator is unresponsive or routing incorrectly across projects.

**Response:**
1. Primary agent detects via monitoring.
2. Primary agent pauses all new vision handoffs.
3. Notifies owner.
4. Agent Developer rebuilds Orchestrator.
5. **All active projects continue under their existing PMs** — no work stops.
6. No new projects start until Orchestrator is confirmed healthy.

---

### Scenario 4 — Local Storage Failure

**Definition:** The `~/.openclaw/` directory is corrupted or lost.

**Recovery:**
1. Stop all agent operations immediately.
2. Restore from GitHub backup.
3. The most recent Git commit is the recovery point.
4. Memory written since the last commit is lost — acceptable because commit frequency is designed for this.
5. Review what was lost and manually restore critical items from any available source.
6. Resume operations.
7. **Post-incident:** Increase commit frequency to reduce future recovery gap.

---

### Scenario 5 — Git / GitHub Failure

**Definition:** GitHub is inaccessible or the repository is corrupted.

**Response:**
- Local is the source of truth — GitHub is backup only.
- Operations continue without GitHub access.
- Once restored, push all local commits.
- If both local and GitHub are lost → owner decides reconstruction priority.

**Prevention:** Local commits are made frequently. Do not let more than a few hours of work go uncommitted.

---

### Scenario 6 — Critical Security Incident

**Definition:** Active breach, credential exposure, or data exfiltration.

**Response:** See [Security Protocols](security-protocols.md) Section 6 — Incident Response. Security incidents follow a different chain and override normal task execution.

---

## Resilience Design Principles

### No Single Point of Failure
- All critical knowledge is in documents, not agent runtime memory.
- Any agent can be rebuilt from its design document, skill MDs, and identity file.
- `vision.md` is the persistent source of truth — losing an agent doesn't lose the vision.
- Git history preserves every version of every document.

### Graceful Degradation
- If a specialist agent is down, the PM creates an `agent_unavailable` flag and queues dependent tasks.
- **The project slows, it does not stop.**
- The owner is notified only for SEV-1/SEV-2 failures or prolonged outages.
- Other agents continue their current tasks unaffected.

### Recovery Documentation
After every recovery event, a post-incident report is written to `logs/incidents/` with:
- What failed
- Why it failed
- How it was recovered
- What was lost (data, time, work)
- What changes prevent recurrence

**Post-incident reports are never deleted.** They are the institutional memory of how the system improves over time.

---

## Agent Crash Recovery — Automated Detection

The QualityDirector agent monitors for stale TASK_STATE values. If an agent's `TASK_STATE` shows ACTIVE for more than 2× the expected task duration:

1. QualityDirector creates an `agent_recovery` ticket assigned to the project PM.
2. PM reviews the last checkpoint for that agent.
3. PM decides: resume from checkpoint or restart from the beginning.
4. Recovery ticket includes: agent-id, task-id, last checkpoint, PM recommendation.

**No agent failure goes undetected for more than one monitoring cycle.**

---

## Checkpoint System (Quick Reference)

Checkpoints are system state snapshots created automatically before critical operations.

```bash
# Manual checkpoint
python3 ~/.openclaw/workspace/scripts/create-checkpoint.py [event-slug]

# List all checkpoints
ls ~/.openclaw/checkpoints/

# Read what a checkpoint contains
cat ~/.openclaw/checkpoints/[id]/README.md
```

**Automatic checkpoint triggers:**
- Before any `vision.md` approval
- Before any agent creation or modification
- Before any system config change
- Before any bulk operation (10+ files)
- Before any irreversible browser action
- Daily at midnight

See [Systems and Processes](systems-and-processes.md) Section 11 for full checkpoint and recovery detail.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

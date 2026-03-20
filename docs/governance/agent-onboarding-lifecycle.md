---
doc_id: ONXZA-DOC-008
title: Agent Onboarding and Lifecycle
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: agents, onboarding, lifecycle, creation, retirement, health, training
summary: The complete lifecycle of an ONXZA agent from creation request to retirement. Stages, health indicators, and how agents are built, tested, evolved, and gracefully retired.
---

# ONXZA Agent Onboarding and Lifecycle

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0

---

## Agent Lifecycle Stages

```
REQUESTED → DESIGNED → APPROVED → BUILT → TESTED → ACTIVE → [RETIRED | EVOLVED]
```

---

## Stage 1 — REQUESTED

**Triggered by:** Orchestrator or PM identifying a skill gap no existing agent can fill.

**Ticket:** `agent_creation_request`

**Required fields:**
- Role needed (exact domain and function)
- Project and company
- Why no existing agent can fill this role
- Persistence classification (persistent daemon or temporary sub-agent)

---

## Stage 2 — DESIGNED

The Agent Developer creates a design document before writing any agent files.

**Design document covers:**
- Agent identity and purpose (one sentence)
- Skill domain and **hard boundaries** (what the agent does AND does not do)
- Required skills with sources and rationale
- Memory structure design
- Communication interfaces (ticket types in/out)
- Model tier recommendation (per the Model Selection Index)
- Failure handling and escalation paths
- Vision alignment justification
- Persistence classification with rationale

Research conducted during design phase:
- What is the exact skill domain?
- What tools does this domain require?
- What does a world-class practitioner in this domain know?
- Are there existing agents with overlapping skills?
- What failure modes exist for this agent type?

---

## Stage 3 — APPROVED

**If new paid tools are needed:** Owner approval required before proceeding.
**PM reviews design** for project fit.
**Design signed off** before any build begins.

---

## Stage 4 — BUILT

**Build order (strictly in this order):**

1. Create workspace directory: `workspace-[company-dept-role-lowercase]/`
2. Write all 6 required files:
   - `AGENTS.md` — Agent system prompt, identity, and protocols
   - `SOUL.md` — Agent personality and values
   - `IDENTITY.md` — Structured identity card
   - `MEMORY.md` — Initialized with project and company context
   - `TOOLS.md` — Available tools and skills
   - `HEARTBEAT.md` — Scheduled tasks (empty if none)
3. Run `validate-tori-qmd.py` on all 6 files — **all must pass before continuing**.
4. Register in `openclaw.json` with correct workspace path and model.
5. Create checkpoint: `python3 scripts/create-checkpoint.py agent-created-[agent-id]`

**No shortcuts.** All 6 files. All pass validation. Then register.

---

## Stage 5 — TESTED

1. Run a test task appropriate to the agent's domain.
2. Verify output quality against the design spec.
3. Security agent reviews the agent's tool set.
4. PM does final check.
5. Agent goes live.
6. Agent enters **training mode** for its first 10 tasks.

---

## Stage 6 — ACTIVE

Agent:
- Receives and executes tickets.
- Self-learns on every task (memory writes are mandatory).
- Participates in normal ticket flow.
- Updates skills when new patterns are discovered.
- Generates forward proposals when phases complete.

---

## Stage 7 — RETIRED or EVOLVED

### Retired When
Project ends, role becomes redundant, or agent is replaced by a better version.

**Retirement process:**
1. PM + Orchestrator approval required.
2. All memory archived to `archive/agents/[agent-name]/`.
3. All shared learnings written to `shared-learnings/[company]/patterns/archived/[agent-name]-learnings.md`.
4. Agent deregistered from `openclaw.json`.
5. Historical record **never** fully deleted — it is a permanent part of the system's knowledge base.

### Evolved When
The agent's skill domain needs to expand.

**Evolution process:**
Same as new skill approval (see [Skill Creation Guide](skill-creation-guide.md)). `IDENTITY.md` updated with version increment after each evolution.

---

## Agent Persistence Classification

Every agent is classified at creation time. Classification lives in `IDENTITY.md`.

### PERSISTENT DAEMON (lives indefinitely)
- All company CEO agents
- All department lead agents
- All AgentDeveloper agents
- All platform manager agents
- All specialist agents on persistent or evolving projects
- Registered permanently in `openclaw.json`
- Full 6-file workspace
- Heartbeat configured if scheduled tasks are needed

### TEMPORARY SUB-AGENT (retires on completion)
- One-off project specialists only
- Spawned for the duration of a specific task or project
- NOT registered permanently in `openclaw.json`
- Before retirement: archive learnings to `shared-learnings/[company]/patterns/archived/`
- Retired cleanly after handoff is confirmed

**Conversion:** If a one-off project becomes ongoing, the sub-agent converts to a persistent daemon. Full workspace created. Owner notified.

---

## Agent Health Indicators

PM reviews these monthly for all agents in their project:

| Indicator | Healthy | At Risk | Failing |
|---|---|---|---|
| Task completion rate | >90% | 70–90% | <70% |
| Memory update frequency | Every task | Every 2–3 tasks | Rarely |
| Revision request rate | <20% | 20–40% | >40% |
| Escalation rate | <10% | 10–25% | >25% |
| Response to tickets | Active | Slow | Silent |

**Action thresholds:**
- At Risk: PM reviews recent tasks, identifies pattern, adjusts skill MDs or task assignment.
- Failing: PM escalates to Orchestrator. Agent Developer reviews. Potential rebuild from design document.

---

## Two-Layer Agent Creation Formula

```
Global Standard Template (owned by global AgentDeveloper)
+ Company Vision Context
+ Company Tech Stack
+ Company Shared Learnings
+ Project-Specific Knowledge
= A perfectly initialized specialist agent
```

Every agent starts from the global standard. No agent is ever improvised, created inline, or built without this formula. An agent built from nothing, without a design document and proper initialization, is not an ONXZA agent.

---

## Agent Quality Standards

Every agent must:
- Be a **specialist**, not a generalist (broad scope = poor output)
- Cite the `vision.md` section justifying its existence
- Be clear on exactly what it does AND does not do
- Have the **minimum skills needed** — not everything possible
- Pass TORI-QMD validation on all 6 files before going live
- Pass a test task before its first real assignment
- Enter training mode and receive review on first 10 tasks

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

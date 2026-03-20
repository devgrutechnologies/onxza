---
title: Introduction to ONXZA
version: 1.0
owner: DTP_ONXZA_Docs
created: 2026-03-18
status: published
credit_line: present
---

# Introduction to ONXZA

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## What is ONXZA?

ONXZA is an open-source AI company operating system.

It provides the governance layer, communication infrastructure, agent lifecycle management, knowledge architecture, and quality enforcement needed to run autonomous agent fleets at company scale.

**ONXZA is not:**
- A chatbot framework
- A workflow automation tool
- A replacement for your infrastructure
- A closed-source product

**ONXZA is:**
- An operating system that sits between raw LLM capability and real-world outcomes
- A governance and coordination layer for autonomous agents
- Built on top of OpenClaw (agent runtime)
- Open source for non-commercial use
- A reference implementation of FAAILS (open protocol specification)

---

## The Problem ONXZA Solves

LLMs are powerful, but getting them to:
- Coordinate reliably across many tasks
- Make decisions with proper authority levels
- Learn from experience and improve over time
- Maintain clear audit trails
- Respect human intent and boundaries
- Handle failures gracefully

...requires more than a chat interface or simple API wrapper.

ONXZA solves this by providing:
1. **Governance** — Clear decision-making authority and vision lock
2. **Communication** — Structured ticket system for inter-agent work
3. **Quality** — Verification protocol that catches errors before they propagate
4. **Learning** — Knowledge that flows from specialists → company → global → community
5. **Observability** — Complete transparency into agent decisions
6. **Scalability** — From one agent to fleets of hundreds

---

## Core Principles

### 1. Vision is Immutable
Once a vision document is approved, no agent below the principal can modify it. This ensures intent doesn't drift. All evolution goes through formal governance.

### 2. Knowledge Flows Upward
Learning moves from specialist agents → company-level patterns → global standards → FAAILS community. The system gets smarter with every task.

### 3. All Work is Visible
Every task is a ticket. Every decision is logged. Every escalation is recorded. Complete transparency.

### 4. Quality is Non-Negotiable
The FVP (Final Verification Protocol) is a quality gate every agent must pass. Bad output doesn't propagate.

### 5. No Agent Acts Alone
Agents coordinate through tickets. No direct messaging, no hidden agreements. All communication is recorded.

### 6. Autonomy Has Limits
Authority is hierarchical. Agents escalate decisions that exceed their authority. Humans remain in control.

---

## Stack Position

```
┌─────────────────────────────────────────────────────────┐
│ LLMs (Claude, GPT-4, Ollama, etc.)                      │
│ Raw intelligence                                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ OpenClaw — Agent Runtime                                │
│ Session management, channels, heartbeats, tools         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ ONXZA — AI Company Operating System       ← YOU ARE HERE│
│ Governance, coordination, quality, learning             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Your Companies (WDC, MGA, DTP, etc.)                    │
│ Operational layer — real work                           │
└─────────────────────────────────────────────────────────┘
```

ONXZA fills the gap between raw LLM capability and reliable operational systems.

---

## Key Concepts

### Agent

An agent is an autonomous worker specialized for a specific domain.

**Examples:**
- A documentation agent that writes and maintains docs
- A code agent that generates and reviews code
- A routing agent that intelligently assigns tasks
- A verification agent that checks quality

**Agent properties:**
- Named `[Company]_[Dept]_[Role]` (e.g., `DTP_ONXZA_Docs`)
- Has a configured model (Claude Haiku, Sonnet, local LLM, etc.)
- Has domain-specific skills and knowledge
- Operates with clear scope boundaries
- Reports to a supervisor
- Maintains long-term memory

### Ticket

Work is assigned via tickets — structured markdown files in the ticket system.

**Ticket properties:**
- Assigned to a specific agent
- Has clear acceptance criteria
- Can be escalated if the agent can't resolve it
- Moves through lifecycle: open → in-progress → pending-approval → blocked → closed
- Complete audit trail is maintained

### Vision

A vision document is the immutable north star for a project.

**Vision properties:**
- Approved by the principal (human authority)
- Cannot be modified once approved (only via formal update request)
- Guides all decisions agents make
- Includes 30/90/180-day targets, non-negotiables, constraints
- If a task conflicts with vision, vision wins

### Skill

A skill is a packaged piece of domain knowledge.

**Examples:**
- "How to write clear API documentation"
- "Python async patterns"
- "Customer onboarding flow"
- "Security hardening checklist"

**Skill properties:**
- Markdown document (not code)
- Agent loads it as context
- Can be company-level or global
- Versioned and maintained
- Can be published to marketplace

### Shared Learning

Knowledge that emerges from tasks and gets promoted.

**Types:**
- **Pattern** — An approach that worked
- **Correction** — Something that failed and the fix
- **Tool Note** — Observed behavior of an external service
- **Skill** — Packaged domain knowledge
- **Escalation Log** — Why something escalated and how it resolved

**Flow:**
```
Specialist learns → Company patterns → Global patterns → FAAILS community
```

---

## How It Works: End-to-End

### 1. Submit Work (Human)

Create a ticket:

```yaml
---
type: task
assigned_to: DTP_ONXZA_Docs
summary: "Write quickstart guide"
---

## Requested Action
Write a 10-minute quickstart for new developers.
```

### 2. Agent Executes (Autonomous)

Agent reads the ticket and executes:
- Reads vision document (to understand context)
- Loads relevant skills
- Executes work
- Self-assesses confidence (0–100)

### 3. Quality Gate (Verification)

Output runs through FVP:
- Does it meet acceptance criteria? ✓
- Is the writing clear? ✓
- Is it accurate? ✓
- Confidence ≥70%? ✓

### 4. Feedback Loop (Learning)

If verification fails:
- Agent iterates (max 3 loops)
- If 3 loops fail, escalates to PM

If verification passes:
- Output accepted
- Agent extracts learnings
- Learnings promoted to shared patterns
- Task closes

### 5. Knowledge Propagates

Learnings flow upward:
- Specialist discovery → company patterns
- Useful patterns → global
- Global patterns → FAAILS community
- Community feedback improves standard

---

## FAAILS: The Open Standard

FAAILS (Frameworks for Autonomous Artificial Intelligence Learning Systems) is the open protocol that ONXZA implements.

**FAAILS defines:**
- How agents are structured and named
- How agents communicate
- How vision is protected from drift
- How knowledge is classified and shared
- How skills are created and distributed
- How automation is tiered (to minimize cost)
- How escalation works
- How memory is isolated and protected

**ONXZA is the reference implementation of FAAILS.** Anyone can build a FAAILS-compliant system using any stack.

See [FAAILS Specifications](../faails/) for details.

---

## Getting Started

**New to ONXZA?**

1. **[Quickstart](../quickstart.md)** — Get your first agent running (10 minutes)
2. **[System Architecture](../architecture.md)** — Understand how it all works together
3. **[Agent Creation Guide](agent-creation.md)** — Build your own agents
4. **[CLI Reference](../reference/cli.md)** — Commands you'll need

**Ready to dive deeper?**

- [FAAILS Specification](../faails/) — The protocol standard
- [Skill Creation Guide](skill-creation.md) — Build domain-specific knowledge
- [Security Guide](security.md) — Hardening and compliance
- [Deployment Guide](deployment.md) — Production setup

---

## Philosophy

> "ONXZA is not just a product for us. ONXZA is the system we are building RIGHT NOW to run DevGru. Every governance doc, every agent protocol, every skill system, every script pipeline — that IS ONXZA. We are building it and using it simultaneously. When it is ready, other companies and people use it to do what we are doing. We built the plane while flying it. Now we sell the plane." — Aaron Gear

ONXZA is proven in production. It's used to run DevGru companies today. You're not adopting an experiment — you're adopting the system that runs a real company.

---

## What Makes ONXZA Different

| Aspect | ONXZA | Traditional Orchestration |
|---|---|---|
| **Governance** | Formal vision lock, immutable north star | Ad-hoc decision making |
| **Learning** | Systematic knowledge promotion | Scattered learnings, lost insights |
| **Quality** | FVP gate on every output | Hope and manual review |
| **Transparency** | Complete audit trail | Black box decisions |
| **Scalability** | Designed for fleets of agents | Works OK with 2-3 agents |
| **Open Standard** | FAAILS specification | Proprietary lock-in |
| **Cost** | Free for self-hosted, pays for cloud | Pay per token, no optimization |

---

## Common Use Cases

### Case 1: Documentation Pipeline

```
Task → Documentation Agent → FVP Check → Published Docs
        ↓
    Extract learnings → Patterns → Skill library
    (improves next time)
```

### Case 2: Code Generation & Review

```
Task → Code Agent → QA Agent → FVP → Deployed Code
       ↓
   Patterns learned → Architecture decisions improve
```

### Case 3: Multi-Agent Workflow

```
Task → Router → Specialist 1 → Integration → Specialist 2 → FVP → Close
             ↓
        Log decision outcome → Routing improves over time
```

---

## Next Steps

1. **Install:** [Quickstart Guide](../quickstart.md)
2. **Understand:** [System Architecture](../architecture.md)
3. **Build:** [Agent Creation Guide](agent-creation.md)
4. **Learn:** [FAAILS Specifications](../faails/)
5. **Deploy:** [Deployment Guide](deployment.md)

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

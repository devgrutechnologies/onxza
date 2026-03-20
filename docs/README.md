---
title: ONXZA Documentation
version: 1.0
owner: DTP_ONXZA_Docs
created: 2026-03-18
status: published
credit_line: present
---

# ONXZA Documentation

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Getting Started

**New to ONXZA?**
- [Quickstart Guide](quickstart.md) — Get your first agent running in 10 minutes
- [What is ONXZA?](guides/introduction.md) — Understand the core concepts
- [System Architecture](architecture.md) — How ONXZA works

**Developer?**
- [CLI Reference](reference/cli.md) — Complete command reference
- [Agent Creation Guide](guides/agent-creation.md) — Build your own agents
- [Skill Creation Guide](guides/skill-creation.md) — Write domain-specific skills

**Operator?**
- [Deployment Guide](guides/deployment.md) — Install and configure ONXZA
- [Security Guide](guides/security.md) — Hardening and compliance
- [Monitoring & Observability](guides/monitoring.md) — Track your system

---

## Core Documentation

### Protocols (FAAILS)

The FAAILS (Frameworks for Autonomous Artificial Intelligence Learning Systems) protocol defines the open standard that ONXZA implements.

- [FAAILS-001: Agent Identity & Naming Standard](faails/FAAILS-001.md)
- [FAAILS-002: Inter-Agent Communication Protocol](faails/FAAILS-002.md)
- [FAAILS-003: Vision Lock Governance](faails/FAAILS-003.md)
- [FAAILS-004: Memory Isolation Model](faails/FAAILS-004.md)
- [FAAILS-005: Shared Learnings Architecture](faails/FAAILS-005.md)
- [FAAILS-006: Skill Lifecycle Standard](faails/FAAILS-006.md)
- [FAAILS-007: Automation Tier Framework](faails/FAAILS-007.md)
- [FAAILS-008: Agent Creation Standard](faails/FAAILS-008.md)
- [FAAILS-009: Escalation & Approval Protocol](faails/FAAILS-009.md)
- [FAAILS-010: Knowledge Base Governance](faails/FAAILS-010.md)

### Guides

- [Introduction to ONXZA](guides/introduction.md) — Core concepts and philosophy
- [System Architecture](architecture.md) — Technical design and stack position
- [Agent Creation Guide](guides/agent-creation.md) — Five-phase agent creation process
- [Skill Creation Guide](guides/skill-creation.md) — Building and publishing skills
- [Deployment Guide](guides/deployment.md) — Installation, configuration, scaling
- [Security & Compliance](guides/security.md) — Hardening, audit, governance
- [Monitoring & Observability](guides/monitoring.md) — Logs, metrics, health checks
- [Quickstart Guide](quickstart.md) — Zero to first agent in 10 minutes

### Reference

- [CLI Reference](reference/cli.md) — All commands with examples
- [Model Selection Index](reference/models.md) — Model tiers and routing
- [Ticket System Reference](reference/tickets.md) — Ticket types and lifecycle
- [Agent Registry](reference/agent-registry.md) — All agents in your system
- [Knowledge Base](knowledge-base.md) — Shared learnings, skills, patterns

### Operations

- [Data Privacy & Retention](operations/data-retention.md) — Data governance
- [Disaster Recovery](operations/disaster-recovery.md) — Backup and recovery
- [Compliance & Legal](operations/compliance.md) — Licensing and obligations
- [Performance & Metrics](operations/metrics.md) — KPIs and measurement

---

## For Different Audiences

### I'm a Developer

Want to build on ONXZA?
1. [Quickstart](quickstart.md) — Get running fast
2. [Agent Creation Guide](guides/agent-creation.md) — Build your agents
3. [Skill Creation Guide](guides/skill-creation.md) — Write skills
4. [CLI Reference](reference/cli.md) — Commands you'll need
5. [FAAILS Specs](faails/) — Protocol details

### I'm an Operator / DevOps

Want to deploy and maintain ONXZA?
1. [System Architecture](architecture.md) — How it works
2. [Deployment Guide](guides/deployment.md) — Get it running
3. [Security Guide](guides/security.md) — Harden the system
4. [Monitoring Guide](guides/monitoring.md) — Keep it healthy
5. [Disaster Recovery](operations/disaster-recovery.md) — Plan for failure

### I'm an Integration Engineer

Want to integrate ONXZA with other systems?
1. [Architecture](architecture.md) — System design
2. [CLI Reference](reference/cli.md) — Command interface
3. [API Reference](reference/api.md) — Programmatic interface
4. [Ticket System](reference/tickets.md) — How work flows
5. [FAAILS Specs](faails/) — Protocol standards

### I'm Building the FAAILS Standard

Want to implement FAAILS in another product?
1. [FAAILS Specification](faails/) — All 10 protocol sections
2. [System Architecture](architecture.md) — ONXZA as reference implementation
3. [GitHub Repository](https://github.com/devgru/onxza) — Source code
4. [Contributing Guide](CONTRIBUTING.md) — How to contribute to FAAILS

---

## Documentation Map

```
docs/
├── README.md (you are here)
├── quickstart.md — 10-minute zero-to-agent
├── architecture.md — Complete system design
├── knowledge-base.md — Shared learnings and skills
│
├── faails/
│   ├── FAAILS-001.md — Agent Identity
│   ├── FAAILS-002.md — Communication Protocol
│   ├── FAAILS-003.md — Vision Lock
│   ├── FAAILS-004.md — Memory Isolation
│   ├── FAAILS-005.md — Shared Learnings
│   ├── FAAILS-006.md — Skill Lifecycle
│   ├── FAAILS-007.md — Automation Tiers
│   ├── FAAILS-008.md — Agent Creation
│   ├── FAAILS-009.md — Escalation Protocol
│   └── FAAILS-010.md — Knowledge Base Governance
│
├── guides/
│   ├── introduction.md — What is ONXZA?
│   ├── agent-creation.md — Build agents
│   ├── skill-creation.md — Build skills
│   ├── deployment.md — Install & configure
│   ├── security.md — Hardening & compliance
│   └── monitoring.md — Observability
│
├── reference/
│   ├── cli.md — Command reference
│   ├── models.md — Model selection & routing
│   ├── tickets.md — Ticket system reference
│   ├── agent-registry.md — Agent listing
│   └── api.md — API reference
│
└── operations/
    ├── data-retention.md — Privacy & governance
    ├── disaster-recovery.md — Backup & recovery
    ├── compliance.md — Licensing & legal
    └── metrics.md — Monitoring & KPIs
```

---

## Key Concepts

| Term | Definition |
|---|---|
| **Agent** | Autonomous worker that executes tasks assigned via tickets |
| **Ticket** | Work assignment; structured markdown file in tickets/ directory |
| **FAAILS** | Open specification that ONXZA implements |
| **Skill** | Domain-specific knowledge document agents load and apply |
| **Pattern** | Reusable approach that worked; captured in shared learnings |
| **Vision** | Immutable north star document for a project; cannot be modified once approved |
| **FVP** | Final Verification Protocol; quality gate for all agent output |
| **Workspace** | Directory structure containing agents, tickets, knowledge, and configuration |
| **Shared Learning** | Knowledge promoted from specialist agents to company level to global community |
| **MPI** | Model Performance Index; benchmark of model quality in real agentic workflows |

---

## Installation

### Quick Install

```bash
# One-line install
curl -fsSL https://get.onxza.com | bash

# Or via npm
npm install -g onxza

# Verify
onxza --version
```

### Initialize

```bash
# Create workspace
onxza init

# Create first agent
onxza agent create [Company_Dept_Role]

# Assign work via tickets
# (tickets are just markdown files in ~/.openclaw/workspace/tickets/open/)
```

See [Quickstart Guide](quickstart.md) for full walkthrough.

---

## Community & Support

- **GitHub:** https://github.com/devgru/onxza
- **Discussions:** GitHub Discussions (link TBD)
- **Discord:** [Join our community](https://discord.gg/onxza-community) (link TBD)
- **Issues:** https://github.com/devgru/onxza/issues

---

## Contributing

Want to contribute to ONXZA or FAAILS?

1. **Report bugs** → File an issue on GitHub
2. **Suggest features** → Discussions tab
3. **Contribute code** → Fork, develop, submit PR (see CONTRIBUTING.md)
4. **Write documentation** → Help improve these docs
5. **Build skills** → Submit to the skills marketplace
6. **Share patterns** → Contribute to shared learnings

See [Contributing Guide](CONTRIBUTING.md) for details.

---

## License

ONXZA is open source under the **Non-Commercial Free + Commercial Paid** model:

- **Non-commercial use (self-hosted):** Always free, open source
- **Cloud platform (we host it):** Paid subscription
- **Commercial license:** Contact for pricing
- **Enterprise (white-label + support):** Contact for pricing

See [LICENSE](LICENSE.md) and [FAAILS Specification](faails/FAAILS-010.md#licensing) for details.

---

## Version History

| Version | Date | Status | Highlights |
|---|---|---|---|
| 0.1.0 | 2026-03-18 | Alpha | Initial documentation and protocol specs published |
| 1.0.0 | TBD | Planned | Full CLI, marketplace, cloud platform |

---

## About

**ONXZA** is an AI company operating system built on top of OpenClaw. It provides governance, communication, knowledge management, and quality infrastructure for autonomous agent fleets at company scale.

**FAAILS** is the open protocol specification that ONXZA implements. Anyone can build a FAAILS-compliant system.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

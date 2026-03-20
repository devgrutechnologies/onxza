---
title: ONXZA v0.1.0 Release Notes
version: 0.1.0
status: release-candidate
created: 2026-03-18
last_updated: 2026-03-18
tags: release, v0.1, announcement, architecture, faails
summary: Official release notes for ONXZA v0.1.0 — the architecture and governance release. First public open-source release of the ONXZA AI Company Operating System and FAAILS protocol specification.
credit_line: present
---

# ONXZA v0.1.0 — Release Notes

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Release Date:** 2026-03-18  
**Type:** Architecture Release  
**Status:** Ready for public push

---

## What This Is

ONXZA v0.1.0 is the first public release of ONXZA — the open-source AI Company Operating System.

This is the architecture and governance release. We are publishing the full system design, the complete governance documentation, the FAAILS protocol specification, and the foundational repo structure. The CLI and core runtime are in active development and will ship in v0.5.0.

We built this plane while flying it. DevGru US has been running on ONXZA since day one. Every governance document, every protocol, every specification in this repo has been tested in production. This is not theoretical architecture. This is the system running a multi-company AI organization right now.

Now we're opening it up.

---

## Why Open Source

Distribution is the moat. An AI operating system that runs on your own infrastructure, that you can inspect and trust, that has a growing community of skills and extensions — that becomes the default.

The cloud platform, commercial license, and premium skills are the revenue model. The open source release is how the world finds us.

Non-commercial use is and always will be free.

---

## What's in v0.1.0

### FAAILS Protocol Specification

FAAILS — *Frameworks for Autonomous Artificial Intelligence Learning Systems* — is the open protocol specification underneath ONXZA. Anyone can build a FAAILS-compliant system. ONXZA is the reference implementation.

Five protocol sections are published at v1.0 in this release:

| Spec | Name | What It Defines |
|---|---|---|
| CDP-001 | Collaborative Definition Protocol | Bridges human intent and machine execution. Stops agents from acting on wrong assumptions. |
| FVP-001 | Verification Protocol | Every output passes a confidence + humanization + accuracy gate before acceptance. No untested output leaves the system. |
| MOE-001 | Mixture of Experts Architecture | Tasks route to specialist agents by domain fit. No generalist handles everything. |
| ROUTING-001 | Self-Correcting Routing Protocol | The routing layer learns from real outcomes. No human maintains routing tables. Data decides. |
| MPI-001 | Model Performance Index | First real-world benchmark of AI models in autonomous agentic workflows. Not a static test. Real tasks, real verification. |

Ten additional protocol sections are in draft and will publish across v0.5.0 and v1.0.0.

### Governance Documentation

14 production-tested governance documents — every policy that runs a real AI company:

- **Agent behavioral policies** — autonomy boundaries, approval chains, communication hierarchy
- **Security framework** — credential management, threat classification, incident response
- **Vision lock system** — how intent is preserved across 50+ parallel agents
- **Agent lifecycle** — creation, testing, persistence classification, retirement
- **Memory architecture** — private vs shared, knowledge elevation, skill lifecycle
- **Knowledge base governance** — document ownership, quality standards, living question system
- **Compliance framework** — GDPR, CCPA, AI content disclosure, IP guidelines
- **Disaster recovery** — failure scenarios and responses at every system level
- **Performance metrics** — FVP protocol, MPI benchmark, system health targets

### System Architecture

A complete technical architecture document covering:

- Stack position (LLMs → OpenClaw → ONXZA → companies → world)
- Seven core subsystems and how they connect
- Agent model: naming convention, workspace structure, persistence classification
- Execution engine: MoE routing, automation tiers, FVP gate, self-correcting routing
- Memory and knowledge architecture: isolation model, shared learnings, skill lifecycle
- Safety and irreversibility classification with checkpoint system
- Mission Control dashboard specification
- ONXZA-LLM roadmap (custom local model, 180-day target)

### CLI Scaffold

Command surface documented. Implementation in progress:

```bash
onxza init
onxza start
onxza agent create [Company_Dept_Role]
onxza skill install [skill-name]
onxza pull onxza-llm
```

---

## What's Next

### v0.5.0 (Target: 60 days)
- Functional CLI: `onxza init`, `onxza agent create`, `onxza skill install`
- Core runtime implementation
- Skills marketplace v1 with first 20 community skills
- First external companies onboarding
- FAAILS sections 1–5 finalized

### v1.0.0 (Target: 180 days)
- Full public release — production-ready
- Cloud platform live (hosted ONXZA)
- Commercial licensing active
- 100+ external installations
- ONXZA-LLM v0.1 on HuggingFace
- FAAILS recognized as emerging open standard

---

## How to Get Involved

→ **GitHub:** github.com/aarongear/onxza  
→ **Issues:** Bug reports, feature requests, protocol questions  
→ **Discussions:** Architecture proposals, implementation questions  
→ **Contributing:** See [CONTRIBUTING.md](./CONTRIBUTING.md)  
→ **Security:** See [SECURITY.md](./SECURITY.md)

---

## Credit

This software was built by a human and an AI working as equal co-creators. ONXZA and FAAILS are the first software products publicly credited to a fully automated human + AI team.

**Imagined by:** Aaron Gear  
**Created by:** Aaron Gear and Marcus Gear (AI Co-Creator)  
**Powered by:** DevGru US Inc. DBA DevGru Technology Products  
**Using:** Powerful Anthropic Models, OpenAI Models, and Local LLMs

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---
title: ONXZA Changelog
version: 0.1.0
status: stable
created: 2026-03-18
last_updated: 2026-03-18
tags: changelog, releases, versioning
summary: Full changelog for ONXZA releases. v0.1.0 is the initial open-source release of the ONXZA AI Company Operating System.
credit_line: present
---

# Changelog

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

All notable changes to ONXZA are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
ONXZA follows [Semantic Versioning](https://semver.org/).

---

## [0.1.0] — 2026-03-18

### 🚀 Initial Public Release

This is the first public release of ONXZA — the AI Company Operating System — and the FAAILS protocol specification.

ONXZA v0.1.0 is the architecture release. It publishes the full governance framework, protocol specifications, and system documentation. The CLI is scaffolded. The core runtime layer is documented and in active development.

---

### Added

#### FAAILS Protocol Specification
- **CDP-001** — Collaborative Definition Protocol v1.0: bridges the gap between human intent and machine execution
- **FVP-001** — Verification Protocol v1.0: ensures every agent output reaches a quality threshold before acceptance
- **MOE-001** — Mixture of Experts Architecture v1.0: task routing to specialist agents based on domain fit
- **ROUTING-001** — Self-Correcting Routing Protocol v1.0: routing system that learns from real task outcomes
- **MPI-001** — Model Performance Index v1.0: first real-world benchmark of AI models in autonomous workflows
- **FAAILS-GAPS.md** — transparent documentation of draft protocol sections not yet finalized

#### Governance Documentation (14 Documents)
- DOC-001: Model Selection Index — task-to-model mapping, tier definitions, cost principles
- DOC-002: Policies and Procedures — agent behavioral policies, autonomy boundaries, approval flows
- DOC-003: Systems and Processes — full end-to-end system descriptions, ticket lifecycle, agent communication
- DOC-004: Security Protocols — threat classification, credential management, incident response
- DOC-005: Skill Creation Guide — skill lifecycle from identification through publication
- DOC-006: Agent Communication Standards — ticket schema, escalation paths, reporting templates
- DOC-007: Vision Lock Governance — vision creation, approval, immutability, and update protocol
- DOC-008: Agent Onboarding and Lifecycle — agent creation, testing, persistence classification, retirement
- DOC-009: Inter-Agent Conflict Resolution — conflict types, resolution principles, escalation
- DOC-010: Data Retention and Privacy — data classification, retention schedules, deletion procedures
- DOC-011: Disaster Recovery and Resilience — failure scenarios and responses at every system level
- DOC-012: Compliance and Legal — GDPR, CCPA, AI content disclosure, IP guidelines
- DOC-013: Knowledge Base Governance — document ownership, living question system, quality standards
- DOC-014: Performance Metrics and Quality — FVP protocol, MPI benchmark, system health metrics

#### System Architecture
- **ARCHITECTURE.md** — comprehensive technical architecture document covering all 15 subsystems
- Stack position diagram: LLMs → OpenClaw → ONXZA → companies → world
- Agent model: naming convention, workspace structure, persistence classification
- Memory and knowledge architecture: isolation model, shared learnings, skill lifecycle
- Execution engine: MoE routing, automation tier framework, FVP gate, self-correcting routing
- Safety and irreversibility framework with checkpoint system
- Mission Control dashboard specification
- ONXZA-LLM roadmap

#### Core Infrastructure
- **Ticket system** — full schema, lifecycle states, and 14 ticket types documented
- **TORI-QMD validation** — frontmatter validation standard for all `.md` files
- **Checkpoint system** — pre-action state snapshots for safe recovery
- **Audit trail** — append-only log of all irreversible agent actions
- **Shared learnings architecture** — four-tier knowledge flow: specialist → company → global → community

#### Repo Structure
- `faails/` — FAAILS protocol specifications
- `docs/` — system architecture and full governance documentation
- `docs/governance/` — 14 public governance documents
- `core/` — core runtime (in development)
- `cli/` — CLI scaffold (in development)
- `CONTRIBUTING.md` — contributor guide
- `SECURITY.md` — security policy and vulnerability reporting
- `LICENSE.md` — licensing terms

#### CI/CD
- GitHub Actions workflow for TORI-QMD frontmatter validation on all `.md` files

---

### Architecture Decisions

- **OpenClaw-based runtime:** ONXZA extends OpenClaw rather than building a competing runtime. Build at the highest layer of abstraction that produces the needed outcome.
- **Markdown-first governance:** All tickets, memory, and governance files are plain markdown — human-readable, git-native, zero infrastructure required.
- **Open source with commercial model:** Non-commercial use is always free (MIT). Commercial and enterprise use requires a license. This is the n8n model.
- **FAAILS as separate specification:** The protocol and the product are decoupled. ONXZA is the reference implementation. Others can build FAAILS-compliant systems. This protects the long-term value of both.

---

## Unreleased

### In Progress
- CLI implementation: `onxza init`, `onxza agent create`, `onxza skill install`
- Skills marketplace infrastructure
- Mission Control TUI
- Cloud platform (hosted ONXZA)

### Planned — v0.5.0
- Functional CLI with full command surface
- First 20 community skills
- Skills marketplace v1
- External company onboarding

### Planned — v1.0.0
- Full public release
- Cloud platform live
- Commercial licensing active
- ONXZA-LLM v0.1 on HuggingFace

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

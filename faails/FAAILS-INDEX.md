---
title: FAAILS Protocol Index — Specification Crosswalk
id: FAAILS-INDEX
version: 1.0.0
owner: DTP_ONXZA_Docs
created: 2026-03-19
status: ACTIVE
tags: faails, index, crosswalk, numbering, protocol
summary: Canonical mapping between the FAAILS-NNN sequential numbering system and topic-prefixed implementation documents (CDP-NNN, MOE-NNN, FVP-NNN, etc.). Resolves GAP-001.
credit_line: present
---

# FAAILS Protocol Index — Specification Crosswalk

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Resolves:** GAP-001 (dual numbering systems, no crosswalk)

---

## Purpose

The FAAILS specification uses two complementary numbering systems. This document is the canonical crosswalk between them. It is the single source of truth for resolving any reference ambiguity.

---

## The Two Numbering Systems

### System A — FAAILS-NNN: Normative Protocol Sections

The `FAAILS-NNN` series represents the **normative protocol standard**. These are the authoritative specifications that any FAAILS-compliant implementation must satisfy. They define *what* is required.

Format: `FAAILS-[three-digit number]`  
Location: `projects/onxza/faails/FAAILS-NNN.md`

### System B — Topic-Prefixed: Implementation Specifications

The topic-prefixed series (CDP, MOE, FVP, ROUTING, MPI) represents **implementation specifications** for ONXZA as the reference implementation. They define *how* ONXZA implements the protocol requirements. They may contain implementation detail beyond the normative standard.

Format: `[PREFIX]-[three-digit number]`  
Location: `projects/onxza/faails/[PREFIX]-NNN.md`

---

## Canonical Mapping

| FAAILS-NNN | Title | Normative Status | Implemented By | Notes |
|---|---|---|---|---|
| **FAAILS-001** | Agent Identity & Naming Standard | ✅ Published | `AGENTS.md` structure in every agent workspace | Two-layer identity formula, 6-file workspace structure |
| **FAAILS-002** | Inter-Agent Communication Protocol | ✅ Published | Ticket system, dispatcher cron | Full ticket schema, type registry, lifecycle |
| **FAAILS-003** | Vision Lock Governance | ✅ Published | `CDP-001.md` | Vision lifecycle, immutability rules |
| **FAAILS-004** | Memory Isolation Model | ✅ Published | `shared-learnings/` architecture | PRIVATE vs SHARED classification |
| **FAAILS-005** | Shared Learnings Architecture | ✅ Published | `shared-learnings/` directory structure | Promotion path, session memory format |
| **FAAILS-006** | Skill Lifecycle Standard | ✅ Published | Skills marketplace, `DTP_ONXZA_SkillsMarketplace` | Skill format, install/update/publish lifecycle |
| **FAAILS-007** | Automation Tier Framework | ✅ Published | `MOE-001.md`, `ROUTING-001.md` | Tier 1/2/3 classification, local-first cost principle |
| **FAAILS-008** | Agent Creation Standard | ✅ Published | Two-layer formula, `skill-agent-creation-global-standard.md` | 5-phase creation, design doc, test task |
| **FAAILS-009** | Escalation & Approval Protocol | ✅ Published | FVP escalation path, security routing | FVP loops, Aaron unreachable, security flags |
| **FAAILS-010** | Knowledge Base Governance | ✅ Published | `DOC-NNN` governance docs | P&P updates, knowledge gap handling |

---

## Topic-Prefixed Implementation Spec Mapping

| Spec File | Full Title | Normative Basis | Relationship |
|---|---|---|---|
| `CDP-001.md` | Collaborative Definition Protocol | FAAILS-003 | CDP board session process implements vision lock governance |
| `MOE-001.md` | Mixture of Experts Execution Architecture | FAAILS-007 | MoE loop implements the Automation Tier Framework |
| `FVP-001.md` | FAAILS Verification Protocol v1.0 | FAAILS-009 | FVP implements the quality gate within escalation protocol |
| `ROUTING-001.md` | Self-Correcting Routing Protocol | FAAILS-007 | Self-correcting routing implements Tier assignment and MoE model selection |
| `MPI-001.md` | Model Performance Index | FAAILS-007 | MPI aggregates the routing data that drives dynamic tier assignment |

---

## Schema Ownership Statement

Resolves **GAP-004** (ROUTING-001 and MPI-001 schema overlap):

- **ROUTING-001 owns:** The per-task execution log schema (individual task records written at runtime)
- **MPI-001 owns:** The aggregate analysis schema (statistics derived from many task records)
- MPI-001 consumes ROUTING-001 records. See ROUTING-001 Section 4 for the canonical field definitions.

---

## FVP and MPI — FAAILS-NNN Designation

Resolves **GAP-002** and **GAP-003**:

| Topic-Prefixed | Normative FAAILS-NNN Coverage |
|---|---|
| `FVP-001.md` | Covered under **FAAILS-009** (Escalation & Approval Protocol, Section: Quality Gate) |
| `MPI-001.md` | Covered under **FAAILS-007** (Automation Tier Framework, Section: Performance Measurement) |

Both FVP and MPI are sufficiently differentiated that they may be elevated to standalone FAAILS-NNN sections in a future protocol revision (proposed: FAAILS-011 for FVP, FAAILS-012 for MPI). This is tracked as a future enhancement, not a gap.

---

## Two Abstraction Levels — Design Decision

The FAAILS specification intentionally uses two abstraction levels:

```
FAAILS-NNN (normative)
  ↓ implements
Topic-prefixed specs (ONXZA reference implementation)
```

This design means:
1. **External implementors** read `FAAILS-NNN` specs to build compliant systems
2. **ONXZA contributors** read both — normative for intent, topic-prefixed for how ONXZA does it
3. **Future FAAILS implementations** may use different mechanisms while satisfying the same normative requirements

A FAAILS-compliant system is not required to use tickets, CDP board sessions, or any specific mechanism. It is required to satisfy the normative behaviors described in FAAILS-001 through FAAILS-010.

---

## Reading Order for New Implementors

1. `README.md` — What FAAILS is and why
2. `FAAILS-001.md` — Agent identity (start here; everything depends on it)
3. `FAAILS-002.md` — Communication (how agents talk to each other)
4. `FAAILS-008.md` — Agent creation (how to build your first agent)
5. `FAAILS-009.md` — Escalation (what happens when things go wrong)
6. `FAAILS-003.md` — Vision lock (how decisions become permanent)
7. `FAAILS-007.md` — Automation tiers (how work gets classified and routed)
8. `FVP-001.md` — Verification (how output quality is enforced)
9. All remaining specs as needed

---

## Version History

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-03-19 | Initial publication. Resolves GAP-001, GAP-002 partial, GAP-003 partial, GAP-004. |

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

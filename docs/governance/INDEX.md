---
doc_id: ONXZA-GOVERNANCE-INDEX
title: ONXZA Governance Documentation Index
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: index, governance, documentation, overview
summary: Index of all 14 ONXZA governance documents. Status, description, and links for each.
---

# ONXZA Governance Documentation

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

This directory contains the complete ONXZA governance documentation. These documents define how agents in an ONXZA-powered system are created, communicate, make decisions, handle failures, and continuously improve.

They are derived from real-world operational experience running a multi-agent AI company. Every policy in these documents was tested in production.

---

## Governance Documents

| # | Document | File | Status | Description |
|---|---|---|---|---|
| DOC-001 | Model Selection Index | [model-selection-index.md](model-selection-index.md) | ✅ Converted | How ONXZA selects AI models for every task type. Tier definitions, routing decision matrix, cost principles, and task-to-model assignments. |
| DOC-002 | Policies and Procedures | [policies-and-procedures.md](policies-and-procedures.md) | ✅ Converted | The single source of truth for all agent behavioral policies. Autonomy boundaries, communication rules, approval policies, credentials, rate limiting, skills, security, and safety guardrails. |
| DOC-003 | Systems and Processes | [systems-and-processes.md](systems-and-processes.md) | ✅ Converted | How every system works end-to-end. Directory structure, vision-to-execution flow, ticket system, agent creation, content tracking, checkpoints, and self-maintenance schedules. |
| DOC-004 | Security Protocols | [security-protocols.md](security-protocols.md) | ✅ Converted | Complete security framework. Threat classification, code review checklists, skill vetting, credential management, incident response, and international security requirements. |
| DOC-005 | Skill Creation Guide | [skill-creation-guide.md](skill-creation-guide.md) | ✅ Converted | How to research, document, approve, install, maintain, and deprecate agent skills. Skill MD format, approval workflow, and research template. |
| DOC-006 | Agent Communication Standards | [agent-communication-standards.md](agent-communication-standards.md) | ✅ Converted | How agents communicate. Communication hierarchy, ticket writing standards, escalation format, cross-department protocol, and reporting templates. |
| DOC-007 | Vision Lock and Governance | [vision-lock-governance.md](vision-lock-governance.md) | ✅ Converted | How vision.md files are created, approved, protected, and evolved. The vision lock mechanism that prevents drift across parallel autonomous agents. |
| DOC-008 | Agent Onboarding and Lifecycle | [agent-onboarding-lifecycle.md](agent-onboarding-lifecycle.md) | ✅ Converted | The complete agent lifecycle from creation request to retirement. Build process, testing, persistence classification, health indicators, and quality standards. |
| DOC-009 | Inter-Agent Conflict Resolution | [inter-agent-conflict-resolution.md](inter-agent-conflict-resolution.md) | ✅ Converted | How ONXZA handles conflicts between agents. Conflict types, resolution principles, ticket format, and learning from conflicts. |
| DOC-010 | Data Retention and Privacy | [data-retention-privacy.md](data-retention-privacy.md) | ✅ Converted | Data classification, retention schedules, privacy principles, deletion procedures, and user rights for ONXZA installations. |
| DOC-011 | Disaster Recovery and Resilience | [disaster-recovery-resilience.md](disaster-recovery-resilience.md) | ✅ Converted | Failure scenarios and responses at every level: single agent, PM, orchestrator, storage, and security. Resilience design principles. |
| DOC-012 | Compliance and Legal | [compliance-legal.md](compliance-legal.md) | ✅ Converted | Compliance framework for ONXZA-managed projects. GDPR, CCPA, CAN-SPAM, AI content disclosure, compliance review process, and IP guidelines. |
| DOC-013 | Knowledge Base Governance | [knowledge-base-governance.md](knowledge-base-governance.md) | ✅ Converted | How the ONXZA knowledge base is maintained and evolved. Document ownership, the living question system, quality standards, RAG indexing, and review schedules. |
| DOC-014 | Performance Metrics and Quality | [performance-metrics-quality.md](performance-metrics-quality.md) | ✅ Converted | How ONXZA measures agent performance, project health, and system quality. Metrics, targets, FVP protocol, and the Model Performance Index. |

---

## Conversion Status

| Total Docs | Converted | Pending |
|---|---|---|
| 14 | 14 | 0 |

**Conversion complete.** All 14 governance documents converted to public-facing ONXZA documentation. All files pass TORI-QMD validation.

---

## How to Use These Documents

**As a system builder:** Read DOC-002 and DOC-003 first. They define how the system works and what every agent must do. Then read the specific documents relevant to your current task.

**As an agent:** You have a RAG index of these documents. Before asking a question, check the relevant document. The document IDs in `AGENTS.md` tell you which document to fetch for each type of question.

**As an open source contributor:** These documents describe a working AI company operating system. The patterns here are language-agnostic and model-agnostic — they work with any LLM on any platform that supports tool use and persistent agent contexts.

---

## Related

- [FAAILS Protocol Specification](../faails/) — The open protocol specification ONXZA implements
- [ONXZA Project Vision](../../vision.md) — The founding vision for the ONXZA product
- [FAAILS Specification](../faails/) — Protocol specification repository

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

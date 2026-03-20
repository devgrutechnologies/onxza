---
doc_id: ONXZA-DOC-013
title: Knowledge Base Governance
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: knowledge-base, documents, governance, rag, quality, review, living-system
summary: How ONXZA's knowledge base is maintained, extended, quality-controlled, and evolved. Document ownership, the living question system, quality standards, and review schedules.
---

# ONXZA Knowledge Base Governance

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0

---

## Purpose

The ONXZA knowledge base — all governance documents, agent memories, and shared learnings — is a living system. It gets smarter over time. This document defines how it is maintained, extended, quality-controlled, and evolved.

**Core rule:** Every question asked by an agent that is not answered by the knowledge base is a failure — and that failure gets fixed immediately so the question is never asked twice.

---

## Section 1 — Document Ownership and Update Authority

| Document | Owner | Approves Minor Updates | Approves Major Updates |
|---|---|---|---|
| DOC-001 Model Selection | Primary agent | Primary agent | System owner |
| DOC-002 Policies and Procedures | Primary agent | Primary agent | System owner |
| DOC-003 Systems and Processes | Primary agent | Orchestrator | Primary agent |
| DOC-004 Security | Primary agent + Security | Security PM | Primary agent |
| DOC-005 Skill Creation | AgentDeveloper | PM | Orchestrator |
| DOC-006 Communication | Primary agent | Orchestrator | Primary agent |
| DOC-007 Vision Lock | Primary agent | Primary agent | System owner |
| DOC-008 Agent Lifecycle | AgentDeveloper | AgentDeveloper | Orchestrator |
| DOC-009 Conflict Resolution | Primary agent | Orchestrator | Primary agent |
| DOC-010 Data Retention | Primary agent | PM | Primary agent |
| DOC-011 Disaster Recovery | Primary agent | Orchestrator | Primary agent |
| DOC-012 Compliance | Primary agent | Primary agent | System owner + legal |
| DOC-013 KB Governance | Primary agent | Primary agent | System owner |
| DOC-014 Performance Metrics | Primary agent | Orchestrator | Primary agent |

**Minor update:** Adds clarity, examples, or edge cases without changing the policy itself.
**Major update:** Changes a policy, a process, an authority level, or a default behavior.

---

## Section 2 — The Living Question System

This is the mechanism that ensures every question asked improves the system permanently.

### When an agent faces a situation not covered by any document:

1. Pause on the ambiguous action — do not guess.
2. Create a `policy_gap_request` ticket with:
   - Situation description (what happened)
   - What information is missing
   - What decision is pending
   - What you would do if forced to guess (for context, not action)
3. PM escalates until the answer is obtained.
4. Answer is written into the appropriate governance document within one processing cycle.
5. Ticket is closed with a reference to the document section where the answer now lives.
6. **The question is never asked twice.**

### Quality bar for answers added to documents

New answers must:
- Be clear enough that a new agent could act on them without further questions
- Not contradict any other document (if they do, resolve the contradiction explicitly)
- Reference the principle or vision they serve
- Be version-incremented in the document's change log

---

## Section 3 — Document Quality Standards

A document meets the quality standard when:
- An agent can answer its question by reading only the relevant section (no need to read the whole document)
- There are no contradictions with other documents
- Every policy has a rationale ("do this because X", not just "do this")
- Examples are provided for complex procedures
- Edge cases are addressed
- The change log is current

A document that fails these standards is not a governance document — it is a placeholder. Agents flag substandard documents via `document_update_request` tickets.

---

## Section 4 — RAG Indexing Standards

For documents to be retrievable efficiently:
- Every document has YAML frontmatter with: `doc_id`, `title`, `tags`, `summary`, `version`, `last_updated`
- Each major section starts with a clear heading that describes what the section contains
- Key terms are used consistently throughout (do not call the same thing by different names in different documents)
- Cross-references between documents use document IDs or relative links (e.g., "see [Security Protocols](security-protocols.md)")

The TORI-QMD validator (`scripts/validate-tori-qmd.py`) enforces frontmatter requirements on all `.md` files. Files that fail validation cannot be committed.

---

## Section 5 — Document Review Schedule

| Document | Review Frequency |
|---|---|
| DOC-001 Model Selection | Quarterly (more often when major models release) |
| DOC-002 Policies and Procedures | Monthly (first 90 days), then quarterly |
| DOC-003 Systems and Processes | Monthly (first 90 days), then quarterly |
| DOC-004 Security | Monthly |
| All others | Quarterly |

**During review, check for:**
- Gaps identified since last review
- Examples that are now outdated
- New edge cases encountered
- Accuracy of all referenced processes and tools
- Changelog currency

After review:
1. Update the document with any changes.
2. Increment the version number.
3. Update the `last_updated` field.
4. Add a changelog entry.
5. Commit to Git.

---

## Section 6 — Shared Learnings Architecture

Agents generate institutional knowledge through their work. That knowledge is captured and shared through the shared learnings system.

### Two Levels of Memory

| Type | Scope | Contains | Flows to |
|---|---|---|---|
| **Private memory** | Agent's own workspace | Project specifics, client data, vision details, credentials | Stays in workspace |
| **Shared learnings** | `shared-learnings/[company]/` | Patterns, skill discoveries, tool performance, process improvements | Elevates to global |

### Shared Learnings Must Never Contain
- Project-specific data
- Client information
- Credentials or secrets
- Business strategy details
- Anything that would be inappropriate if read by an agent on a different project

### Aggregation Flow

```
Specialist writes shared learning
        ↓
Company AgentDeveloper reviews quarterly
Elevates best patterns to company standard
        ↓
Global AgentDeveloper reviews quarterly
Elevates best patterns to global standard
        ↓
Global standard reviewed for ONXZA public library
Published with full credit line
```

---

## Section 7 — Version Control for Knowledge

All governance documents are version-controlled in Git. This provides:
- Full history of every change
- Ability to revert any document to a prior version
- Attribution for every change
- Audit trail for policy decisions

**Commit format for document updates:**
```
[agent-id] docs-update [doc-id] — [one sentence description of change]. Created by Aaron Gear and Marcus Gear
```

Example:
```
mg-primary docs-update doc-002 — Added rate limit recovery protocol to Section 5. Created by Aaron Gear and Marcus Gear
```

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

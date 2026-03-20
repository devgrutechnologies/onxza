---
title: FAAILS Protocol — Gaps and Inconsistencies
version: 0.1.0
owner: DTP_ONXZA_Architect
created: 2026-03-17
status: ACTIVE — updated as specs mature
tags: faails, gaps, protocol, architecture, refinement
summary: Documents gaps, inconsistencies, and missing sections found in the FAAILS v1.0 initial specifications. Intended for DTP_ONXZA_Docs to action as formal protocol sections are authored.
credit_line: present
---

# FAAILS Protocol — Gaps and Inconsistencies

**Version:** 0.1.0 | **Owner:** DTP_ONXZA_Architect | **Date:** 2026-03-17  
**Reviewed by:** DTP_ONXZA_Architect (TICKET-20260317-003)

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

This document records every gap, inconsistency, or missing specification found during the TICKET-20260317-003 architecture review. Each item is categorized by severity, assigned an owner, and cross-referenced to where the correct specification lives or should be authored.

**Gap IDs** are stable references for tickets and cross-document links. Format: `GAP-[NNN]`.

---

## 1. Numbering Inconsistency — Dual Protocol Numbering Systems

**GAP-001**  
**Severity:** HIGH — causes confusion when referencing protocol sections  
**Status:** Open

### Problem

Two numbering systems exist simultaneously and have no documented relationship:

**System A — Topic-prefixed (existing specs):**
```
CDP-001  Collaborative Definition Protocol
MOE-001  Mixture of Experts Execution Architecture
FVP-001  Verification Protocol
ROUTING-001  Self-Correcting Routing Protocol
MPI-001  Model Performance Index
```

**System B — FAAILS-NNN sequential (README.md):**
```
FAAILS-001  Agent Identity & Naming Standard
FAAILS-002  Inter-Agent Communication Protocol
FAAILS-003  Vision Lock Governance
FAAILS-004  Memory Isolation Model
FAAILS-005  Shared Learnings Architecture
FAAILS-006  Skill Lifecycle Standard
FAAILS-007  Automation Tier Framework
FAAILS-008  Agent Creation Standard
FAAILS-009  Escalation & Approval Protocol
FAAILS-010  Knowledge Base Governance
```

No crosswalk document maps between systems. A developer reading `README.md` and then `CDP-001.md` cannot determine if CDP-001 is the same as FAAILS-001 or something entirely separate.

### Gap Detail

The Section 8.2 table in ARCHITECTURE.md documents the current mapping, but this crosswalk needs to be formally included in `README.md` or a separate `FAAILS-INDEX.md`.

Likely mapping (inferred):
- `CDP-001` → contributes to `FAAILS-002` (communication) and `FAAILS-003` (vision lock)
- `MOE-001` → contributes to `FAAILS-007` (automation tier framework)
- `FVP-001` → no direct FAAILS-NNN equivalent yet — needs its own section
- `ROUTING-001` → contributes to `FAAILS-007` (automation tier)
- `MPI-001` → no direct FAAILS-NNN equivalent yet — needs its own section

FVP and MPI are arguably the most differentiated parts of the protocol and have no formal FAAILS-NNN designation.

### Required Action

1. DTP_ONXZA_Docs to decide: converge to one numbering system, or define the two systems as different abstraction levels (topic-prefixed = implementation docs, FAAILS-NNN = normative protocol sections).
2. Author `FAAILS-INDEX.md` mapping all spec files to formal FAAILS-NNN sections.
3. Add FVP and MPI to the FAAILS-NNN registry.

**Owner:** DTP_ONXZA_Docs  
**Ticket to create:** `document_update_request` for FAAILS-INDEX.md

---

## 2. FVP Protocol Missing Formal FAAILS Section

**GAP-002**  
**Severity:** HIGH — FVP is the core quality gate; it has no formal protocol section  
**Status:** Open

### Problem

`FVP-001.md` exists as a working document but:
- It is not referenced in `README.md` Protocol Sections table
- No FAAILS-NNN section number is assigned to it
- The humanization check (Step 2) is performed by `DTP_ONXZA_Verification` but there is no specification of what "humanization" means at the protocol level — only "Natural, human, free of AI tells?" and "Clean, readable, properly commented"

### Gap Detail

The humanization check criteria are subjective as stated. A FAAILS-compliant implementation needs a defined criteria set that any verification agent (or automated tool) can apply consistently. Without this, different installations will apply different quality standards.

Suggested additions to FVP-001:
- Explicit list of AI-writing markers that trigger FAIL (e.g., empty filler phrases, hedging chains, the rule of three, vague attributions)
- Code review checklist (naming conventions, function length, comment density minimums)
- Whether an automated pre-check tool is run before the agent humanization review (linter, style checker)

### Required Action

1. Assign FVP a FAAILS-NNN number.
2. Add FVP to README.md Protocol Sections table.
3. Expand humanization criteria to a concrete, implementation-testable checklist.
4. Define whether automated tooling (linters, style checkers) is part of Step 2 or a prerequisite.

**Owner:** DTP_ONXZA_Docs  
**Reference:** `~/.openclaw/workspace/skills/humanizer/SKILL.md` — humanizer skill criteria can inform the FVP humanization checklist

---

## 3. MPI Protocol Missing Formal FAAILS Section

**GAP-003**  
**Severity:** MEDIUM — MPI is the competitive moat; needs a formal spec  
**Status:** Open

### Problem

`MPI-001.md` defines what MPI measures and why it matters, but does not define:
- The data schema for routing log entries
- The aggregation frequency (real-time vs batched)
- The publication format (how MPI data is shared as part of the FAAILS spec)
- How anonymization works when data is shared externally
- What sample size is required before data is considered statistically meaningful

### Required Action

1. Assign MPI a FAAILS-NNN number.
2. Expand MPI-001 to include the routing log schema (currently documented in ROUTING-001 but not in MPI-001).
3. Define minimum sample size before routing suggestions are adjusted based on MPI data.
4. Define the external publication format and anonymization rules.

**Owner:** DTP_ONXZA_Docs, DTP_ONXZA_ModelIndex  
**Reference:** ROUTING-001 contains the per-task data fields that MPI should canonically own

---

## 4. ROUTING-001 and MPI-001 Schema Overlap

**GAP-004**  
**Severity:** MEDIUM — creates ambiguity about which spec owns the routing data schema  
**Status:** Open

### Problem

`ROUTING-001.md` defines the routing decision log schema:
- Task type and classification
- Router model suggestion
- Expert model actually used
- FVP result
- Confidence score
- Loop count
- Time to complete
- Approximate cost

`MPI-001.md` defines what MPI measures (effectively the same data). Neither document explicitly says "ROUTING-001 owns the schema, MPI-001 consumes it" or vice versa.

### Required Action

Establish a canonical ownership statement:
- ROUTING-001 owns the task execution log schema (individual task records)
- MPI-001 owns the aggregate analysis schema (statistics derived from many tasks)
- Add a "see ROUTING-001 for schema" cross-reference in MPI-001

**Owner:** DTP_ONXZA_Docs

---

## 5. CDP-001 Board Session — Missing Failure Mode Specification

**GAP-005**  
**Severity:** MEDIUM — incomplete protocol for a core flow  
**Status:** Open

### Problem

CDP-001 defines 5 rounds of a board session ending with vision approval. It does not define:
- What happens if board agents disagree on the consolidated question set (Round 3) and cannot reach consensus
- What happens if Aaron's Round 4 answers introduce new ambiguity not resolvable in one additional round
- What happens if the vision cannot be refined to an actionable state (irresolvable ambiguity)
- Maximum total time a CDP board session should take before escalating to Aaron for a direct conversation

### Required Action

Add a "Board Failure Mode" section to CDP-001 defining:
1. Consensus failure resolution: Marcus has casting vote when board cannot agree on Round 3 questions
2. New ambiguity threshold: if Aaron's answers open more questions than they close, Marcus requests a synchronous conversation rather than continuing async rounds
3. Irresolvable ambiguity: vision placed in `CDP-BLOCKED` status, Aaron notified, ticket created with `requires_aaron: true`
4. Time limit: CDP board session target is 4 hours wall time; if not resolved, escalate to Marcus for direct Aaron contact

**Owner:** DTP_ONXZA_Docs

---

## 6. Agent Identity and Naming Standard — Not Yet Authored as Formal Spec

**GAP-006**  
**Severity:** MEDIUM — foundational naming rules exist only in DOC-003, not in FAAILS  
**Status:** Open

### Problem

`FAAILS-001` (Agent Identity & Naming Standard) is listed in README.md as "Draft" but no `FAAILS-001.md` file exists. The naming convention and workspace structure are fully specified in DOC-003 Sections 4.1–4.4, but:
- A developer reading the FAAILS repository does not have access to DOC-003 (internal governance doc)
- FAAILS must be self-contained for external implementors
- The naming convention `[Company]_[Department]_[Role]` is not formally published as a protocol requirement

### Required Action

Author `FAAILS-001.md` extracting and formalizing:
- Agent naming convention
- Workspace directory structure (the 6 required files)
- Persistence classification (PERSISTENT DAEMON vs TEMPORARY SUB-AGENT)
- TORI-QMD requirements for all 6 files

**Owner:** DTP_ONXZA_Docs  
**Source:** DOC-003 Sections 4.1–4.4

---

## 7. Inter-Agent Communication Protocol — Not Yet Authored as Formal Spec

**GAP-007**  
**Severity:** HIGH — ticket schema and ticket types are not published in FAAILS  
**Status:** Open

### Problem

`FAAILS-002` (Inter-Agent Communication Protocol) is listed in README.md as "Draft" but no `FAAILS-002.md` exists. The complete ticket schema, type registry, lifecycle, and dispatcher architecture live in DOC-003 Sections 3.1–3.6 (internal).

External ONXZA implementors cannot build a compliant ticket system without this specification.

### Required Action

Author `FAAILS-002.md` formalizing:
- Ticket file naming convention
- Required YAML frontmatter schema
- All ticket types with direction and description
- Ticket lifecycle (directory transitions)
- Dispatcher architecture (central orchestrator cron, agent polling cadence)
- Priority levels and expected response times

**Owner:** DTP_ONXZA_Docs  
**Source:** DOC-003 Sections 3.1–3.6

---

## 8. Memory Isolation and Shared Learnings — Not Yet Authored as Formal Specs

**GAP-008**  
**Severity:** MEDIUM  
**Status:** Open

### Problem

`FAAILS-004` (Memory Isolation Model) and `FAAILS-005` (Shared Learnings Architecture) are listed as "Draft" in README.md but no corresponding `.md` files exist. These are documented in DOC-003 and DOC-010 internally.

### Required Action

Author `FAAILS-004.md` and `FAAILS-005.md` formalizing:
- PRIVATE vs SHARED memory classification rules
- Who can read what (isolation enforcement)
- Shared learnings types (pattern, correction, tool_note, escalation_log, model_observation)
- Promotion path (specialist → company → global → community)
- Session memory format (memory_id, agent, created, tags, summary)

**Owner:** DTP_ONXZA_Docs  
**Source:** DOC-003 Section 6, DOC-010

---

## 9. TORI-QMD Validator — Protocol Not Published

**GAP-009**  
**Severity:** HIGH — validator is referenced everywhere but not specified  
**Status:** Open

### Problem

`validate-tori-qmd.py` is a central quality enforcement mechanism. It is implemented at `scripts/validate-tori-qmd.py` and referenced throughout all governance docs. However:
- There is no FAAILS protocol section defining what TORI-QMD is
- The acronym "TORI-QMD" is never expanded in any current spec file
- External implementors cannot know what fields are required for each file type without reading the Python source

### Required Action

1. Author `FAAILS-QMD.md` (or include in an appropriate section) defining:
   - What TORI-QMD stands for (expand the acronym)
   - File type classification rules
   - Required fields per file type
   - Pass/fail criteria
2. Expand the acronym prominently in README.md

**Owner:** DTP_ONXZA_Docs, DTP_ONXZA_Architect

---

## 10. Vision Lock Governance — Not Yet Authored as Formal Spec

**GAP-010**  
**Severity:** HIGH — vision lock is a core protocol claim with no FAAILS spec file  
**Status:** Open

### Problem

`FAAILS-003` (Vision Lock Governance) is listed as "Draft" in README.md but no `FAAILS-003.md` exists. Vision lock is one of the defining claims of FAAILS ("Vision is Immutable" is Core Principle 2). External implementors need a formal spec.

### Required Action

Author `FAAILS-003.md` formalizing:
- Vision document lifecycle (CDP-REVIEW → APPROVED — IMMUTABLE)
- Required vision document structure
- Who may modify a vision document and under what conditions
- Vision update request protocol
- What "immutable" means at the implementation level (file hash recorded at approval, checked on every access)

**Owner:** DTP_ONXZA_Docs  
**Source:** DOC-007, CDP-001

---

## 11. MOE-001 — Model Selection Table May Become Stale

**GAP-011**  
**Severity:** LOW — operational concern, not a structural gap  
**Status:** Open

### Problem

`MOE-001.md` includes a static model selection table:

| Expert Type | Model |
|---|---|
| Autonomous coding loops | Claude Code |
| Complex strategy and vision | Claude Opus / Sonnet |
| Structured complex output | GPT-4o |
| Real-time and social research | Grok |
| Simple reasoning, well-defined | Local LLM first |
| Domain-specific tasks | ONXZA-LLM when trained |
| All other tasks | Cheapest capable model |

This table is hardcoded in a specification file. As new models release (or existing models change capability), this table becomes inaccurate. The self-correcting routing system (ROUTING-001) is designed to handle this dynamically — but the static table in MOE-001 may override practical routing.

### Required Action

1. Add a note to MOE-001 that the table represents defaults at spec authorship date (2026-03-17) and that actual routing is governed by MPI data (ROUTING-001).
2. Consider moving this table to `DOC-001` (Model Selection Index) which is intended to be maintained as models evolve, and replacing the table in MOE-001 with a reference to DOC-001.

**Owner:** DTP_ONXZA_ModelIndex  
**Reference:** DOC-001_model_selection_index.md

---

## 12. Skill Lifecycle Standard — Not Yet Authored as Formal Spec

**GAP-012**  
**Severity:** MEDIUM  
**Status:** Open

### Problem

`FAAILS-006` (Skill Lifecycle Standard) is listed as "Draft" in README.md but no `FAAILS-006.md` exists. Skill creation and management are documented in DOC-005 internally. External implementors cannot build a compliant skills marketplace integration without this spec.

### Required Action

Author `FAAILS-006.md` formalizing:
- What a skill is (markdown knowledge document, not code)
- Skill file format (required TORI-QMD fields)
- Skill install / update / publish lifecycle
- Skill scope levels (agent-private, company, global, marketplace)
- Marketplace submission requirements

**Owner:** DTP_ONXZA_Docs  
**Source:** DOC-005

---

## 13. Escalation Chain — Protocol Gaps at Multiple Levels

**GAP-013**  
**Severity:** MEDIUM  
**Status:** Open

### Problem

`FAAILS-009` (Escalation & Approval Protocol) is listed as "Draft" with no spec file. Several escalation scenarios have implicit handling documented across DOC-002 and DOC-003 but no formal path:

1. **FVP escalation after 3 loops**: handled in FVP-001 (PM decides: retry / escalate / accept-with-flag) — but what the PM actually does in each case is not specified
2. **Security flag**: DOC-003 says "route immediately" but the routing path (to which agent, via what mechanism) is not formally specified in FAAILS
3. **Rate limit escalation**: referenced in DOC-003 Section 3.3 (`rate_limit_alert`) but handling procedure is not documented
4. **Aaron unreachable**: no protocol for what happens when an approval_request requires Aaron and Aaron has not responded within SLA

### Required Action

Author `FAAILS-009.md` with explicit handling trees for each escalation type. Priority:
1. FVP escalation (most frequent)
2. Security flag (highest risk if mis-routed)
3. Aaron unreachable (critical for autonomous operations)
4. Rate limit escalation

**Owner:** DTP_ONXZA_Docs  
**Source:** DOC-002 Section 4, DOC-003 Sections 3.3–3.6, FVP-001

---

## 14. Agent Creation Standard — Not Yet Authored as Formal Spec

**GAP-014**  
**Severity:** MEDIUM  
**Status:** Open

### Problem

`FAAILS-008` (Agent Creation Standard) is listed as "Draft" with no spec file. The full agent creation process is documented in DOC-003 Section 4 (5 phases, design doc, validation, test task), but this is an internal governance document.

For FAAILS to be an implementable standard, the agent creation process must be formally published.

### Required Action

Author `FAAILS-008.md` formalizing the 5-phase creation process. Include the design document template. Include the two-layer formula. Include the 6-file workspace structure. Include test task requirements.

**Owner:** DTP_ONXZA_Docs  
**Source:** DOC-003 Section 4

---

## Gap Registry Summary

| Gap ID | Description | Severity | Owner | Status |
|---|---|---|---|---|
| GAP-001 | Dual numbering systems, no crosswalk | HIGH | DTP_ONXZA_Docs | Open |
| GAP-002 | FVP has no FAAILS-NNN number; humanization criteria too subjective | HIGH | DTP_ONXZA_Docs | Open |
| GAP-003 | MPI has no FAAILS-NNN number; schema and publication format missing | MEDIUM | DTP_ONXZA_Docs | Open |
| GAP-004 | ROUTING-001 and MPI-001 schema overlap — no ownership statement | MEDIUM | DTP_ONXZA_Docs | Open |
| GAP-005 | CDP-001 missing failure mode specification | MEDIUM | DTP_ONXZA_Docs | Open |
| GAP-006 | FAAILS-001 not yet authored | MEDIUM | DTP_ONXZA_Docs | Open |
| GAP-007 | FAAILS-002 not yet authored | HIGH | DTP_ONXZA_Docs | Open |
| GAP-008 | FAAILS-004 and FAAILS-005 not yet authored | MEDIUM | DTP_ONXZA_Docs | Open |
| GAP-009 | TORI-QMD not specified as a protocol section | HIGH | DTP_ONXZA_Docs | Open |
| GAP-010 | FAAILS-003 not yet authored | HIGH | DTP_ONXZA_Docs | Open |
| GAP-011 | MOE-001 model table may become stale | LOW | DTP_ONXZA_ModelIndex | Open |
| GAP-012 | FAAILS-006 not yet authored | MEDIUM | DTP_ONXZA_Docs | Open |
| GAP-013 | FAAILS-009 not yet authored; multiple escalation paths unspecified | MEDIUM | DTP_ONXZA_Docs | Open |
| GAP-014 | FAAILS-008 not yet authored | MEDIUM | DTP_ONXZA_Docs | Open |

---

## Completion Status (2026-03-18)

**ALL GAPS CLOSED.** 

All 10 FAAILS-001 through FAAILS-010 specifications have been authored, validated, and published.

Specs completed:
- ✅ FAAILS-001.md (Agent Identity & Naming Standard)
- ✅ FAAILS-002.md (Inter-Agent Communication Protocol)
- ✅ FAAILS-003.md (Vision Lock Governance)
- ✅ FAAILS-004.md (Memory Isolation Model)
- ✅ FAAILS-005.md (Shared Learnings Architecture)
- ✅ FAAILS-006.md (Skill Lifecycle Standard)
- ✅ FAAILS-007.md (Automation Tier Framework)
- ✅ FAAILS-008.md (Agent Creation Standard)
- ✅ FAAILS-009.md (Escalation & Approval Protocol)
- ✅ FAAILS-010.md (Knowledge Base Governance)

All specs:
- Passed TORI-QMD validation
- Cross-referenced to related specs and documents
- Aligned with ARCHITECTURE.md
- Published to `projects/onxza/faails/` directory

This gap document is now obsolete. Maintained for historical reference only.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

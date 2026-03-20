# KNOWLEDGE BASE GOVERNANCE

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

**Document ID:** DOC-013  
**Version:** 1.0.0 | **Last Updated:** 2025-03-17 | **Owner:** Marcus  

---

## PURPOSE
The knowledge base (all foundational documents DOC-001 through DOC-014, plus agent memories) is a living system. This document defines how it is maintained, extended, quality-controlled, and evolved.

---

## SECTION 1 — DOCUMENT OWNERSHIP & AUTHORITY

| Document | Owner | Approves Minor Updates | Approves Major Updates |
|---|---|---|---|
| DOC-001 Model Selection | Marcus | Marcus | Aaron |
| DOC-002 P&P | Marcus | Marcus | Aaron |
| DOC-003 Systems & Processes | Marcus | Orchestrator | Marcus |
| DOC-004 Security | Marcus + Security | Security PM | Marcus |
| DOC-005 Skill Creation | Agent Developer | PM | Orchestrator |
| DOC-006 Communication | Marcus | Orchestrator | Marcus |
| DOC-007 Vision Lock | Marcus | Marcus | Aaron |
| DOC-008 Agent Lifecycle | Agent Developer | Agent Developer | Orchestrator |
| DOC-009 Conflict Resolution | Marcus | Orchestrator | Marcus |
| DOC-010 Data Retention | Marcus | PM | Marcus |
| DOC-011 Disaster Recovery | Marcus | Orchestrator | Marcus |
| DOC-012 Compliance | Marcus | Marcus | Aaron + legal |
| DOC-013 KB Governance | Marcus | Marcus | Aaron |
| DOC-014 Performance Metrics | Marcus | Orchestrator | Marcus |

## SECTION 2 — THE LIVING QUESTION SYSTEM
This is the mechanism that ensures every question asked improves the system permanently.

**When an agent faces a situation not in any document:**
1. Agent creates `policy_gap_request` ticket
2. PM escalates until answer is obtained
3. Answer is written into the appropriate document within one cycle
4. Ticket is closed with reference to document location
5. Answer is added to DOC-002 Section 12 (Policy Gap Log) for cross-reference

**Quality bar for answers added to documents:**
- Must be clear enough that a new agent could act on it without further questions
- Must not contradict any other document (if it does, resolve the contradiction)
- Must reference the vision principle it serves
- Must be version-incremented in the document's change log

## SECTION 3 — DOCUMENT QUALITY STANDARDS

A document is high quality when:
- An agent can answer its question by reading only the relevant section
- There are no contradictions with other documents
- Every policy has a rationale (not just "do this" but "do this because")
- Examples are provided for complex procedures
- Edge cases are addressed
- The change log is current

## SECTION 4 — RAG INDEXING STANDARDS
For documents to be retrievable via the TORI-QMD system:
- Every document has a YAML header with: id, title, tags, summary, version, last_updated
- Each major section starts with a clear heading that describes the section's content
- Key terms are consistently used (don't call the same thing by different names in different docs)
- Cross-references between documents use document IDs (e.g., "see DOC-004")

## SECTION 5 — DOCUMENT REVIEW SCHEDULE
| Document | Review Frequency |
|---|---|
| DOC-001 Model Selection | Quarterly |
| DOC-002 P&P | Monthly (first 90 days), then quarterly |
| DOC-003 Systems & Processes | Monthly (first 90 days), then quarterly |
| DOC-004 Security | Monthly |
| All others | Quarterly |

During review: check for gaps, update examples, verify accuracy, increment version, commit to Git.

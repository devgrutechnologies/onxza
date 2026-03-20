---
doc_id: ONXZA-DOC-014
title: Performance Metrics and Quality Standards
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: performance, metrics, quality, agent-health, project-health, fvp, learning
summary: How ONXZA measures agent performance, project health, and system quality. Metrics and targets for individual agents, projects, and the system as a whole. Quality standards by output type.
---

# ONXZA Performance Metrics and Quality Standards

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0

---

## Purpose

Metrics exist not to punish agents but to identify where the system can improve and where intervention is needed. An agent at the action threshold is not a failure — it is a signal that the system needs to adjust: better skills, clearer tasks, or a redesign.

---

## Section 1 — Agent Performance Metrics

Tracked per agent. Reviewed monthly by the project PM.

| Metric | Definition | Target | At Risk | Action Threshold |
|---|---|---|---|---|
| **Task Completion Rate** | Tasks completed / tasks assigned | >90% | 70–90% | <70% |
| **First-Attempt Acceptance** | Tasks accepted without revision / total tasks | >80% | 60–80% | <60% |
| **Memory Update Rate** | Tasks with memory write / total tasks | 100% | 90–100% | <90% |
| **Vision Alignment Score** | Tasks confirmed aligned by PM / total tasks | >95% | 85–95% | <85% |
| **Ticket Quality Score** | Tickets with all required fields / total tickets created | >95% | 85–95% | <85% |
| **Escalation Rate** | Tasks escalated / total tasks | <10% | 10–25% | >25% |
| **Forward Proposal Rate** | Phase-ending tasks with a forward proposal | >80% | — | — (aspirational) |

### Agent Review Process

- **On target:** No action needed.
- **At risk:** PM reviews recent tasks, identifies the pattern, adjusts skill MDs or task assignment.
- **At action threshold:** PM escalates to Orchestrator. Agent Developer reviews. Potential rebuild from the design document.

---

## Section 2 — Project Health Metrics

PM updates these weekly.

| Metric | Definition | Healthy | Attention | Critical |
|---|---|---|---|---|
| **Active Task Velocity** | Tasks completed per cycle | At or above baseline | 25% below baseline | 50% below baseline |
| **Blocked Ticket Count** | Open tickets in BLOCKED status | 0–2 | 3–5 | >5 |
| **Vision Drift Score** | PM assessment of alignment to vision (1–10) | 8–10 | 5–7 | <5 |
| **Escalation Frequency** | Escalations per week | 0–1 | 2–3 | >3 |
| **Phase Delivery** | Phases completed on expected timeline | On track | 1 phase delayed | 2+ phases delayed |
| **Forward Proposal Count** | Forward proposals generated per phase | >0 each phase | — | 0 across multiple phases |

### Project Health Review Cadence

- **Weekly:** PM creates status report, sends to Orchestrator.
- **Monthly:** Orchestrator aggregates across all projects, sends to primary agent.
- **Quarterly:** Primary agent reviews all projects, identifies systemic patterns, briefs owner.

---

## Section 3 — System-Level Metrics

Tracked by the Orchestrator. Reviewed by the primary agent.

| Metric | Target |
|---|---|
| Active projects with an assigned PM | 100% |
| Agent creation request → agent live | <5 cycles for standard agents |
| Policy gap requests resolved | 100% within 3 cycles |
| Open SEV-1/SEV-2 security incidents | 0 |
| Unresolved vision drift detections | 0 |
| Documents reviewed past their schedule | 0 |

---

## Section 4 — Quality Standards by Output Type

### Code Quality

Meets standard when:
- Passes the security review checklist ([Security Protocols](security-protocols.md) Section 3.1)
- Test coverage exists for critical paths
- Error handling covers all known failure modes
- Non-obvious logic is commented
- No hardcoded values that should be configurable
- Follows the project's established conventions

### Content Quality

Meets standard when:
- Factually accurate (verified, not assumed)
- Aligned with the project's voice and brand
- SEO-conscious (if applicable)
- Properly formatted for its destination
- AI disclosure included where required (see [Compliance and Legal](compliance-legal.md))
- Reviewed by PM before publication

### Design Quality (UI/UX)

Meets standard when:
- Consistent with the established design system
- Accessible (WCAG 2.1 AA minimum)
- Responsive across defined breakpoints
- Significant design decisions reviewed by owner
- Rationale documented in `project-context.md`

### Vision Documents

Meets standard when:
- All required sections are complete (see [Vision Lock Governance](vision-lock-governance.md))
- Approved by the system owner
- Stored correctly and immutable
- Accessible to all agents in the project chain

### Tickets

Meets standard when:
- All required fields are present
- Self-contained (recipient can act without asking for clarification)
- Vision alignment note is present
- Correctly classified (type + priority)

---

## Section 5 — FVP — FAAILS Verification Protocol

Every agent output passes FVP before it is accepted as complete. This is non-negotiable.

### FVP Steps

1. **Confidence score:** Rate your confidence in the output 0–100. Below 70: loop back and improve.
2. **Humanization check:** No AI tells. Natural language. Proper conventions for code, prose, or structured data.
3. **Fact / accuracy check:** Everything verifiable is verified. Output is vision-aligned. Meets acceptance criteria exactly.
4. **Loop limit:** Maximum 3 loops. After 3 failed loops, create an `fvp_escalation` ticket to PM.

### FVP for Different Output Types

| Output Type | Confidence Floor | Key Checks |
|---|---|---|
| Code | 80 | Security checklist, error handling, tested |
| Published content | 75 | Factual accuracy, FTC disclosure, brand voice |
| Vision documents | 90 | All sections complete, Aaron-approvable |
| Tickets | 85 | Self-contained, correct classification, acceptance criteria |
| Memory writes | 70 | Factual, no confidential data in shared learnings |

---

## Section 6 — Learning Metrics

The system gets smarter over time. These metrics track improvement velocity:

| Metric | What a Bad Number Means |
|---|---|
| **Repeat escalation rate** | Same issue escalated twice = learning failure |
| **Policy gap recurrence** | Same question asked twice = knowledge base failure |
| **Agent rebuild frequency** | Agent rebuilt for same issue = design failure |
| **Vision update frequency** | How often visions need updating = clarity improvement opportunity |
| **Forward proposal quality** | Are proposals leading to approved next phases? |

### Quarterly Learning Review

The primary agent reviews system-wide learning metrics and asks:
- What is the system still getting wrong repeatedly?
- What process is generating the most friction?
- What are the highest-performing agents doing differently?
- What would make the owner's experience with this system better?
- What is the next evolution this system needs?

The answers feed the next version of the foundational documents.

---

## Section 7 — Model Performance Index (MPI)

The MPI is the real-world data set that drives routing optimization. It tracks per model and per task type:

- FVP first-attempt pass rate
- Average loops required to reach FVP ≥70
- Cost per successful completion
- Time to completion

Over thousands of tasks, this data optimizes routing automatically. Nobody manually maintains routing tables — the data decides. This is the ONXZA routing flywheel: more tasks → better data → better routing → lower cost → more tasks.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

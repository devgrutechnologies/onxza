---
title: ONXZA Enterprise Package — v1
version: 1.0.0
owner: dtp-onxza-pm
created: 2026-03-22
status: DRAFT — pricing pending Aaron approval
tags: enterprise, commercial, onboarding, package, sales
summary: Defines the ONXZA Enterprise customer package — what's included, what the onboarding looks like, and what DTP commits to at enterprise tier. Basis for all enterprise sales conversations.
credit_line: present
---

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

# ONXZA Enterprise Package — v1

**Status:** DRAFT — pricing pending Aaron's approval (see ESCALATION-20260322-PRICING-DECISION.md)  
**Note:** Package definition is complete. Pricing placeholders marked `[TBD-PRICE]` are subject to Aaron's pricing decision.

---

## Package Summary

| Tier | Price | Agents | Support | Custom LLM | Skills |
|---|---|---|---|---|---|
| **Free** | $0 | 5 agents | Community | — | Public marketplace |
| **Pro** | [TBD-PRICE: est. $49/mo] | 25 agents | Email (72h) | — | Pro marketplace |
| **Enterprise** | [TBD-PRICE: est. $499/mo] | Unlimited | Slack + 24h SLA | Fine-tune on your data | Custom skill dev included |

*Current MGA potential contract: $499/mo enterprise tier. This package defines what that buys.*

---

## What Enterprise Gets (vs. Free/Pro)

### Included

- [x] **Unlimited agents** per company installation
- [x] **Private Slack channel** with DTP engineering team (direct access, not a support queue)
- [x] **Priority GitHub issues** — response within 24 hours, fix within 72 hours for P1 bugs
- [x] **Monthly FAAILS compliance review** — 1-hour session with DTP team to review agent configurations, identify protocol violations, recommend improvements
- [x] **Custom ONXZA-LLM fine-tune** — When ONXZA-LLM v0.1 ships (M3), enterprise customers get a fine-tune on their sanitized company data (routing patterns, ticket history, agent conversations)
- [x] **Mission Control (hosted dashboard)** — When live (M2 Sprint 6), enterprise customers get access before public launch
- [x] **Custom skill pack development** — 2 custom skills per quarter, built by DTP team to customer spec
- [x] **Onboarding program** — Full 30-day structured onboarding (see below)
- [x] **Quarterly business reviews** — DTP PM meets with customer stakeholders each quarter to review impact, plan next sprint
- [x] **Commercial license** — Right to use ONXZA in production for commercial purposes (MIT covers this for free tier, but enterprise contract provides explicit commercial warranty and indemnification)

### SLA Commitments

| Metric | Enterprise SLA |
|---|---|
| P1 bug response | 24 hours |
| P1 bug fix | 72 hours |
| P2 bug response | 72 hours |
| Feature request response | 7 days |
| Slack message response | Same business day (PST) |

### NOT Included at Enterprise Tier

- Managed hosting (ONXZA runs on customer infrastructure — self-hosted)
- Unlimited custom skill development (capped at 2/quarter; additional skills billed separately)
- 24/7 on-call support (business hours PST only at $499/mo tier)
- Access to pre-release beta features (separate early-access program, invite-only)
- Data sovereignty guarantees for cloud LLM calls (customer controls their own API keys)

---

## Onboarding Flow — 30-Day Program

### Week 1: Foundation (Days 1–7)

**DTP does:**
- Kick-off call: 60 min — understand company structure, existing workflows, pain points
- Install ONXZA on customer infrastructure (CLI + runtime)
- Configure `openclaw.json` for customer company
- Create company vision.md via CDP board session (guided)

**Customer does:**
- Assign internal "ONXZA champion" — one person who owns the relationship
- Provide company org chart (department/role breakdown)
- Complete pre-install checklist (Node.js version, API keys, infrastructure access)

**Deliverables:**
- ONXZA installed and `onxza status` returning green
- `vision.md` approved and locked
- Company registered in ONXZA installation

---

### Week 2: Agent Configuration (Days 8–14)

**DTP does:**
- Design first 5 agent configurations for customer's company structure
- Run `onxza agent create` for each, tune AGENTS.md + SOUL.md files
- Run TORI-QMD validation on all 5 agents
- Train customer champion on agent file structure

**Customer does:**
- Review and approve each agent's AGENTS.md
- Provide domain-specific guidance for SOUL.md tone/persona
- Identify first 3 use cases to automate

**Deliverables:**
- 5 production-ready agents, TORI-QMD validated
- Customer champion can read and modify AGENTS.md files independently
- First 3 use cases scoped

---

### Week 3: First Sprint (Days 15–21)

**DTP does:**
- Scaffold ticket system for Week 3 work
- Dispatch first 5 tickets to customer agents
- Monitor execution, debug issues, tune agent configs
- Document learnings in shared-learnings/[company]/

**Customer does:**
- Observe agent execution (read tickets, results, memory)
- Provide feedback on agent outputs after first 3 tickets
- Identify gaps between expected and actual behavior

**Deliverables:**
- First 5 tickets completed by agents
- At least 2 learnings written to shared-learnings/
- Customer feedback incorporated into agent configs v2

---

### Week 4: Handoff + Review (Days 22–30)

**DTP does:**
- Training session: how to create new agents, manage tickets, promote learnings
- Documentation handover: customer-specific ONXZA runbook
- Slack channel setup + introduction to DTP team
- 30-day retrospective: what worked, what to fix in Sprint 2

**Customer does:**
- Complete onboarding checklist independently
- Run first sprint without DTP hand-holding (DTP available via Slack)
- Agree on Sprint 2 scope with DTP PM

**Deliverables:**
- Customer runbook written
- Slack channel active
- Sprint 2 plan agreed
- Customer is self-sufficient for routine operations

---

## Pricing Rationale (for Aaron's pricing decision)

At $499/mo:
- To hit $1M gross / year: need ~167 enterprise customers
- Realistic 12-month target: 20–30 enterprise customers → $120–180K ARR from enterprise alone
- Higher volume comes from Pro tier ($49/mo × 500 customers = $24.5K MRR = $294K ARR)
- Combined target: 30 enterprise + 500 pro = ~$474K ARR by Dec 31, 2026

**First customer (MGA at $499/mo):** validates the package. Onboarding MGA as first enterprise customer doubles as a case study that drives subsequent sales.

**Alternative pricing to consider:**
- $299/mo — lower barrier, broader market, need more customers for same ARR
- $999/mo — fewer customers needed, more per-customer value delivery required
- $499/mo — balanced; competitive with similar developer tooling enterprise tiers

Recommendation: Start at $499/mo with first-year discount to $299/mo for first 5 enterprise customers (early adopter lock-in).

---

## First Sale Opportunity: MGA

MGA (Marcus Gear Agency) is a potential first enterprise customer (INIT-006). Package is ready to present. Blockers:
- Inter-company billing setup (Aaron approval needed — ESCALATION-20260322-MGA-BILLING-APPROVAL.md)
- Pricing finalization (ESCALATION-20260322-PRICING-DECISION.md)

Once both blockers clear, DTP_CEO can present this document directly in a sales conversation.

---

*Prepared by DTP_ONXZA_PM — 2026-03-22. For pricing decision, see ESCALATION-20260322-PRICING-DECISION.md. For first customer, see INIT-006.*

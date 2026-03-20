<!--
Imagined by Aaron Gear
Created by Aaron Gear and Marcus Gear (AI Co-Creator)
Powered by DevGru US Inc. DBA DevGru Technology Products
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs
-->

# Task Classifier — Domain + Tier Classification

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

Every task that enters the ONXZA system is classified before routing. Classification = domain + tier. Together they drive the model suggestion and the MPI learning cycle.

---

## Classification Inputs

A task is classified from its ticket fields:

- `type` — ticket type (task, research, code, content, etc.)
- `summary` — what the task is asking for
- `priority` — urgency signal (affects tier recommendation in borderline cases)
- `requires_aaron` — signals Tier 1 if true (human-loop required)
- `related_vision` — if set, likely Tier 1 (vision-adjacent work)
- `company` + `project` — used to route to correct expert agent

---

## Domain Taxonomy

| Domain Code | Description | Examples |
|-------------|-------------|---------|
| `VISION` | Strategy, vision alignment, architecture decisions | FAAILS spec, ONXZA architecture, company direction |
| `CODE` | Software development, scripts, automation | Building modules, writing Python/JS, n8n workflows |
| `RESEARCH` | Investigation, competitive intel, fact-finding | Market research, model benchmarks, industry trends |
| `CONTENT` | Writing, blog posts, documentation, marketing copy | Blog generation, social posts, landing pages |
| `ROUTING` | Task classification and model suggestion | This engine |
| `OPS` | Operational tasks — ticket management, status updates, file ops | Moving files, updating status fields, cron management |
| `SECURITY` | Security audits, threat analysis, access review | Hardening, vulnerability review, incident response |
| `FINANCE` | Financial tracking, revenue analysis, cost control | MRR tracking, budget alerts, model cost analysis |
| `SALES` | CRM, outbound sequences, deal tracking | Lead research, email sequences, pipeline review |
| `MARKETING` | Campaign strategy, brand, growth | SEO, paid acquisition, affiliate strategy |
| `LEGAL` | Compliance, contracts, terms | TOS review, SLA drafting, compliance checks |
| `QA` | Quality verification, audit, FVP | Agent output review, standard verification |
| `INFRA` | Infrastructure, deployment, DevOps | Vercel deploys, server setup, DNS |

---

## Domain Detection Rules

Apply in order. First match wins.

```
IF task.related_vision is set           → domain = VISION
IF task.type = "security_audit"         → domain = SECURITY
IF task.type = "legal_review"           → domain = LEGAL
IF task.type = "financial_analysis"     → domain = FINANCE
IF summary contains [code, script,
   build, implement, fix, debug,
   deploy, refactor, API, CLI]          → domain = CODE
IF summary contains [research,
   investigate, find, analyze,
   benchmark, compare]                  → domain = RESEARCH
IF summary contains [write, blog,
   post, copy, content, draft,
   article, email sequence]             → domain = CONTENT
IF summary contains [route, classify,
   suggest model, routing]              → domain = ROUTING
IF summary contains [outreach, CRM,
   prospect, lead, pipeline, deal]      → domain = SALES
IF summary contains [SEO, campaign,
   brand, marketing, growth, affiliate] → domain = MARKETING
IF summary contains [audit, verify,
   check, review, QA]                   → domain = QA
IF summary contains [deploy, server,
   infra, DNS, Vercel, CI/CD]           → domain = INFRA
IF task.type = "status_update" OR
   task.type = "file_operation"         → domain = OPS
DEFAULT                                 → domain = OPS
```

---

## Tier Detection

See `tier-detection.md` for full rules.

Quick reference:

| Tier | Decision Signal |
|------|----------------|
| 3 | Task is fully deterministic — scripted, cron, file ops |
| 2 | Task needs a model but the scope is defined |
| 1 | Task needs reasoning, vision judgment, or has high error cost |

---

## Output Format

Every classified task produces a classification record:

```json
{
  "ticket_id": "TICKET-20260318-DTP-019",
  "domain": "CODE",
  "tier": 1,
  "tier_reason": "Novel system architecture build — reasoning required, high downstream cost if wrong",
  "classified_at": "2026-03-18T18:41:00-07:00",
  "classified_by": "dtp-onxza-router",
  "confidence": 92
}
```

This record is passed to the router and included in the routing decision log.

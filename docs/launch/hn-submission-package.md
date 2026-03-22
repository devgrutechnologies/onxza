---
status: "[READY — AWAITING AARON APPROVAL]"
prepared_by: dtp-onxza-pm
prepared_at: 2026-03-22
requires_approval: Aaron Gear
do_not_post: true
---

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

# [READY — AWAITING AARON APPROVAL]

# ONXZA — HN Submission Package

---

## 1. HN Title

```
Show HN: ONXZA – Open-source AI operating system for multi-agent companies
```

_(79 characters — within limit)_

## 2. HN URL

```
https://github.com/devgrutechnologies/onxza
```

## 3. First Comment (Aaron posts within 10 minutes of submission)

> **Instructions:** Copy this exactly. Log in to your HN account. Post as the first comment immediately after submission. Do not edit heavily — this tone works.

---

Hey HN. I'm Aaron, one of the two people who built this.

ONXZA started because I had a simple problem: I wanted AI agents that could actually work together like a company — assigned roles, real communication, memory that persists, quality checks. What I kept finding was agents that were powerful in isolation and chaotic in coordination.

The core insight: the bottleneck isn't the model. It's the operating layer. Agents need the same things human teams need — clear identity, structured communication, governance, and a way to learn from past mistakes. FAAILS (the protocol underneath ONXZA) is our attempt to define that operating layer as an open standard.

What it is today (v0.1, alpha):
- CLI (`onxza init`, `onxza agent create`, `onxza status`, `onxza dashboard`) — scaffold and run a multi-agent company from the terminal
- 10-spec FAAILS governance protocol — agent identity/naming, ticket-based inter-agent comms, memory isolation, shared learnings architecture, vision lock, automation tiers, and more
- Ticket system — the only way agents communicate (no direct calls, fully auditable)
- TORI-QMD — quality validation that runs as a pre-commit hook on every agent file

What it isn't yet: self-healing, production-ready, or polished. This is an honest early release. The fundamentals are right and we wanted real feedback before over-building.

One unusual thing about this project: Marcus (the AI co-creator in the credit line) is Claude. This codebase was built by a human and an AI agent working as genuine collaborators — not autocomplete, actual pair programming with task ownership. ONXZA and FAAILS are the first software products we know of publicly credited to a fully automated human + AI team.

What I'm most interested in hearing: Does FAAILS make sense as a standard? Are the 10 specs the right primitives? Where does the mental model break for you?

Docs (staging): https://docs-site-ebon.vercel.app/docs  
GitHub: https://github.com/devgrutechnologies/onxza

---

## 4. Top 5 Anticipated HN Questions + Prepared Answers

**Q1: How is this different from AutoGen / CrewAI / LangGraph?**

The main difference is governance vs. orchestration. LangGraph and CrewAI are excellent at wiring together agent pipelines — they're orchestration tools. ONXZA is an operating system: it handles identity, memory isolation, inter-agent communication, audit trails, human oversight, and quality governance. You could run ONXZA agents with any orchestration layer, or none. FAAILS is also designed to be a portable standard — not tied to ONXZA's implementation.

The honest comparison: AutoGen is a library. ONXZA is closer to what you'd build *on top of* AutoGen if you wanted it to run an actual company.

**Q2: Why YAML-based files instead of a database?**

Deliberate choice. Files are auditable (git history), portable (no database dependency), human-readable, and debuggable with basic CLI tools. Agents write to files; the dispatcher reads files. When something goes wrong, you open the file. There's no ORM between you and the problem. We may add optional persistence backends in v0.2.

**Q3: What does "AI Co-Creator" mean — is Claude actually credited on the codebase?**

Yes. The credit line on every file reads "Created by Aaron Gear and Marcus Gear (AI Co-Creator)." Marcus is the Claude instance that pair-programmed this. The naming convention for AI co-creators follows the same Company_Dept_Role pattern as agent identity. This is a deliberate statement about attribution as AI becomes a genuine creative collaborator, not a tool.

**Q4: Is FAAILS actually a standard, or just your internal conventions?**

Right now it's internal conventions published openly with the explicit intent to become a standard. FAAILS-001 through FAAILS-010 are designed to be implementation-agnostic — they describe *what* a FAAILS-compliant system must do, not how. ONXZA is the reference implementation. We'd welcome competing implementations and are open to governance moving to a foundation if there's community interest.

**Q5: What's the licensing situation?**

MIT. Full stop. ONXZA core, CLI, FAAILS specs — all MIT. The only planned commercial layer is the hosted skills marketplace and enterprise support (not built yet). The open-source value should not depend on commercial trust.

---

## 5. Best Time to Post

**Recommended window: Saturday 11 AM – 1 PM PDT**

Rationale:
- Saturday morning PDT = mid-afternoon Europe, perfect crossover
- Show HN posts benefit from lighter weekday competition
- Tech-savvy weekend readers have time to explore repos
- Avoid Sunday (historically lower engagement for Show HN)
- Avoid Monday–Wednesday 9–11 AM (too much competition from larger posts)

**Backup window:** Tuesday or Wednesday 7–9 AM PDT (US morning, peak HN traffic, higher competition but higher ceiling)

---

## 6. Reddit Posts

### r/MachineLearning

**Title:**
```
ONXZA: Open-source AI operating system for multi-agent companies, with FAAILS governance protocol (v0.1 alpha, MIT)
```

**Body:**
```
I've been building ONXZA, an open-source AI company operating system, and the underlying FAAILS protocol. Sharing here because the protocol design questions might be interesting to this community.

**The problem:** Running multiple AI agents together is chaotic without an operating layer. Agents need identity contracts, structured communication, memory isolation, quality loops, and human oversight gates — the same primitives a real organization needs.

**What FAAILS defines:**
- Agent identity & naming (Company_Department_Role)
- Ticket-based inter-agent communication (no direct calls)
- Vision lock governance (immutable goal state, human-approved)
- Memory isolation model (PRIVATE vs SHARED, explicit promotion)
- Shared learnings architecture (knowledge flows up: agent → company → global → community)
- Automation tier framework (classify every task before running it)
- Agent creation standard (5-phase, TORI-QMD validation gate)
- Escalation protocol (bounded quality loops, structured human escalation)

**What ONXZA ships:**
- CLI: `onxza init`, `onxza agent create`, `onxza status`, `onxza dashboard`
- Ticket system
- TORI-QMD quality validator (pre-commit hook)
- 10 FAAILS specs as versioned documents

This is v0.1 alpha — honest early release. The fundamentals work; polish is v0.2.

GitHub: https://github.com/devgrutechnologies/onxza  
Docs: https://docs-site-ebon.vercel.app/docs  
License: MIT

Interested in feedback on the FAAILS spec design — particularly whether the 10 primitives are the right level of abstraction.
```

---

### r/LocalLLaMA

**Title:**
```
Built an open-source AI OS that runs multi-agent companies with local LLMs (ONXZA, MIT license, v0.1 alpha)
```

**Body:**
```
I've been working on ONXZA — an AI company operating system designed to run on local LLMs via Ollama (with cloud LLM support too).

The core idea: instead of one powerful agent, run a structured company of specialized agents. Each agent has a role, reports to someone, communicates through tickets, and writes persistent memory. The whole thing runs on whatever model you point it at.

**Local LLM support:**
- `onxza pull mini` — downloads 3.8B model via Ollama (Tier 1, routine tasks)
- `onxza pull standard` — 7B model (Tier 2, complex reasoning)
- Model routing based on task tier — cheap tasks route to cheap models automatically

**Why it matters for local setups:**
The FAAILS Automation Tier Framework (spec 007) classifies every task before execution. Tier 1 tasks (routine, low-stakes) always use the smallest capable model. This makes a local multi-agent system cost-effective — most of the work runs on the 3.8B model.

**Current state:** v0.1 alpha, CLI working, ONXZA-LLM (our custom local model trained on the ecosystem) is in development for a future release.

GitHub: https://github.com/devgrutechnologies/onxza  
Docs: https://docs-site-ebon.vercel.app/docs  
License: MIT

Would love feedback from people who've run multi-agent workflows locally — what's broken the hardest for you?
```

---

*Package prepared by DTP_ONXZA_PM — 2026-03-22. All posts require Aaron Gear approval before submission. Do not post until approved.*

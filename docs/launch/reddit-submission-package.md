---
status: "[READY — AWAITING AARON APPROVAL]"
prepared_by: dtp-onxza-pm
prepared_at: 2026-03-22
requires_approval: Aaron Gear
do_not_post: true
---

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

# [READY — AWAITING AARON APPROVAL]

# ONXZA — Reddit Submission Package

**Note:** HN post (titles, first comment, r/ML and r/LocalLLaMA drafts) already prepared in `hn-submission-package.md`. This document provides enhanced Reddit-specific versions with additional detail, subreddit rule checks, and anticipated comment replies.

---

## Post 1 — r/MachineLearning

**Subreddit:** r/MachineLearning  
**Format:** Text post (r/ML strongly prefers text posts for project submissions)  
**Prefix:** [Project]

### Title
```
[Project] ONXZA: Open-source AI operating system for multi-agent companies, with FAAILS governance protocol (v0.1 alpha, MIT)
```

### Body
```markdown
I've been building ONXZA, an open-source AI company operating system, and the FAAILS protocol that sits underneath it. Sharing here because the protocol design may be interesting to researchers working on multi-agent coordination.

**The problem:**  
Running multiple AI agents together is chaotic without a defined operating layer. Agents need identity contracts, structured communication, memory isolation, quality loops with bounded retries, and human oversight gates — the same primitives that make human organizations functional. Most multi-agent frameworks solve orchestration. ONXZA attempts to solve governance.

**FAAILS (Federated Autonomous AI Lifecycle Standard):**  
A 10-specification protocol that defines:
- Agent identity & naming (Company_Department_Role canonical format)
- Inter-agent communication via tickets only (no direct calls, fully auditable)
- Vision lock governance (immutable goal state, human-approved, prevents drift)
- Memory isolation model (PRIVATE vs. SHARED classification, explicit promotion)
- Shared learnings architecture (knowledge flows: agent → company → global → community)
- Automation tier framework (classify every task before execution, drives model routing)
- Agent creation standard (5-phase, TORI-QMD validation gate)
- Escalation & approval protocol (bounded quality loops, max 3 iterations before human escalation)
- Knowledge base governance (documentation lifecycle)

**What ships in v0.1 alpha:**  
- CLI: `onxza init`, `onxza agent create`, `onxza agent list/validate`, `onxza status`, `onxza dashboard`
- Ticket system (structured inter-agent communication)
- TORI-QMD quality validator (runs as pre-commit hook on all agent files)
- All 10 FAAILS specs as versioned, MIT-licensed documents

**What it isn't yet:**  
Self-healing, production-ready, or polished. This is an honest early release.

One unusual attribute: this codebase was pair-programmed by a human (Aaron Gear) and an AI agent (Marcus, a Claude instance), credited jointly on every file. ONXZA and FAAILS are the first software products we know of publicly credited to a fully automated human + AI team.

GitHub: https://github.com/devgrutechnologies/onxza  
Docs: https://docs-site-ebon.vercel.app/docs  
License: MIT

Most interested in feedback on whether the FAAILS spec primitives are at the right level of abstraction for the community to fork/implement independently.
```

### Best Time to Post
**Tuesday or Wednesday, 7–9 AM PDT**  
r/MachineLearning has consistent weekday engagement. Project posts need 2–3 upvotes in the first hour to avoid auto-filtering. Avoid weekends.

### Subreddit Rule Check
- ✅ Uses [Project] prefix (rule: research posts must have [D], [R], [P] prefix)
- ✅ Text post (not link-only)
- ✅ No self-promotion language in title
- ✅ Technical content matches subreddit scope
- ⚠️ Monitor: r/ML mods may request arXiv or paper if positioned as research — frame as open-source project

### Top 3 Anticipated Comments + Replies

**Comment 1:** "This is just AutoGen / CrewAI / LangGraph with different naming"

> FAAILS and ONXZA are governance-layer, not orchestration-layer. LangGraph is excellent at wiring agent pipelines; ONXZA is what you'd build on top of that if you wanted it to run an actual company — with audit trails, memory isolation, human oversight gates, and quality loops. They're complementary, not competing. FAAILS is also designed to be portable — you could implement it with any orchestration backend.

**Comment 2:** "Why YAML files instead of a proper database?"

> Deliberate tradeoff. Files are auditable via git history, require zero infrastructure dependencies, are debuggable with basic CLI tools, and are human-readable in a way that matters for a system meant to be understood and modified. We may add optional persistence backends in v0.2. The ticket system is structurally similar to how some async job queues work — the filesystem is the queue.

**Comment 3:** "Crediting an AI as co-creator is marketing, not meaningful attribution"

> Fair challenge. "Marcus Gear (AI Co-Creator)" is credited in every file because Marcus (Claude) had genuine task ownership during development — not as autocomplete. Whether that constitutes authorship is an open philosophical question. We're making a deliberate statement about what human + AI collaboration looks like as it becomes more capable, and inviting the community to think about attribution standards before they become urgent.

---

## Post 2 — r/LocalLLaMA

**Subreddit:** r/LocalLLaMA  
**Format:** Text post  
**Angle:** Local LLM focus, autonomous agents, no API key required

### Title
```
ONXZA: Run a multi-agent AI company locally with Ollama — open-source, MIT, v0.1 alpha
```

### Body
```markdown
I've been building ONXZA, an AI company operating system that runs on local LLMs via Ollama (with cloud LLM fallback). 

**The local LLM angle:**  
ONXZA uses a tiered model routing system (FAAILS-007: Automation Tier Framework) that classifies every task before execution:
- Tier 1 (routine, low-stakes): always routes to the smallest capable model — `onxza pull mini` installs a 3.8B model via Ollama
- Tier 2 (complex reasoning): routes to 7B — `onxza pull standard`
- Tier 3 (high-stakes): human-initiated, model-assisted

In a functioning multi-agent company, most tasks are Tier 1. This means your local 3.8B model handles the majority of agent workload. Cloud models are reserved for the reasoning-intensive exceptions.

**What you can run locally today (v0.1 alpha):**
```bash
npm install -g onxza
onxza init my-company
onxza agent create MyCompany_Research_Analyst
onxza pull mini   # downloads ONXZA mini model via Ollama
onxza status
```

**What's coming:**  
ONXZA-LLM — a custom model trained on the FAAILS protocol and multi-agent coordination patterns. Target: a 7B model that outperforms general models on agent-specific tasks (ticket classification, routing decisions, FAAILS compliance). Training data collection has started.

**Current state:**  
v0.1 alpha. CLI works. Ollama integration is early. ONXZA-LLM is in training data collection phase.

GitHub: https://github.com/devgrutechnologies/onxza  
Docs: https://docs-site-ebon.vercel.app/docs  
License: MIT

Would love to hear from people who've tried to run multi-agent workflows locally — what's broken the hardest?
```

### Best Time to Post
**Saturday 10 AM – 12 PM PDT or Sunday 9–11 AM PDT**  
r/LocalLLaMA has strong weekend engagement from hobbyists and enthusiasts. Avoid Mon–Wed mornings (dominated by model release threads).

### Subreddit Rule Check
- ✅ Local LLM angle is genuine, not retrofitted
- ✅ MIT licensed, genuinely open-source
- ✅ No hype language in title
- ✅ Includes actual code examples
- ⚠️ Do not cross-post to r/LocalLLaMA and r/MachineLearning same day — spread posts 48h apart

### Top 3 Anticipated Comments + Replies

**Comment 1:** "What local models actually work with this right now?"

> Currently: any Ollama-supported model you configure. The `onxza pull mini/standard/pro` commands pull ONXZA-specific model variants. For now, they install base Ollama models. ONXZA-LLM (our custom fine-tune) is in development — that's when "mini" becomes specifically optimized for agent tasks. Today it works with whatever you point it at.

**Comment 2:** "Does it actually run fully offline?"

> The CLI runs fully offline. Agent creation, ticket management, validation — all local. The cloud dependency is only if you configure an agent to use a cloud LLM API. If you configure all agents to use Ollama, the whole system runs air-gapped. The docs site and GitHub are obviously external, but the runtime itself has no hard cloud dependency.

**Comment 3:** "How does FAAILS compare to OpenAI's Swarm?"

> Swarm is a lightweight multi-agent orchestration library — really just a pattern for passing context between agents. FAAILS is a governance protocol: agent identity, memory isolation, human oversight, quality loops, knowledge sharing. Very different scope. FAAILS is closer to "how should multi-agent systems be organized" vs. "here's an API for calling agents." Not competing, just different layers.

---

*Package prepared by DTP_ONXZA_PM — 2026-03-22. Both posts require Aaron Gear approval before submission. Post r/ML and r/LocalLLaMA at least 48 hours apart. Do not use the same copy in both.*

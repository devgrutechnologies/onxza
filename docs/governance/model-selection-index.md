---
doc_id: ONXZA-DOC-001
title: Model Selection Index
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: models, routing, llm, cost, tiers, decision-matrix
summary: How ONXZA selects the right AI model for every task. Defines model tiers, routing decision matrix, cost principles, and task-to-model assignments.
---

# ONXZA Model Selection Index

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0 | **Review cycle:** Quarterly or when new models release

---

## Overview

This document governs which AI model is selected for every task in ONXZA. Agents consult this index before routing any task to a model. Model selection is deliberate — based on task complexity, cost efficiency, latency requirements, and safety considerations.

ONXZA is intentionally **model-agnostic**. Any model can be swapped at any time by updating this index. No agent is hardcoded to a specific provider.

---

## Model Tiers

### Tier 1 — Frontier Reasoning
**Highest capability. Highest cost. Use when being wrong has significant downstream consequences.**

Use for: critical thinking, complex planning, vision translation, security analysis, novel problem-solving, architecture decisions.

| Provider | Models | Strengths | Weaknesses |
|---|---|---|---|
| Anthropic | Claude Opus, Claude Sonnet | Long context, strong reasoning, safety-tuned, excellent instruction following | Higher cost, slightly slower |
| OpenAI | GPT-4o, o1, o3 | Strong code generation, broad knowledge, tool use | Can be verbose, higher cost |
| Google | Gemini Ultra / 1.5 Pro | Massive context window, multimodal | Less predictable on structured tasks |

**Default Tier 1 model:** Claude (Anthropic) — preferred for all primary agent and orchestrator-level tasks due to instruction fidelity and safety alignment.

---

### Tier 2 — Capable General Purpose
**Strong capability. Moderate cost. The workhouse tier for most structured work.**

Use for: project management tasks, structured planning, code generation, content creation, research synthesis, agent-to-agent reasoning.

| Provider | Models | Strengths | Weaknesses |
|---|---|---|---|
| Anthropic | Claude Haiku | Fast, cheap, strong on structured tasks | Less deep reasoning than Sonnet/Opus |
| OpenAI | GPT-4o mini | Fast, affordable, good at structured output | Less robust on ambiguous tasks |
| Meta | Llama 3.1 70B (hosted) | Open weight, deployable, strong general capability | Requires hosting infrastructure |

---

### Tier 3 — Local / Programmatic
**Fast. Free. Limited reasoning. Use when the task is fully specified and no reasoning is required.**

Use for: well-defined scripted tasks, ticket routing, file operations, simple classification, status updates.

| Provider | Models | Strengths | Weaknesses |
|---|---|---|---|
| Ollama (local) | Llama 3.1 8B, Mistral 7B, Phi-3 | Zero cost, no internet, fast, private | Limited reasoning, small context window |
| Ollama (local) | DeepSeek Coder | Strong on defined code tasks | Narrow domain |
| Programmatic | Python / shell scripts | Deterministic, instant, zero tokens | No reasoning at all |

---

## Routing Decision Matrix

Evaluate every task against these steps **in order**:

### Step 1: Is this task fully deterministic?
- **YES** (e.g., move a file, update a status field, run a known script) → **Use a script. No LLM needed.**
- **NO** → Continue to Step 2.

### Step 2: Is the task well-defined with no ambiguity?
- **YES** (e.g., "extract all JSON keys from this file", "classify this ticket as open/closed") → **Tier 3 Local LLM**
- **NO** → Continue to Step 3.

### Step 3: Does the task require planning, synthesis, or multi-step reasoning?
- **YES, scope is clear and risk is low** → **Tier 2**
- **YES, scope involves strategic decisions, vision alignment, or security** → **Tier 1**

### Step 4: What is the consequence of being wrong?
- Wrong answer costs seconds to fix → **Tier 3 acceptable**
- Wrong answer costs hours or creates downstream errors → **Tier 2 minimum**
- Wrong answer corrupts vision, creates a security risk, or costs real money → **Tier 1 required**

---

## Task-to-Model Assignments

| Task Category | Default Tier | Default Model | Override Allowed? |
|---|---|---|---|
| Primary agent ↔ system owner conversation | Tier 1 | Claude Sonnet/Opus | No — always Tier 1 |
| Vision document creation | Tier 1 | Claude Sonnet/Opus | No |
| Orchestrator plan creation | Tier 1 | Claude Sonnet | Yes — GPT-4o acceptable |
| Security analysis | Tier 1 | Claude Opus | No — always highest |
| Project manager planning | Tier 2 | Claude Haiku / GPT-4o mini | Yes |
| Frontend / backend code generation | Tier 2 | Claude Haiku / GPT-4o mini | Yes |
| UI/UX design reasoning | Tier 2 | Claude Haiku | Yes |
| Content creation (articles, blogs) | Tier 2 | Claude Haiku / GPT-4o mini | Yes |
| SEO analysis and recommendations | Tier 2 | Claude Haiku | Yes |
| Ticket creation and routing | Tier 3 | Local LLM (Llama 8B) | Yes |
| File operations and status updates | Programmatic | Shell script | No — never use LLM for this |
| Memory read/write | Programmatic | Shell / Python | No |
| Simple classification tasks | Tier 3 | Local LLM | Yes |
| Agent-to-agent communication parsing | Tier 3 | Local LLM | Yes |
| Research synthesis | Tier 2 | Claude Haiku | Yes — Tier 1 for critical research |
| Legal / compliance review | Tier 1 | Claude Opus | No |
| New agent design | Tier 1 | Claude Sonnet/Opus | No |

---

## Model Selection Overrides

Any agent may request a model upgrade for a specific task by creating a ticket:

```yaml
type: model_override_request
task_description: [what the task requires]
default_model: [what tier/model was assigned]
requested_model: [what is being requested]
justification: [why the default is insufficient]
```

**Approval chain:**
- Tier 3 → Tier 2 upgrade: Project Manager approval
- Any Tier 1 request: Orchestrator approval
- Security-related upgrade: Primary agent (Marcus-equivalent) approval

Model **downgrades** (using a lower tier than default) require PM approval. Never downgrade security analysis tasks.

---

## Cost Management Principles

1. **Default to the lowest tier that will produce correct output.** Spending Tier 1 tokens on a ticket routing task is waste.
2. **Batch similar tasks** before sending to Tier 1/2 models where possible.
3. **Local LLMs are free.** Use them aggressively for anything within their capability.
4. **Programmatic scripts cost zero.** If a task can be scripted, script it.
5. **Track token usage by project.** Each PM logs estimated token spend to `project-context.md` monthly.
6. **Any model spend approaching real financial cost** must be escalated before proceeding.

---

## Local LLM First Rule

For any **new task type**, run the first 3 examples on a local LLM regardless of complexity. This generates real-world performance data (see the Model Performance Index) and proves capability before spending API budget.

After 3 examples, the data shows: stay on local LLM, escalate to Tier 2, or escalate to Tier 1. **Evidence decides — not assumptions.**

---

## Model Evaluation & Updates

This index is reviewed quarterly. Review process:

1. Check for new model releases from Anthropic, OpenAI, Google, Meta.
2. Benchmark new models against current defaults on standard ONXZA tasks.
3. Check for cost changes on existing models.
4. Review any override requests from the past quarter — do patterns suggest tier assignments need adjustment?
5. Update the assignments table with rationale.
6. Commit the update to Git with a changelog entry.

Model evaluation requires the system owner's approval before any default assignment changes.

---

## Known Model Limitations

| Model | Limitation | Mitigation |
|---|---|---|
| All LLMs | Hallucination risk on facts | Always verify against RAG documents; never trust LLM memory alone |
| Local LLMs | Context window limits (4K–8K tokens typical) | Keep local LLM tasks small and fully specified |
| Local LLMs | No internet access | Do not use for research or current-information tasks |
| GPT-4o | Tends toward verbosity | Instruct explicitly for concise structured output |
| All LLMs | Cannot reliably do math | Use programmatic calculation for any numerical task |
| All LLMs | Cannot directly access filesystem | Always use tool/script layer for file operations |

---

## Emerging Models to Watch

| Capability | Status | Notes |
|---|---|---|
| Reasoning models (o1/o3 class) | Production | Strong for multi-step planning. Evaluate for orchestrator tasks as cost decreases. |
| Multimodal models | Production | As UI/UX work scales, models that reason about visual design become relevant. |
| Specialized code models | Production | For code-heavy projects, evaluate code-specialized models for engineering agents. |
| On-device models (Apple MLX) | Early | Zero cloud dependency — ideal for privacy-sensitive deployments. |
| Agent-native models | Emerging (2025–2026) | Models trained specifically for multi-agent orchestration. Monitor closely. |

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

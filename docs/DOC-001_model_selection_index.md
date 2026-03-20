# MODEL SELECTION INDEX

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

**Document ID:** DOC-001  
**Classification:** OPERATIONAL REFERENCE  
**Version:** 1.0.0  
**Last Updated:** 2025-03-17  
**Owner:** Marcus  
**Review Cycle:** Quarterly or when new models are released  

---

## PURPOSE

This document governs which AI model is selected for every task in the OpenClaw system. All agents must consult this document before routing a task to a model. Model selection is not arbitrary — it is a deliberate decision based on task complexity, cost efficiency, latency requirements, and safety considerations.

The system is intentionally model-agnostic. Any model can be swapped at any time by updating this document. No agent prompt is hardcoded to a specific provider.

---

## MODEL TIERS

### TIER 1 — FRONTIER REASONING (Highest capability, highest cost)
**Use for:** Critical thinking, complex planning, vision translation, security analysis, novel problem-solving, anything where being wrong has high downstream cost.

| Provider | Models | Strengths | Weaknesses |
|---|---|---|---|
| Anthropic | Claude Opus, Claude Sonnet | Long context, strong reasoning, safety-tuned, excellent instruction following | Higher cost, slightly slower |
| OpenAI | GPT-4o, o1, o3 | Strong code generation, broad knowledge, tool use | Can be verbose, cost |
| Google | Gemini Ultra / 1.5 Pro | Massive context window, multimodal | Less predictable on structured tasks |

**Default Tier 1 model:** Claude (Anthropic) — preferred for all Marcus-level and Orchestrator-level tasks due to instruction fidelity and safety alignment.

### TIER 2 — CAPABLE GENERAL PURPOSE (Strong capability, moderate cost)
**Use for:** Project management tasks, structured planning, code generation, content creation, research synthesis, agent-to-agent reasoning.

| Provider | Models | Strengths | Weaknesses |
|---|---|---|---|
| Anthropic | Claude Haiku | Fast, cheap, strong on structured tasks | Less deep reasoning than Sonnet/Opus |
| OpenAI | GPT-4o mini | Fast, affordable, good at structured output | Less robust on ambiguous tasks |
| Meta | Llama 3.1 70B (hosted) | Open weight, deployable, strong general capability | Requires hosting infrastructure |

### TIER 3 — LOCAL / PROGRAMMATIC (Fast, free, limited reasoning)
**Use for:** Well-defined scripted tasks, ticket routing, file operations, simple classification, status updates, anything where the task is fully specified and reasoning is not required.

| Provider | Models | Strengths | Weaknesses |
|---|---|---|---|
| Ollama (local) | Llama 3.1 8B, Mistral 7B, Phi-3 | Zero cost, no internet needed, fast, private | Limited reasoning, context window |
| Ollama (local) | DeepSeek Coder | Strong on defined code tasks | Narrow domain |
| Programmatic | Python scripts / shell | Deterministic, instant, zero tokens | No reasoning at all |

---

## ROUTING DECISION MATRIX

For any task, evaluate against these criteria in order:

### Step 1: Is this task fully deterministic?
- If YES (e.g., move a file, update a status field, run a known script) → **Use programmatic script. No LLM needed.**
- If NO → Continue to Step 2.

### Step 2: Is the task well-defined with no ambiguity?
- If YES (e.g., "extract all JSON keys from this file", "classify this ticket as open/closed") → **Tier 3 Local LLM**
- If NO → Continue to Step 3.

### Step 3: Does the task require planning, synthesis, or multi-step reasoning?
- If YES but scope is clear and risk is low → **Tier 2**
- If YES and scope involves strategic decisions, vision alignment, or security → **Tier 1**

### Step 4: What is the consequence of being wrong?
- Wrong answer costs seconds to fix → **Tier 3 acceptable**
- Wrong answer costs hours or creates downstream errors → **Tier 2 minimum**
- Wrong answer corrupts vision, creates security risk, or costs money → **Tier 1 required**

---

## TASK-TO-MODEL ASSIGNMENTS

| Task Category | Default Tier | Default Model | Override Allowed? |
|---|---|---|---|
| Aaron ↔ Marcus conversation | Tier 1 | Claude Sonnet/Opus | No — always Tier 1 |
| Vision Document creation | Tier 1 | Claude Sonnet/Opus | No |
| Orchestrator plan creation | Tier 1 | Claude Sonnet | Yes — GPT-4o acceptable |
| Security analysis | Tier 1 | Claude Opus | No — always highest |
| Project Manager planning | Tier 2 | Claude Haiku / GPT-4o mini | Yes |
| Frontend/Backend code generation | Tier 2 | Claude Haiku / GPT-4o mini | Yes |
| UI/UX design reasoning | Tier 2 | Claude Haiku | Yes |
| Content creation (articles, blogs) | Tier 2 | Claude Haiku / GPT-4o mini | Yes |
| SEO analysis and recommendations | Tier 2 | Claude Haiku | Yes |
| Ticket creation and routing | Tier 3 | Local LLM (Llama 8B) | Yes |
| File operations and status updates | Programmatic | Shell script | No — never use LLM for this |
| Memory read/write (TORI-QMD) | Programmatic | Shell/Python | No |
| Simple classification tasks | Tier 3 | Local LLM | Yes |
| Agent-to-agent communication parsing | Tier 3 | Local LLM | Yes |
| Research synthesis | Tier 2 | Claude Haiku | Yes — Tier 1 for critical research |
| Legal/compliance review | Tier 1 | Claude Opus | No |
| New agent design | Tier 1 | Claude Sonnet/Opus | No |

---

## MODEL SELECTION OVERRIDES

Any agent may request a model upgrade for a specific task by creating a ticket:
- Ticket type: `model_override_request`
- Required fields: task description, default model, requested model, justification
- Approved by: Project Manager (Tier 2→3 upgrades), Orchestrator (Tier 1 requests), Marcus (any security-related upgrade)

Model downgrades (using lower tier than default) require PM approval. Never downgrade security analysis tasks.

---

## COST MANAGEMENT PRINCIPLES

1. **Default to the lowest tier that will produce correct output.** Spending Tier 1 tokens on a ticket routing task is waste.
2. **Batch similar tasks** before sending to Tier 1/2 models where possible.
3. **Local LLMs are free.** Use them aggressively for anything within their capability.
4. **Programmatic scripts cost zero.** If a task can be scripted, script it.
5. **Track token usage by project.** Each PM logs estimated token spend to project-context.md monthly.
6. **Any model spend that approaches real financial cost** must be escalated to Marcus → Aaron before proceeding.

---

## MODEL EVALUATION & UPDATES

This document is reviewed quarterly. When reviewing:
1. Check for new model releases from Anthropic, OpenAI, Google, Meta
2. Benchmark new models against current defaults on standard OpenClaw tasks
3. Check for cost changes on existing models
4. Review any override requests from the past quarter — do patterns suggest tier assignments need adjustment?
5. Update assignments table with rationale
6. Commit update to Git with change log entry

**Model evaluation is always done by Marcus and requires Aaron's approval before any default assignment changes.**

---

## KNOWN MODEL LIMITATIONS

| Model | Limitation | Mitigation |
|---|---|---|
| All LLMs | Hallucination risk on facts | Always verify facts against RAG documents, never trust LLM memory alone |
| Local LLMs | Context window limits (4K-8K tokens typical) | Keep local LLM tasks small and fully specified |
| Local LLMs | No internet access | Do not use for research or current information tasks |
| GPT-4o | Tends toward verbosity | Instruct explicitly for concise structured output |
| All LLMs | Cannot reliably do math | Use programmatic calculation for any numerical task |
| All LLMs | Cannot directly access filesystem | Always use tool/script layer for file operations |

---

## FUTURE MODEL CONSIDERATIONS

The following capabilities are emerging and should be evaluated as they mature:

- **Reasoning models (o1/o3 class):** Strong for multi-step planning. Evaluate for Orchestrator tasks when cost decreases.
- **Multimodal models:** As UI/UX work scales, models that can reason about visual design will become relevant.
- **Specialized code models:** As projects grow, evaluating code-specialized models for frontend/backend agents.
- **On-device models:** Apple MLX and similar — for running agents on Aaron's local hardware with zero cloud dependency.
- **Agent-native models:** Models specifically trained for multi-agent orchestration (emerging 2025-2026). Monitor closely.


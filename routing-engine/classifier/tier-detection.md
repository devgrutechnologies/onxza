<!--
Imagined by Aaron Gear
Created by Aaron Gear and Marcus Gear (AI Co-Creator)
Powered by DevGru US Inc. DBA DevGru Technology Products
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs
-->

# Tier Detection — Tier 1 / 2 / 3 Classification Logic

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## The Three Tiers

### Tier 3 — Pure Script / Cron
**Zero LLM involvement required.**
Fastest. Cheapest. Most reliable.
Goal: push as many tasks here as possible over time.

### Tier 2 — Script + Model Hybrid
**Script handles mechanics. Model handles judgment.**
Local LLM preferred. Cloud only if local is insufficient.

### Tier 1 — Reasoning Required
**Any model capable of the reasoning needed.**
Local LLM is valid for Tier 1 tasks within its capability.
Cloud required only when reasoning exceeds local capability.

---

## Tier 3 Detection — Push-to-Script Signals

A task is Tier 3 if ALL of the following are true:

1. The output is fully deterministic (same input → same output, always)
2. No judgment, interpretation, or synthesis is needed
3. It can be expressed as a shell script, Python script, or cron job
4. Failure is cheap and easily detectable

**Tier 3 Examples:**
- Move a file from A to B
- Update a status field in a ticket
- Run a daily heartbeat check
- Append a line to a log file
- Send a webhook notification
- Extract all JSON keys from a known schema
- Schedule a recurring cron task

**Push-to-Tier-3 Recommendation:**
When a Tier 1 or Tier 2 task is classified, the router checks: "Could this become Tier 3 with a script?" If yes, the router appends a `tier3_opportunity` flag to the routing record. This is the mechanism by which ONXZA continuously automates itself.

```json
{
  "tier3_opportunity": true,
  "tier3_suggestion": "This task (status field update) could be fully scripted. Recommend DTP_ONXZA_ScriptEngine create a reusable script."
}
```

---

## Tier 2 Detection — Script + Judgment Signals

A task is Tier 2 if:

1. The mechanics are well-defined (clear steps, known inputs/outputs)
2. Some judgment is needed but the scope is bounded
3. A local LLM can handle the reasoning within its capability window
4. The cost of being wrong is recoverable (not catastrophic)

**Tier 2 Examples:**
- Generate a blog post from a brief
- Classify a ticket from its summary
- Extract key insights from a research document
- Write an outbound email using a template + lead data
- Summarize a project status from ticket list
- Generate a weekly report from log data

**Tier 2 Model Default:** Local LLM (qwen9b or qwen27b based on output length)
**Tier 2 Escalation Trigger:** If local LLM fails FVP check 2+ times → escalate to Tier 1 model

---

## Tier 1 Detection — Reasoning Required Signals

A task is Tier 1 if ANY of the following are true:

1. `requires_aaron: true` in ticket
2. `related_vision` is set (vision-adjacent work)
3. Task involves novel architecture, system design, or first-time pattern
4. Task domain is SECURITY or LEGAL
5. Task priority is `critical` with ambiguous scope
6. Error cost is high: wrong answer corrupts vision, costs real money, or creates downstream failures
7. Multi-step reasoning with interdependent decisions
8. The task requires synthesizing across multiple documents or contexts

**Tier 1 Examples:**
- Design a new agent architecture
- Security audit of production systems
- Legal/compliance review
- Build a new system from scratch (this ticket)
- Vision translation from Aaron's intent
- Critical architecture decision with downstream effects

**Tier 1 Model Default:** Sonnet (safe default). Opus for SECURITY/LEGAL/vision.
**Local LLM at Tier 1:** Valid when task is Tier 1 by complexity but within local model capability. MPI data decides over time.

---

## Tier Decision Flowchart

```
Is the task fully deterministic and scriptable?
  → YES → Tier 3

Does the task need a model but have bounded scope?
  → YES → Tier 2

Does the task require novel reasoning, vision judgment,
or have high error cost?
  → YES → Tier 1

Uncertain? → Default Tier 2. Log uncertainty. Let MPI decide over time.
```

---

## Tier Override Rules

1. Any agent may request a tier override via ticket (`type: tier_override_request`)
2. Overrides logged to routing decision log
3. MPI tracks override frequency — systematic overrides trigger routing table update
4. Never override SECURITY or LEGAL to below Tier 1 without COO approval

---

## Push-to-Tier-3 Strategy

Every Tier 1 or Tier 2 task that repeats 3+ times is a Tier 3 candidate.
The router flags this automatically. Pattern:

```json
{
  "tier3_opportunity": true,
  "repeat_count": 4,
  "tier3_suggestion": "Task type 'status_update' has appeared 4 times. Recommend scripting this pattern."
}
```

Over time, this is how ONXZA replaces LLM calls with scripts.
The goal is fewer LLM tokens, not more.

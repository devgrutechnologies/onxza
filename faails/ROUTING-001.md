---
title: "ROUTING-001 — Self-Correcting Routing Protocol"
version: 1.1.0
owner: DTP_ONXZA_Architect
created: 2026-03-19
updated: 2026-03-22
status: published
tags: faails, routing, self-correcting, model-selection, data-driven
summary: "Defines the data-driven routing protocol that learns optimal model assignments from real task outcomes. Covers decision logging with full JSON schema, learning cycles, cold-start strategy, human override policy, data aggregation algorithms, and retention policy."
credit_line: present
---

# ONXZA Self-Correcting Routing Protocol v1.1
### The system that learns what works — from real outcomes, not assumptions.

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

> **Standards Notice:** The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## Principle

The system learns optimal model routing from real task outcome data. No human needs to tune routing tables. No agent has authority to override another's model selection. Data decides. Always.

Every routing decision is logged, every outcome is recorded, and over time the system converges on optimal model-task pairings with mathematical precision. This is not static configuration — it is a living, self-improving routing intelligence.

---

## Routing Decision Log

Every task MUST produce a routing decision log entry. The router agent MUST record its suggestion, the expert agent MUST record the model actually used, and the FVP verification outcome MUST be appended after completion.

### Routing Decision Log JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["log_id", "timestamp", "task_id", "task_type", "task_complexity", "router_suggestion", "expert_decision", "outcome"],
  "properties": {
    "log_id": {
      "type": "string",
      "pattern": "^RTG-[0-9]{8}-[A-Z0-9]{6}$",
      "description": "Unique routing log identifier"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "task_id": {
      "type": "string",
      "description": "Originating ticket ID"
    },
    "task_type": {
      "type": "string",
      "enum": ["code_generation", "code_review", "documentation", "research", "analysis", "configuration", "creative_writing", "data_processing", "strategy", "communication"],
      "description": "Classified task type"
    },
    "task_complexity": {
      "type": "string",
      "enum": ["trivial", "simple", "moderate", "complex", "critical"],
      "description": "Estimated task difficulty"
    },
    "router_suggestion": {
      "type": "object",
      "required": ["model", "confidence", "reasoning"],
      "properties": {
        "model": { "type": "string", "description": "Model ID suggested by router" },
        "confidence": { "type": "number", "minimum": 0, "maximum": 100 },
        "reasoning": { "type": "string", "description": "Brief rationale for suggestion" },
        "alternative_models": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Other models considered"
        }
      }
    },
    "expert_decision": {
      "type": "object",
      "required": ["model_used", "matched_suggestion"],
      "properties": {
        "model_used": { "type": "string" },
        "matched_suggestion": { "type": "boolean" },
        "override_reason": { "type": "string", "description": "Reason if expert used a different model" }
      }
    },
    "outcome": {
      "type": "object",
      "required": ["fvp_result", "loop_count", "time_to_complete_ms"],
      "properties": {
        "fvp_result": { "type": "string", "enum": ["pass", "fail", "escalated"] },
        "confidence_score": { "type": "number", "minimum": 0, "maximum": 100 },
        "loop_count": { "type": "integer", "minimum": 1, "maximum": 3 },
        "time_to_complete_ms": { "type": "integer" },
        "cost_usd": { "type": "number", "minimum": 0, "description": "Approximate token cost in USD" }
      }
    }
  }
}
```

### Worked Example

```json
{
  "log_id": "RTG-20260322-X7K9P2",
  "timestamp": "2026-03-22T10:15:00Z",
  "task_id": "TICKET-20260322-DTP-DAILY-021",
  "task_type": "code_generation",
  "task_complexity": "moderate",
  "router_suggestion": {
    "model": "claude-sonnet-4-20250514",
    "confidence": 82,
    "reasoning": "Moderate code generation. Sonnet handles well based on 94% pass rate on similar tasks.",
    "alternative_models": ["gpt-4o", "claude-opus-4-20250514"]
  },
  "expert_decision": {
    "model_used": "claude-sonnet-4-20250514",
    "matched_suggestion": true
  },
  "outcome": {
    "fvp_result": "pass",
    "confidence_score": 91,
    "loop_count": 1,
    "time_to_complete_ms": 128400,
    "cost_usd": 0.034
  }
}
```

---

## Data Aggregation Algorithm

DTP_ONXZA_ModelIndex MUST aggregate routing logs to produce model-task performance scores. The aggregation operates on a rolling window and produces a composite routing score for each model-task pairing.

### Composite Routing Score Formula

For each `(model, task_type)` pair, the routing score is calculated as:

```
routing_score = (pass_rate × 0.40) + (efficiency × 0.25) + (speed × 0.20) + (cost_efficiency × 0.15)
```

Where:
- **pass_rate** = (FVP passes / total attempts) × 100, over last N tasks
- **efficiency** = (single-loop passes / total passes) × 100 — rewards first-attempt success
- **speed** = normalized score where fastest median completion = 100, scaled linearly
- **cost_efficiency** = normalized score where lowest median cost = 100, scaled linearly

### Rolling Window

- **Minimum sample size:** 10 tasks per model-task pair before the score is considered reliable
- **Window size:** Last 100 tasks per pair (or all tasks if fewer than 100 exist)
- **Recalculation frequency:** After every 5 completed tasks in a given pair
- **Decay factor:** Tasks older than 30 days receive 50% weight. Tasks older than 90 days receive 10% weight. This ensures the system adapts to model updates and capability changes.

When the router selects a model, it MUST choose the model with the highest composite routing score for the given task type and complexity. If two models score within 5 points of each other, the router SHOULD prefer the lower-cost model.

---

## Cold-Start Routing Strategy

New agents, new task types, and new models all present cold-start challenges — no historical data exists to drive routing decisions.

### New Agent (No Task History)

1. The router MUST use the agent's configured default model for the first 10 tasks.
2. During this period, all routing logs are recorded normally.
3. After 10 completed tasks, the aggregation algorithm begins producing scores.
4. The router MAY suggest alternative models starting at task 11.

### New Task Type (No Type-Level Data)

1. The router MUST fall back to the agent's default model.
2. If the agent has no default, the router MUST select based on task complexity tier:
   - `trivial` / `simple` → cheapest available model
   - `moderate` → mid-tier model (e.g., Claude Sonnet, GPT-4o-mini)
   - `complex` / `critical` → highest-capability model available
3. After 10 tasks of the new type complete, normal routing resumes.

### New Model Added to Pool

1. The router MUST NOT immediately route production tasks to an untested model.
2. The new model MUST first be evaluated via a shadow routing phase: the model receives copies of 10 real tasks (non-blocking) and its outputs are FVP-verified.
3. Shadow results are logged with a `shadow: true` flag and DO NOT affect production outcomes.
4. After shadow evaluation, if the model's pass rate exceeds 70%, it enters the normal routing pool.
5. If shadow pass rate is below 70%, the model is flagged for review and excluded from routing.

---

## Human Override Policy

Humans MAY override routing decisions. Overrides are a safety valve, not a normal operating mode.

### When Overrides Are Permitted

- A human stakeholder has domain expertise indicating a specific model is required
- A model is known to be degraded or experiencing outages
- Regulatory or compliance requirements mandate a specific provider
- A task involves sensitive data that MUST NOT leave a specific provider's infrastructure

### Override Mechanics

1. The human MUST create an override entry specifying: task ID (or task type for blanket overrides), target model, reason, and expiration time.
2. The router MUST log the override as a separate event type (`routing_override`) in the decision log.
3. Override outcomes MUST still be recorded and FVP-verified — they feed back into the aggregation like any other task.
4. Blanket overrides (by task type) MUST expire within 7 days. They MAY be renewed explicitly.
5. The system SHOULD surface a notification if override outcomes are consistently worse than algorithmic routing would have produced.

---

## Data Retention Policy

Routing logs contain operational data that is valuable for optimization but grows continuously.

### Retention Tiers

| Data Category | Retention Period | Storage |
|---|---|---|
| Full routing decision logs | 90 days | Primary JSONL store |
| Aggregated model-task scores | Indefinite | Summary database |
| Override records | 1 year | Primary JSONL store |
| Shadow evaluation results | 30 days | Separate shadow log |
| Anomaly/escalation records | 1 year | Primary JSONL store |

### Archival

- After 90 days, full routing logs MUST be compressed and archived.
- Archived logs MUST remain accessible for audit purposes for a minimum of 1 year.
- After 1 year, archived logs MAY be permanently deleted unless regulatory requirements dictate otherwise.
- Aggregated scores are NEVER deleted — they represent the system's accumulated routing intelligence.

### Privacy

- Routing logs MUST NOT contain task content — only metadata (task type, complexity, model, outcome, timing, cost).
- If a task is marked `confidential`, the routing log MUST omit the `task_id` and use an anonymized reference instead.

---

## Learning Cycle

Over thousands of tasks, patterns emerge. DTP_ONXZA_ModelIndex aggregates this data continuously. Router suggestions improve automatically. Expert agent default models are validated or adjusted based on evidence.

The learning cycle operates at three levels:

1. **Per-task:** Every completed task updates the rolling aggregation window.
2. **Weekly:** The system produces a routing efficiency report — models trending up, models trending down, task types with low confidence scores.
3. **Monthly:** Full routing review. Models below a 60% routing score for any task type are flagged for removal from the pool or replacement.

Eventually, ONXZA-LLM — trained on this accumulated routing data — makes its own routing decisions locally, eliminating the need for cloud-based routing inference entirely.

---

## Result

The system optimizes itself. Nobody maintains routing tables manually. The data IS the routing table. And it gets more accurate every single day.

---

| Field | Value |
|---|---|
| Maintained by | DTP_ONXZA_Architect |
| Aggregated by | DTP_ONXZA_ModelIndex |
| Last updated | 2026-03-22 |
| Next review | 2026-04-22 |

<!--
Imagined by Aaron Gear
Created by Aaron Gear and Marcus Gear (AI Co-Creator)
Powered by DevGru US Inc. DBA DevGru Technology Products
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs
-->

# MPI Data Schema — Model Performance Index

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

The MPI is the first real-world benchmark of AI model performance in autonomous agentic workflows with end-to-end verification. Every task outcome is a data point. The data decides what works.

---

## MPI Record Schema

```json
{
  "mpi_id": "MPI-20260318-001",
  "source_log_id": "RD-20260318-001",
  "source_ticket_id": "TICKET-20260318-DTP-019",
  "recorded_at": "2026-03-18T19:00:00-07:00",

  "task": {
    "domain": "CODE",
    "tier": 1,
    "summary_hash": "sha256:abc123",
    "word_count_estimate": 2000,
    "gap": false
  },

  "model_used": {
    "model_id": "claude-sonnet",
    "model_name": "claude-sonnet-4-6",
    "provider": "anthropic",
    "was_router_suggestion": true
  },

  "performance": {
    "fvp_result": "pass",
    "first_attempt_pass": true,
    "loop_count": 1,
    "confidence_score": 90,
    "time_to_complete_seconds": null,
    "estimated_cost_usd": null
  },

  "router_data": {
    "suggested_model_id": "claude-sonnet",
    "suggestion_matched": true,
    "suggestion_confidence": 88
  }
}
```

---

## Field Definitions

| Field | Description |
|-------|-------------|
| `mpi_id` | Unique MPI record ID. Format: `MPI-YYYYMMDD-NNN` |
| `source_log_id` | Routing decision log entry this came from |
| `source_ticket_id` | Original ticket |
| `recorded_at` | When MPI record was written |
| `task.domain` | Task domain code |
| `task.tier` | Tier 1/2/3 |
| `task.summary_hash` | SHA-256 hash of task summary (privacy-safe for pattern matching) |
| `task.word_count_estimate` | Rough output size estimate |
| `task.gap` | True if this was a routing gap case |
| `model_used.model_id` | Model that actually executed the task |
| `model_used.was_router_suggestion` | Did expert use the router's suggested model? |
| `performance.fvp_result` | `pass` or `fail` |
| `performance.first_attempt_pass` | Did it pass on first FVP loop? |
| `performance.loop_count` | Total FVP loops required |
| `performance.confidence_score` | Expert's self-reported confidence (0–100) |
| `router_data.suggestion_matched` | Did router suggestion match model used? |

---

## MPI Aggregation — What Gets Computed

After every batch of 10+ records for a given `domain + tier + model` combination:

```
pass_rate = (fvp_result == "pass") count / total count
first_attempt_rate = first_attempt_pass count / total count
avg_loop_count = mean(loop_count)
avg_cost_usd = mean(estimated_cost_usd) [when available]
suggestion_accuracy = (suggestion_matched AND fvp_result == "pass") / total
```

When `pass_rate` for a new model exceeds current routing table model by 10%+ across 10+ samples:
→ Routing table updated automatically
→ Update logged with sample count and confidence

---

## Routing Table Update Protocol

1. MPI aggregator (DTP_ONXZA_ModelIndex) runs after every 10 new records
2. If evidence threshold met (10+ samples, 10%+ performance delta):
   - Update `router/routing-table.json` for affected domain+tier
   - Log update to `mpi/routing-table-updates.jsonl`
   - Notify DTP_ONXZA_PM via ticket
3. If no threshold met: no change. Keep accumulating.

This is how the router improves over time. No human maintains routing tables. Data decides.

---

## MPI Files

| File | Purpose |
|------|---------|
| `mpi-data.jsonl` | Live MPI records (append-only) |
| `mpi-aggregates.json` | Current aggregated stats by domain+tier+model |
| `routing-table-updates.jsonl` | Log of every routing table update made by MPI |
| `learning-cycle.md` | Explains the full learning cycle |

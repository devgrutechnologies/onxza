<!--
Imagined by Aaron Gear
Created by Aaron Gear and Marcus Gear (AI Co-Creator)
Powered by DevGru US Inc. DBA DevGru Technology Products
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs
-->

# Routing Decision Log — Format Specification

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

Every routing decision is logged. No exceptions. This is how the system learns.

---

## Log File

`routing-decisions.jsonl` — append-only, one JSON object per line.

---

## Log Entry Schema

```json
{
  "log_id": "RD-20260318-001",
  "ticket_id": "TICKET-20260318-DTP-019",
  "logged_at": "2026-03-18T18:41:00-07:00",

  "classification": {
    "domain": "CODE",
    "tier": 1,
    "tier_reason": "Novel system architecture build — reasoning required, high downstream cost if wrong",
    "confidence": 92
  },

  "router_suggestion": {
    "model_id": "claude-sonnet",
    "model_name": "claude-sonnet-4-6",
    "provider": "anthropic",
    "reason": "Tier 1 CODE domain — architecture build requiring complex reasoning",
    "confidence": 88,
    "mpi_override": false,
    "tier3_opportunity": false
  },

  "expert": {
    "agent_id": "dtp-onxza-router",
    "model_id": "claude-sonnet",
    "model_name": "claude-sonnet-4-6",
    "provider": "anthropic"
  },

  "agreement": {
    "match": true,
    "disagreement_reason": null
  },

  "outcome": {
    "status": "pending",
    "fvp_result": null,
    "confidence_score": null,
    "loop_count": null,
    "time_to_complete_seconds": null,
    "estimated_cost_usd": null,
    "completed_at": null
  }
}
```

---

## Field Definitions

| Field | Description |
|-------|-------------|
| `log_id` | Unique log entry ID. Format: `RD-YYYYMMDD-NNN` |
| `ticket_id` | Source ticket |
| `logged_at` | ISO timestamp when routing decision was made |
| `classification.domain` | Domain code from task classifier |
| `classification.tier` | 1, 2, or 3 |
| `classification.tier_reason` | Human-readable explanation |
| `classification.confidence` | 0–100 confidence in classification |
| `router_suggestion.model_id` | Short model key from routing table |
| `router_suggestion.model_name` | Full model name |
| `router_suggestion.reason` | Why this model was suggested |
| `router_suggestion.confidence` | 0–100 confidence in suggestion |
| `router_suggestion.mpi_override` | Was this driven by MPI data? |
| `router_suggestion.tier3_opportunity` | Could this become Tier 3? |
| `expert.agent_id` | Which agent executed the task |
| `expert.model_id` | Which model the expert actually used |
| `agreement.match` | Did router suggestion match expert model? |
| `agreement.disagreement_reason` | If mismatch, why (expert preference, capability, etc.) |
| `outcome.status` | `pending`, `complete`, `failed` |
| `outcome.fvp_result` | `pass`, `fail`, or `null` |
| `outcome.confidence_score` | Expert's self-reported confidence |
| `outcome.loop_count` | How many FVP loops needed |
| `outcome.time_to_complete_seconds` | Wall clock time |
| `outcome.estimated_cost_usd` | Approximate token cost |

---

## Two-Phase Logging

Routing decisions are logged in two phases:

**Phase 1 — At routing time:**
- `log_id`, `ticket_id`, `logged_at`, `classification`, `router_suggestion`, `expert` (partial — agent_id known, model may be pending)
- `outcome.status` = `"pending"`

**Phase 2 — After task completion:**
- Fill `expert.model_id` + `expert.model_name`
- Fill `agreement` fields
- Fill `outcome.*` fields from FVP result

Phase 2 is written by the Expert agent (or FVP verifier) using `scripts/log-outcome.sh`.

---

## Disagreement Logging

When router suggestion ≠ expert model used:

1. Log `agreement.match: false`
2. Log `agreement.disagreement_reason` — expert must provide reason
3. MPI accumulates disagreement data
4. If expert model consistently outperforms router suggestion → routing table updated
5. If router suggestion consistently outperforms expert model → expert default model flagged for review

No overrides. No blocks. Just data. The better model wins over time.

---

## Retention

- Keep all entries indefinitely (learning data is permanent)
- Archive to `mpi/mpi-data.jsonl` monthly for MPI processing
- Never delete routing decision entries

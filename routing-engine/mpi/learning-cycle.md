<!--
Imagined by Aaron Gear
Created by Aaron Gear and Marcus Gear (AI Co-Creator)
Powered by DevGru US Inc. DBA DevGru Technology Products
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs
-->

# MPI Learning Cycle — How the Router Improves Over Time

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

The ONXZA routing engine is self-improving. No human maintains routing tables. The system learns from real task outcomes and adjusts its suggestions automatically.

---

## The Cycle

```
Task Arrives
     ↓
Router Classifies + Suggests Model          [classifier/ + router/]
     ↓
Expert Executes (with own model)
     ↓
FVP Verifies Outcome
     ↓
Outcome Logged to routing-decisions.jsonl   [logger/]
     ↓
MPI Record Written to mpi-data.jsonl        [mpi/]
     ↓
MPI Aggregator Runs (every 10 records)      [DTP_ONXZA_ModelIndex]
     ↓
IF evidence threshold met:
  routing-table.json updated
  DTP_ONXZA_PM notified
  Update logged to routing-table-updates.jsonl
     ↓
Next task gets better suggestion
     ↓
Repeat forever
```

---

## Evidence Thresholds

| Change Type | Threshold |
|-------------|-----------|
| Routing table suggestion update | 10+ samples, 10%+ pass rate delta |
| Expert default model flag for review | 20+ samples, 15%+ router-suggestion outperforms |
| Tier 3 push recommendation | Same task type appears 3+ times as Tier 1/2 |
| Routing gap closure | 5+ gap records for same unclassified type → new domain rule |

---

## What Improves

**Router suggestion accuracy:**
When suggestions consistently match FVP-passing outcomes → confidence scores rise.
When suggestions consistently mismatch → routing table updated.

**Expert default model validation:**
If an expert always overrides router and still passes FVP → expert's model is validated for that domain.
If expert overrides and fails more often → flagged for PM review.

**Tier 3 automation growth:**
Repeated task patterns with low reasoning requirement → flagged for scripting.
Over time: fewer LLM tokens, more deterministic scripts.

**Routing gap closure:**
Unclassified task types accumulate in gap log.
After 5+ instances: new domain rule proposed, new agent or rule created.

---

## What Does NOT Change Automatically

- Expert agent configurations (only PM/COO can update)
- Model registry (new models added only by MG_Parent_AgentDeveloper)
- Tier definitions (only Aaron/vision governance can change tiers)
- SECURITY and LEGAL routing (always Tier 1, always Opus — no auto-downgrade)

---

## MPI as Public Benchmark

As ONXZA scales, MPI data becomes the first real-world autonomous agentic benchmark:
- FVP first-attempt pass rate by model
- Average loop count by model and task type
- Cost per successful completion
- Task types each model excels at vs. struggles with

This data is published as part of the FAAILS spec. It is the moat that grows every day.

---

## Maintained By

| Role | Responsibility |
|------|---------------|
| DTP_ONXZA_Router | Writes routing decisions + Phase 1 log entries |
| Expert Agents / FVP | Writes Phase 2 log entries (outcomes) |
| DTP_ONXZA_ModelIndex | Aggregates MPI data, updates routing table |
| DTP_ONXZA_PM | Notified of routing table updates, approves expert model changes |
| MG_Parent_AgentDeveloper | Adds new models to registry when available |

<!--
Imagined by Aaron Gear
Created by Aaron Gear and Marcus Gear (AI Co-Creator)
Powered by DevGru US Inc. DBA DevGru Technology Products
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs
-->

# ONXZA MoE Routing Engine

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

The Mixture of Experts (MoE) routing engine is the intelligence layer of ONXZA. It classifies every task, suggests the optimal model, logs disagreements, and learns from outcomes through the Model Performance Index (MPI).

---

## Architecture

```
Task Arrives
     ↓
[classifier/]  ←  Domain + Tier classification
     ↓
[router/]      ←  Model suggestion (local-first, cloud if needed)
     ↓
Expert Executes (uses own model)
     ↓
[logger/]      ←  Router suggestion vs. actual model logged
     ↓
FVP Verification
     ↓
[mpi/]         ←  Outcome data written to MPI learning cycle
```

---

## Modules

| Module | Purpose |
|--------|---------|
| `classifier/` | Domain + tier classification for every incoming task |
| `router/` | Model suggestion engine (local-first cost-optimized) |
| `logger/` | Routing decision log (suggestion vs. actual vs. outcome) |
| `mpi/` | MPI learning cycle: aggregates data, improves routing over time |
| `scripts/` | CLI tools for routing, logging, and MPI queries |

---

## Tier Definitions

| Tier | Description | Model Strategy |
|------|-------------|---------------|
| 1 | Reasoning required — strategy, vision, security, novel problems | Any capable model. Local LLM valid if within capability. |
| 2 | Script + model hybrid — defined tasks needing judgment | Local LLM preferred. Cloud if local insufficient. |
| 3 | Pure script/cron — no LLM needed | Python / shell / n8n. Zero tokens. |

---

## Cost Principle

Local LLM first. Always. Cloud only when local cannot do the job to standard.
Tier 1 ≠ cloud required. Tier 1 = reasoning required.

---

## Files

- `classifier/task-classifier.md` — Classification rules and domain taxonomy
- `classifier/tier-detection.md` — Tier 1/2/3 decision logic
- `router/model-router.md` — Model suggestion rules and fallback chain
- `router/routing-table.json` — Current routing table (auto-updated by MPI)
- `logger/routing-decision-log.md` — Log format spec
- `logger/routing-decisions.jsonl` — Live log (append-only)
- `mpi/mpi-schema.md` — MPI data schema
- `mpi/mpi-data.jsonl` — MPI learning data (append-only)
- `mpi/learning-cycle.md` — How the router improves over time
- `scripts/route-task.sh` — CLI: classify + suggest model for a task
- `scripts/log-outcome.sh` — CLI: log task outcome to MPI
- `scripts/mpi-summary.sh` — CLI: summarize MPI data by model/domain

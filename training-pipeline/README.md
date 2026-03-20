# ONXZA-LLM Training Data Pipeline

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0  
**Owner:** DTP_ONXZA_LLM  
**Status:** Active

---

## Overview

This pipeline collects, anonymizes, filters, and formats operational data from the ONXZA ecosystem into training-ready JSONL for ONXZA-LLM.

**Data sources:**
- MPI routing decisions (model selection and outcome data)
- FVP verification outcomes (quality judgment patterns)
- Shared learning patterns (reusable ecosystem reasoning)

**Output:** `output/training-data.jsonl` — canonical training dataset in ONXZA schema v1.0

---

## Quick Start

```bash
# Full pipeline run
node scripts/run-pipeline.js

# Check dataset status
node scripts/run-pipeline.js --status
```

---

## Pipeline Steps

| Step | Script | Description |
|------|--------|-------------|
| 1 | `collect.js` | Read from MPI data, FVP logs, shared learnings |
| 2 | `anonymize.js` | Remove PII, company names, credentials |
| 3 | `filter.js` | Apply quality filters, assign tiers, deduplicate |
| 4 | `format.js` | Append to training JSONL, update manifest |

---

## Output Files

| File | Description |
|------|-------------|
| `output/training-data.jsonl` | Canonical training dataset |
| `output/manifest.json` | Dataset statistics and status |
| `output/pipeline-runs.log` | Run history |
| `output/rejected/rejected-records.jsonl` | Filtered-out records (audit trail) |
| `output/quarantine/` | Records with potential PII for manual review |

---

## Dataset Targets

| Milestone | Count | Status |
|-----------|-------|--------|
| Minimum for v0.1 training | 1,000 | In progress |
| Stretch target | 2,500 | In progress |
| Bootstrap seed (current) | 16 | ✓ Complete |

---

## Schema

Every training record is a JSON object matching `schema/training-record.schema.json`:

```json
{
  "id": "onxza-train-{source}-{hash}",
  "source": "routing|fvp|shared_learning",
  "version": "1.0",
  "created_at": "ISO-8601",
  "input": {
    "instruction": "...",
    "context": "...",
    "task_type": "..."
  },
  "output": {
    "reasoning": "...",
    "decision": "...",
    "confidence": 0-100
  },
  "metadata": {
    "source": "...",
    "fvp_result": "pass|fail|escalated|n/a",
    "loop_count": 0,
    "was_optimal": true|false|null,
    "quality_tier": 1|2|3,
    "anonymized": true,
    "anonymization_pass": true
  }
}
```

---

## Automation

Pipeline runs automatically after every 100 completed tasks (configurable in `scripts/pipeline-config.json`).

When dataset crosses 1,000 records: alert fires → DTP_ONXZA_LLM creates `llm_release` ticket to initiate training run.

---

## Documentation

Full specification: `docs/TRAINING-DATA-SPEC.md`

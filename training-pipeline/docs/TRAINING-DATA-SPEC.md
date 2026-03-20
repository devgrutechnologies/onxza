# ONXZA-LLM Training Data Specification

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0  
**Status:** Active  
**Owner:** DTP_ONXZA_LLM  
**Created:** 2026-03-18

---

## Overview

This document specifies the training data schema, collection sources, anonymization rules, and quality standards for ONXZA-LLM v0.1 training.

ONXZA-LLM is trained entirely on real agentic operational data from the ONXZA ecosystem. This is not synthetic data. It is not benchmark data. It is the actual reasoning patterns, routing decisions, and verification outcomes of agents operating in production workflows.

---

## Data Sources

### Source 1: MPI Routing Decisions (`source: routing`)
From: ROUTING-001.md routing decision logs, model-performance-index.md
Format: Each entry captures a task routing decision — what task was presented, what model was selected, and what outcome resulted.

**Fields captured:**
- `task_type` — category of task (code, writing, research, analysis, routing, etc.)
- `task_description` — anonymized description of the work requested
- `model_selected` — which model was routed to
- `fvp_result` — pass/fail/escalated
- `confidence_score` — 0–100
- `loop_count` — how many FVP loops were required
- `time_to_complete_s` — seconds to completion
- `was_optimal` — boolean: did the routing decision lead to a first-pass FVP success?

**Training objective:** Teach the model to predict optimal model routing given a task description and context.

---

### Source 2: FVP Outcomes (`source: fvp`)
From: FVP-001.md verification protocol execution logs
Format: Each entry captures an agent output + verification judgment, forming input→judgment pairs.

**Fields captured:**
- `task_type` — task category
- `output_summary` — anonymized description of what was produced
- `confidence_score` — agent's self-reported confidence
- `humanization_pass` — boolean
- `accuracy_pass` — boolean
- `loop_count` — total loops required
- `final_outcome` — accepted/escalated/failed
- `failure_reason` — if failed, why (null otherwise)

**Training objective:** Teach the model to predict FVP pass/fail and identify quality issues in agent outputs.

---

### Source 3: Shared Learning Patterns (`source: shared_learning`)
From: shared-learnings/global/patterns/, shared-learnings/DTP/, shared-learnings/DTP/onxza/
Format: Each entry captures a pattern — a reusable reasoning pattern, tool usage pattern, or agent behavior pattern.

**Fields captured:**
- `pattern_name` — slug identifier
- `pattern_type` — routing|verification|tool_use|escalation|autonomy
- `context` — anonymized situation where pattern applies
- `recommended_action` — what action the pattern prescribes
- `outcome_quality` — high/medium (only high or medium patterns accepted)

**Training objective:** Teach the model to apply ecosystem-proven patterns to new situations.

---

## JSONL Format — Universal Output Schema

Every training record outputs as a single JSON line in the following format:

```json
{
  "id": "onxza-train-{source}-{hash}",
  "source": "routing|fvp|shared_learning",
  "version": "1.0",
  "created_at": "ISO-8601",
  "input": {
    "instruction": "string — what the model is being asked to do",
    "context": "string — relevant context for the decision",
    "task_type": "string"
  },
  "output": {
    "reasoning": "string — the correct reasoning chain",
    "decision": "string — the correct action/answer",
    "confidence": "number 0-100"
  },
  "metadata": {
    "source": "string",
    "fvp_result": "pass|fail|escalated|n/a",
    "loop_count": "number",
    "was_optimal": "boolean|null",
    "anonymized": true
  }
}
```

---

## Anonymization Rules

All training data MUST be anonymized before inclusion. The pipeline enforces these rules automatically:

### Mandatory Removals
1. **Company names** — replace with `[COMPANY]` or category tag (e.g., `[TRAVEL_COMPANY]`)
2. **Personal names** — replace with `[PERSON]` or role tag (e.g., `[CEO]`)
3. **Email addresses** — replace with `[EMAIL]`
4. **URLs with identifiable domains** — replace with `[URL]` or `[INTERNAL_URL]`
5. **API keys, tokens, credentials** — replace with `[CREDENTIAL]`
6. **Phone numbers** — replace with `[PHONE]`
7. **Specific project names** — replace with task-type abstraction
8. **Agent IDs** — replace with role tag (e.g., `[CONTENT_AGENT]`, `[PM_AGENT]`)

### Preserved for Training Value
- Task type and category
- Model names (these are not private — they're the training signal)
- Reasoning patterns and logic structures
- Outcome labels (pass/fail/loop counts)
- Pattern names from shared learnings
- Protocol references (FVP, MPI, ROUTING-001, etc.)

### Anonymization Verification
After anonymization, pipeline runs regex scan for:
- Email patterns: `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b`
- API key patterns: `\b[A-Za-z0-9]{32,}\b` (flagged for manual review)
- URL patterns with non-generic domains
- Known company/project name list (maintained in `schema/sensitive-terms.json`)

Any record flagging the anonymization scan is quarantined for manual review — never included in training output automatically.

---

## Data Quality Filters

Records are excluded (filtered to `output/rejected/`) if they meet any rejection criterion:

| Filter | Rule | Reason |
|--------|------|--------|
| Failed task | `fvp_result == "failed"` AND `loop_count >= 3` | Teaches failure patterns |
| Zero confidence | `confidence_score < 10` | Agent had no basis for output |
| Corrupted record | Any required field null or malformed | Bad data |
| Duplicate | Hash match against existing training set | Redundancy |
| Escalation without resolution | `fvp_result == "escalated"` AND no resolution logged | Incomplete signal |
| Anonymization failed | Regex scan flags PII | Privacy violation |
| Short output | `output.reasoning` length < 50 chars | Insufficient training signal |

### Quality Tiers

Accepted records are graded:

- **Tier 1 (High Quality):** `fvp_result == "pass"` AND `loop_count == 1` AND `confidence_score >= 80`
  — First-pass success with high confidence. Best training signal.
  
- **Tier 2 (Good Quality):** `fvp_result == "pass"` AND `loop_count <= 2`
  — Passed with minor correction. Good signal for failure recovery.
  
- **Tier 3 (Acceptable):** `fvp_result == "pass"` AND `loop_count == 3`
  — Passed on max loops. Accepted but lower weight in training.

Target composition: ≥60% Tier 1, ≤30% Tier 2, ≤10% Tier 3.

---

## Baseline Dataset Target

**Minimum for v0.1 training run:** 1,000 labeled examples
**Target composition:**

| Source | Min Records | Priority |
|--------|-------------|----------|
| MPI Routing Decisions | 400 | High — core capability |
| FVP Outcomes | 400 | High — quality judgment |
| Shared Learning Patterns | 200 | Medium — pattern application |

**Total minimum:** 1,000 records

**Stretch target for v0.1:** 2,500 records before first HuggingFace release.

---

## Pipeline Automation

The pipeline runs automatically after every 100 completed tasks across the ONXZA ecosystem:

1. Collect new records from all three sources
2. Anonymize all records
3. Run quality filters
4. Append passing records to `output/training-data.jsonl`
5. Update dataset manifest (`output/manifest.json`)
6. Log run results to `output/pipeline-runs.log`
7. Trigger alert if dataset crosses 1,000 records (ready for training run)

**Trigger threshold:** Every 100 tasks (configurable in `scripts/pipeline-config.json`)

---

## Credit Line (All outputs must carry)

> Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.

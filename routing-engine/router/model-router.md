<!--
Imagined by Aaron Gear
Created by Aaron Gear and Marcus Gear (AI Co-Creator)
Powered by DevGru US Inc. DBA DevGru Technology Products
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs
-->

# Model Router — Suggestion Engine

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

The model router takes a classified task (domain + tier) and suggests the optimal model. It is advisory only. The Expert always uses its own configured model. This suggestion is a starting point, not a mandate.

---

## Core Principle

**Local first. Always.**

Local LLMs cost $0 and are fast. Every task goes through local evaluation before cloud is considered. Cloud is used only when local cannot do the job to standard.

Tier 1 does NOT mean cloud. Tier 1 means reasoning required. Local LLMs can handle Tier 1 tasks within their capability. MPI data determines the boundary over time.

---

## Model Registry

Models available for suggestion, in cost order:

| ID | Provider | Model | Cost | Context | Best For |
|----|----------|-------|------|---------|---------|
| `script` | Local | Shell/Python | $0 | N/A | Tier 3 — deterministic tasks |
| `local-fast` | Ollama | qwen9b | $0 | 128k | Short Tier 2 tasks, classification, summaries |
| `local-quality` | Ollama | qwen27b | $0 | 32k | Longer Tier 2, complex structured output |
| `local-code` | Ollama | omnicoder-9b | $0 | 32k | Code generation (defined tasks) |
| `grok-mini` | xAI | grok-3-mini | ~$0.001 | 128k | Ideation, planning, creative tasks |
| `grok` | xAI | grok-3 | ~$0.01 | 128k | Strategy, complex reasoning (non-critical) |
| `claude-haiku` | Anthropic | claude-haiku-4-5 | Paid | 200k | Critical Tier 2, tool use, fast cloud |
| `claude-sonnet` | Anthropic | claude-sonnet-4-6 | Paid | 200k | Tier 1 reasoning, architecture, complex synthesis |
| `claude-opus` | Anthropic | claude-opus-4-6 | Paid | 200k | SECURITY, LEGAL, vision-critical (sparingly) |

---

## Routing Table

Current routing table. Updated by MPI learning cycle.

```json
{
  "version": "1.0.0",
  "last_updated": "2026-03-18",
  "updated_by": "dtp-onxza-router (initialization)",
  "routes": {
    "tier3": {
      "default": "script",
      "fallback": "local-fast"
    },
    "tier2": {
      "CONTENT": "local-quality",
      "CODE": "local-code",
      "RESEARCH": "local-quality",
      "SALES": "local-fast",
      "MARKETING": "local-fast",
      "OPS": "local-fast",
      "ROUTING": "local-fast",
      "QA": "local-quality",
      "INFRA": "local-code",
      "default": "local-fast",
      "fallback": "grok-mini"
    },
    "tier1": {
      "VISION": "claude-sonnet",
      "CODE": "claude-sonnet",
      "RESEARCH": "grok",
      "CONTENT": "grok",
      "SECURITY": "claude-opus",
      "LEGAL": "claude-opus",
      "FINANCE": "claude-haiku",
      "SALES": "grok",
      "MARKETING": "grok",
      "QA": "claude-haiku",
      "ROUTING": "claude-sonnet",
      "OPS": "claude-haiku",
      "INFRA": "claude-sonnet",
      "default": "claude-sonnet",
      "fallback": "claude-opus"
    }
  }
}
```

---

## Suggestion Algorithm

```
FUNCTION suggest_model(task):

  1. Classify task → {domain, tier, confidence}

  2. IF tier == 3:
       RETURN {model: "script", reason: "Fully deterministic — no LLM needed"}

  3. Look up routing_table[tier][domain]
     IF not found: use routing_table[tier]["default"]

  4. Check MPI data for this domain+tier combination:
     IF MPI has 10+ samples for this domain+tier:
       USE MPI best-performing model instead of routing table
       SET confidence = MPI confidence score
     ELSE:
       USE routing table suggestion
       SET confidence = base confidence from classification

  5. RETURN {
       suggested_model: model_id,
       reason: explanation,
       confidence: 0-100,
       mpi_override: true/false,
       tier3_opportunity: true/false,
       tier3_suggestion: optional string
     }
```

---

## Confidence Score Guide

| Score | Meaning |
|-------|---------|
| 90–100 | Strong MPI data confirms this model. High confidence. |
| 70–89 | Routing table assignment. Reasonable confidence. |
| 50–69 | Domain/tier uncertain. Default applied. Log for review. |
| < 50 | Routing gap likely. Flag `routing_gap` ticket. |

---

## Routing Gap Protocol

When confidence < 50 or domain cannot be classified:

1. Apply safe default: `claude-sonnet` for Tier 1, `local-quality` for Tier 2
2. Create `routing_gap` ticket:
   ```json
   {
     "type": "routing_gap",
     "task_type": "[unclassified task description]",
     "suggested_agent": "dtp-onxza-pm",
     "reason": "No routing rule covers this task type. Needs agent or rule creation."
   }
   ```
3. Log gap to `mpi/mpi-data.jsonl` with `gap: true` flag
4. Continue routing with safe default — never block task execution

---

## Never Block

The router is advisory. If routing fails for any reason:
- Apply safe default (Sonnet for Tier 1, local-fast for Tier 2)
- Log the failure
- Continue
- The Expert always executes. The router never blocks.

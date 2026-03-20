---
language:
- en
license: mit
base_model: microsoft/Phi-3.5-mini-instruct
tags:
- agentic
- routing
- local-llm
- fine-tuned
- onxza
- devgru
pipeline_tag: text-generation
library_name: transformers
---

# ONXZA-LLM Mini (v0.1)

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**The first language model trained entirely on real autonomous agent operational data.**

ONXZA-LLM Mini is a fine-tuned version of [microsoft/Phi-3.5-mini-instruct](https://huggingface.co/microsoft/Phi-3.5-mini-instruct), specialized for autonomous agent task routing, FAAILS verification judgment, and ecosystem pattern application. It is part of the [ONXZA](https://onxza.com) agent operating system.

---

## What It Does

ONXZA-LLM Mini is purpose-built for three tasks:

1. **Task Routing** — Given a task description, classify the correct model tier (local / mid-tier / cloud). Replaces cloud API calls for routing decisions with a sub-3-second local inference.

2. **FVP Judgment** — Apply the FAAILS Verification Protocol to evaluate agent outputs. Determines pass / loop-back / escalate without external API calls.

3. **Pattern Application** — Apply known ONXZA ecosystem patterns to novel situations. Reduces repeated reasoning from first principles.

---

## Why It Exists

Every other AI benchmark tests models on static tasks evaluated by humans. ONXZA-LLM is trained on **real autonomous task data** — actual routing decisions, actual verification outcomes, actual patterns from production agentic workflows.

No benchmark exists for how models perform inside live autonomous pipelines. ONXZA-LLM is trained on exactly that evidence.

---

## Intended Use

✅ **Designed for:**
- ONXZA ecosystem agents performing local routing decisions
- Autonomous agent pipelines where cloud API cost or latency is a constraint
- Local-first deployments where data privacy requires on-device inference

⚠️ **Not designed for:**
- General-purpose chat (use the base Phi-3.5-mini for that)
- Tasks requiring web access or tool use (the model has no tool-calling capability)
- High-stakes decisions requiring commercial model accuracy (route those to Claude/Grok per ROUTING-001)

---

## Model Details

| Property | Value |
|----------|-------|
| Base model | microsoft/Phi-3.5-mini-instruct |
| Fine-tune method | LoRA (rank 16, alpha 32) |
| Parameters | 3.8B |
| Quantization | GGUF Q4_K_M |
| Context window | 128k tokens |
| License | MIT |
| Training data | ONXZA operational data (anonymized) |
| Training records | See version notes |

---

## Training Data

Training data is collected, anonymized, and formatted by the ONXZA-LLM training data pipeline (TICKET-20260318-DTP-016).

**Sources:**
- MPI routing decisions: real model routing decisions and outcomes from ONXZA agents
- FVP verification outcomes: real verification pass/fail patterns from the FAAILS protocol
- Shared learning patterns: reusable reasoning patterns discovered by the ONXZA agent ecosystem

**Anonymization:** All training records have company names, personal data, project names, and credentials removed before inclusion. Records failing automated PII scan are quarantined for manual review and excluded from training.

**Quality standards:**
- Only FVP-passing records included (no failed-task data)
- Minimum reasoning length enforced (no thin examples)
- Deduplicated by content hash
- Quality tier tracking: Tier 1 (first-pass, high confidence) weighted highest

---

## Benchmark Results

*Populated after training run. Benchmark methodology: holdout set (20% of training data, not seen during fine-tuning). Metric: routing decision accuracy — correct model tier selected for given task type.*

| Task Type | Accuracy | vs. Baseline (random) |
|-----------|----------|----------------------|
| Routing | — | — |
| FVP Judgment | — | — |
| Pattern Application | — | — |
| **Overall** | **—** | **—** |

Acceptance threshold for public release: **>60% overall routing accuracy**.

---

## Limitations

- **Domain-specific:** Optimized for ONXZA ecosystem tasks. Performance on general tasks is equivalent to base Phi-3.5-mini.
- **No tool use:** Model generates text only. Cannot call tools or browse the web.
- **Not a replacement for all tasks:** High-accuracy or safety-critical tasks should still route to commercial models per ROUTING-001.
- **v0.1:** This is a first release. Dataset is small by LLM standards. Accuracy improves as the ecosystem generates more training data.
- **English only:** Training data is English. Non-English performance is untested.

---

## How to Use

### Via Ollama (recommended)
```bash
onxza pull onxza-llm          # Install mini (default)
onxza pull onxza-llm:mini     # Explicit variant
```

### Via Ollama directly
```bash
ollama pull devgru-tech/onxza-llm-mini
ollama run devgru-tech/onxza-llm-mini
```

### Via HuggingFace transformers
```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model_id = "devgru-tech/onxza-llm-mini"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id)
```

---

## Prompt Format

ONXZA-LLM uses the Phi-3.5 chat template:

```
<|user|>
Given this task, determine the optimal model routing decision. Explain your reasoning.

Task: Summarize a 5-page research document and produce a 3-bullet executive summary.
Task type: research
<|end|>
<|assistant|>
```

---

## Version History

| Version | Date | Training Records | Notes |
|---------|------|-----------------|-------|
| v0.1.0 | 2026 | — | Initial release |

---

## Citation

```bibtex
@misc{onxza-llm-mini-2026,
  title={ONXZA-LLM Mini: A Local Model for Autonomous Agent Routing and Verification},
  author={DevGru Technology Products},
  year={2026},
  publisher={HuggingFace},
  url={https://huggingface.co/devgru-tech/onxza-llm-mini}
}
```

---

## About DevGru Technology Products

DevGru Technology Products builds ONXZA — the AI Company Operating System. ONXZA-LLM is the local intelligence layer that closes the cloud dependency loop for autonomous agent deployments.

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

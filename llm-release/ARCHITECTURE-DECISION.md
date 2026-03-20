# ONXZA-LLM v0.1 — Architecture Decision

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Decision by:** DTP_ONXZA_LLM  
**Date:** 2026-03-18  
**Status:** Final

---

## Decision: Fine-tune Phi-3.5-mini (3.8B) for mini variant, Mistral-7B-v0.3 for standard, Mistral-7B-Instruct for pro

---

## Candidates Evaluated

| Model | Params | License | Local Inference | VRAM (4-bit) | Reasoning |
|-------|--------|---------|-----------------|--------------|-----------|
| Llama-3.2-1B | 1B | Meta Llama | ✓ | ~1GB | Too small for routing quality |
| Phi-3.5-mini | 3.8B | MIT | ✓ | ~2.5GB | **Best quality-per-parameter for instruction following** |
| Llama-3.2-3B | 3B | Meta Llama | ✓ | ~2GB | Good, but Phi-3.5-mini outperforms at same size |
| Mistral-7B-v0.3 | 7B | Apache 2.0 | ✓ | ~4.5GB | **Strong instruction following, proven fine-tuning base** |
| Llama-3.1-8B | 8B | Meta Llama | ✓ | ~5GB | Good, but Mistral-7B trains faster with less data |
| Mistral-7B-Instruct | 7B | Apache 2.0 | ✓ | ~4.5GB | **Pre-instruction-tuned, less data needed for fine-tune** |
| Qwen2.5-7B | 7B | Apache 2.0 | ✓ | ~4.5GB | Strong, but ecosystem already uses qwen9b locally |
| Phi-4 | 14B | MIT | ✓ | ~9GB | Too large for mini target; deferred to v0.2 pro+ |

---

## Selected Architecture

### `onxza-llm-mini` (v0.1)
**Base:** `microsoft/Phi-3.5-mini-instruct`  
**Fine-tune method:** LoRA (rank 16, alpha 32) on full training JSONL  
**Quantization for distribution:** GGUF Q4_K_M via llama.cpp  
**Target VRAM:** <3GB  
**Target hardware:** Any Mac with Apple Silicon or 8GB+ RAM  
**Inference speed target:** <2s per routing decision on M1

**Why Phi-3.5-mini:**
- MIT license — no restrictions on commercial use or redistribution
- 3.8B parameters hits the sweet spot: capable enough for routing and FVP judgment, small enough to run everywhere
- Microsoft's instruction-following fine-tuning is strong out of the box — requires less training data to shift behavior
- 128k context window — handles long task descriptions and full FVP outputs
- Already proven at DevGru (qwen variants in use — Phi-3.5 is the quality step-up at equivalent size)

---

### `onxza-llm-standard` (v0.1)
**Base:** `mistralai/Mistral-7B-v0.3`  
**Fine-tune method:** LoRA (rank 32, alpha 64) on full training JSONL  
**Quantization for distribution:** GGUF Q4_K_M  
**Target VRAM:** <6GB  
**Target hardware:** 16GB RAM Mac or Linux workstation with GPU  
**Inference speed target:** <5s per decision on M2

**Why Mistral-7B:**
- Apache 2.0 license — fully open, commercial use unrestricted
- 7B sweet spot for agent routing tasks: enough capacity for complex reasoning without excessive resource requirements
- Proven fine-tuning base with extensive community tooling
- Strong performance on instruction following with LoRA

---

### `onxza-llm-pro` (v0.1)
**Base:** `mistralai/Mistral-7B-Instruct-v0.3`  
**Fine-tune method:** LoRA (rank 64, alpha 128) — more aggressive adaptation  
**Quantization for distribution:** GGUF Q5_K_M (higher precision)  
**Target VRAM:** <8GB  
**Target hardware:** 32GB RAM Mac or dedicated GPU  
**Inference speed target:** <8s per decision on M2 Pro

**Why Instruct variant for pro:**
- Pre-instruction-tuned — starts closer to the target behavior, allowing fine-tuning to refine rather than reshape
- Higher rank LoRA preserves more nuance from the training data
- Q5 quantization retains more model quality for pro users who have the hardware

---

## Fine-Tuning Method: LoRA (Low-Rank Adaptation)

Chosen over full fine-tuning for all three variants:

| Factor | Full Fine-tune | LoRA |
|--------|---------------|------|
| GPU requirement | A100 (80GB) or multi-GPU | Single consumer GPU (24GB) or Apple Silicon |
| Training time (1K examples) | 12-24 hours | 2-4 hours |
| Compute cost | $50-200 cloud GPU | $5-20 cloud GPU |
| Risk of catastrophic forgetting | High | Low |
| Adapter portability | N/A | LoRA adapter ships separately, can merge |

**LoRA library:** `unsloth` (4-5x faster than HuggingFace PEFT alone, free tier on Colab)

---

## Training Framework

```
unsloth + HuggingFace transformers + PEFT
→ Export merged model
→ llama.cpp convert to GGUF
→ Quantize to Q4_K_M / Q5_K_M
→ Upload to HuggingFace
→ Ollama Modelfile for onxza pull
```

---

## Training Data Requirements (Revised)

| Variant | Min Examples | Quality Requirement |
|---------|-------------|---------------------|
| mini | 1,000 | ≥60% Tier 1, ≥200 routing examples |
| standard | 2,500 | ≥65% Tier 1, ≥500 routing examples |
| pro | 5,000 | ≥70% Tier 1, balanced source distribution |

Current dataset: 16 records. Pipeline running. Training begins when thresholds are met.

---

## Benchmark Target: >60% routing accuracy on holdout set

Holdout set construction: 20% of training data reserved before fine-tuning (not seen during training).  
Evaluation metric: Correct model tier selection (local / mid-tier / claude) for given task type.  
Acceptance threshold: >60% accuracy on holdout for v0.1 release.

---

## Compute Plan

| Training run | Estimated cost | Platform |
|-------------|---------------|----------|
| mini (1K examples, LoRA) | ~$5-10 | Google Colab Pro / Modal / RunPod |
| standard (2.5K examples, LoRA) | ~$15-25 | Same |
| pro (5K examples, LoRA) | ~$25-40 | Same |

Compute is triggered when dataset thresholds are met. DTP_ONXZA_LLM creates `training_run_request` ticket to DTP_ONXZA_ScriptEngine at that point.

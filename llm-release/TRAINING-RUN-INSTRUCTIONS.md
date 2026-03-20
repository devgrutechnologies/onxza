# ONXZA-LLM v0.1 — Training Run Instructions

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Prepared by:** DTP_ONXZA_LLM  
**Status:** Ready to execute when dataset reaches 1,000 records  
**Current dataset:** 16 records — pipeline running

---

## Prerequisites

Before starting:
- [ ] Dataset: 1,000+ records (`node scripts/run-pipeline.js --status`)
- [ ] HuggingFace account created and API token stored (`private/api_keys.md`)
- [ ] GPU compute provisioned (see options below)
- [ ] Python 3.10+ with pip

---

## Step 1: Set Up Training Environment

### Option A: Google Colab (recommended for first run — cheapest)
1. Open https://colab.research.google.com
2. Runtime → Change runtime type → GPU (A100 or T4)
3. Upload `output/training-data.jsonl` to Colab
4. Run the training notebook (see below)

### Option B: RunPod / Modal (for automation)
```bash
# RunPod: rent an A100 80GB pod for ~$2/hr
# Modal: modal run train.py (billed per second)
```

---

## Step 2: Install Dependencies

```bash
pip install unsloth
pip install huggingface_hub
pip install transformers datasets peft trl
```

---

## Step 3: Training Script (mini variant)

```python
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments
import json

# Load base model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="microsoft/Phi-3.5-mini-instruct",
    max_seq_length=4096,
    dtype=None,
    load_in_4bit=True,
)

# Add LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_alpha=32,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)

# Format training data for Phi-3.5 chat template
def format_record(record):
    return {
        "text": f"<|user|>\n{record['input']['instruction']}\n\n{record['input']['context']}<|end|>\n<|assistant|>\n{record['output']['reasoning']}\n\n**Decision:** {record['output']['decision']}<|end|>"
    }

# Load dataset (exclude holdout — filter by ID if holdout set exists)
import json
with open("training-data.jsonl") as f:
    records = [json.loads(line) for line in f if line.strip()]

# Exclude holdout records
try:
    with open("holdout-set.jsonl") as f:
        holdout_ids = {json.loads(line)["id"] for line in f if line.strip()}
    records = [r for r in records if r["id"] not in holdout_ids]
except FileNotFoundError:
    pass  # No holdout yet — use all records

formatted = [format_record(r) for r in records]
from datasets import Dataset
dataset = Dataset.from_list(formatted)

# Training config
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=4096,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=10,
        num_train_epochs=3,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=10,
        output_dir="./onxza-llm-mini-lora",
        save_strategy="epoch",
        report_to="none",
    ),
)

trainer.train()

# Save LoRA adapter
model.save_pretrained("onxza-llm-mini-lora")
tokenizer.save_pretrained("onxza-llm-mini-lora")

# Merge and save full model
model.save_pretrained_merged("onxza-llm-mini-merged", tokenizer)
```

---

## Step 4: Export to GGUF

```bash
# Install llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make -j

# Convert merged model to GGUF
python convert_hf_to_gguf.py ../onxza-llm-mini-merged --outtype q4_k_m --outfile onxza-llm-mini-q4_k_m.gguf
```

---

## Step 5: Run Benchmark

```bash
# Install model to Ollama first
ollama create onxza-llm:mini -f Modelfile

# Run benchmark against holdout set
node scripts/benchmark.js --variant mini
```

**Must pass:** >60% routing accuracy on holdout set.  
If fails: more training data needed, or adjust LoRA hyperparameters.

---

## Step 6: Publish to HuggingFace

```bash
# Upload model files
python -c "
from huggingface_hub import HfApi
api = HfApi()

# Upload model card
api.upload_file(
    path_or_fileobj='llm-release/MODEL-CARD-mini.md',
    path_in_repo='README.md',
    repo_id='devgru-tech/onxza-llm-mini',
    token='YOUR_HF_WRITE_TOKEN'
)

# Upload GGUF
api.upload_file(
    path_or_fileobj='onxza-llm-mini-q4_k_m.gguf',
    path_in_repo='onxza-llm-mini-q4_k_m.gguf',
    repo_id='devgru-tech/onxza-llm-mini',
    token='YOUR_HF_WRITE_TOKEN'
)

# Upload LoRA adapter
api.upload_folder(
    folder_path='onxza-llm-mini-lora',
    repo_id='devgru-tech/onxza-llm-mini',
    path_in_repo='lora-adapter',
    token='YOUR_HF_WRITE_TOKEN'
)
"

# Tag version
# huggingface-cli tag devgru-tech/onxza-llm-mini v0.1.0
```

---

## Step 7: Notify DTP_ONXZA_LLM

After publish:
1. Create `llm_release` ticket with benchmark results and HuggingFace URL
2. DTP_ONXZA_LLM updates model-performance-index.md
3. Update CHANGELOG.md in projects/onxza/

---

## Compute Cost Estimate (mini variant, 1K examples)

| Resource | Time | Cost |
|----------|------|------|
| Google Colab A100 | ~2 hrs | ~$10 |
| RunPod A100 | ~2 hrs | ~$7 |
| Modal A10G | ~3 hrs | ~$6 |

Training mini first — validate quality, then proceed to standard and pro.

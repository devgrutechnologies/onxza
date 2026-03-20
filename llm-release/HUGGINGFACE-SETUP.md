# HuggingFace Setup Guide — ONXZA-LLM

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Prepared by:** DTP_ONXZA_LLM  
**Status:** Ready for execution — requires Aaron (human) for account creation  
**Estimated time:** 15 minutes

---

## What Needs Human Action (Aaron)

The following steps require account creation at huggingface.co. Everything else in this ticket is automated.

---

## Step 1: Create HuggingFace Account

1. Go to https://huggingface.co/join
2. Create account with DevGru email (recommended: `dev@devgru.com` or `ai@devgru.com`)
3. Verify email

---

## Step 2: Create Organization

1. Click your profile → Settings → Organizations → New Organization
2. **Organization name:** `devgru-tech` (or `onxza` if available)
3. **Display name:** DevGru Technology Products
4. **Description:** ONXZA-LLM — AI model trained on autonomous agent operational data. Built for local-first agentic workflows.
5. Set visibility: Public

---

## Step 3: Create Model Repository

For each variant, create a repo:
- `devgru-tech/onxza-llm-mini`
- `devgru-tech/onxza-llm-standard`  
- `devgru-tech/onxza-llm-pro`

Steps for each:
1. Go to Models → New Model
2. Name as above
3. License: **MIT** (matching Phi-3.5-mini base for mini; Apache 2.0 for standard/pro)
4. Set visibility: Public

---

## Step 4: Generate API Token

1. Settings → Access Tokens → New Token
2. Name: `onxza-pipeline-write`
3. Role: **Write** (needed for model upload)
4. Copy token → store in `~/.openclaw/workspace/private/api_keys.md` under `huggingface_write_token`

---

## Step 5: Install huggingface_hub CLI

```bash
pip install huggingface_hub
huggingface-cli login
# Paste your write token when prompted
```

---

## After Setup

Once account and repos are created, DTP_ONXZA_LLM handles:
- Model card upload (written, ready to push)
- GGUF model file upload
- Ollama Modelfile publication
- Version tagging

Notify DTP_ONXZA_LLM when Step 4 (API token) is complete. Pipeline will proceed automatically.

---

## Repository Naming Convention

| Variant | HuggingFace Repo | Ollama Tag |
|---------|-----------------|------------|
| mini | `devgru-tech/onxza-llm-mini` | `onxza-llm:mini` |
| standard | `devgru-tech/onxza-llm-standard` | `onxza-llm:standard` |
| pro | `devgru-tech/onxza-llm-pro` | `onxza-llm:pro` |

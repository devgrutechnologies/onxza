# FAAILS-007: Automation Tier Framework

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

Not all work requires an LLM. The Automation Tier Framework classifies tasks by the level of reasoning required and the appropriate execution method. This drives cost efficiency and system reliability.

---

## 1. Core Principle: Push to Tier 3

```
Tier 1 → Tier 2 → Tier 3 (Goal)
LLM       Script+    Pure
Required  LLM        Script
```

Every repeatable task that can be automated to a script should be, over time. This is the primary cost reduction mechanism and reliability improvement mechanism in FAAILS.

**The progression:**
1. A task is completed manually with LLM reasoning (Tier 1)
2. As patterns emerge, parts are scripted; LLM handles judgment (Tier 2)
3. Eventually, the entire task is automated; zero LLM tokens (Tier 3)

---

## 2. Three Tiers Defined

### 2.1 Tier 1 — Reasoning Required

**Definition:** Novel reasoning about a task is needed. An LLM must read context, understand intent, and produce judgment.

**Examples:**
- Writing a blog post on a novel topic
- Deciding which model is best for a task
- Analyzing ambiguous requirements
- Debugging a novel error
- Designing an architecture

**Execution:**
- Any LLM capable of the reasoning
- Router suggests model based on task complexity
- Expert uses its configured model
- No scripting
- Human verification may be required

**Cost profile:** High (full LLM compute)

**Reliability:** Depends on model quality. First-attempt success varies.

**Tier classification rules:**
- If a human would need to think about it → Tier 1
- If the task involves judgment → Tier 1
- If there's genuine novelty → Tier 1

### 2.2 Tier 2 — Script + LLM Hybrid

**Definition:** The task has fixed mechanical components (script-able) and a judgment component (LLM-required). Script handles the mechanics; LLM handles only the judgment layer.

**Examples:**
- Processing structured data with one validation rule per record (script does processing, LLM does validation)
- Code generation from a template (script generates the template, LLM customizes)
- Testing with assertions (script runs tests, LLM interprets results)
- Data transformation (script does ETL, LLM decides edge cases)

**Execution:**
1. Script runs and produces structured output
2. LLM reads output and produces judgment
3. Script executes judgment
4. Repeat if needed

**Cost profile:** Medium (partial LLM compute)

**Reliability:** High (script handles deterministic parts, LLM handles judgment)

**Tier classification rules:**
- If 80%+ of the work is mechanical → Tier 2
- If a script can do 50%+ and LLM handles the rest → Tier 2
- If work has clear phases (script phase, then LLM phase) → Tier 2

### 2.3 Tier 3 — Pure Script / Cron / Automation

**Definition:** The task is completely deterministic and rule-based. Zero LLM tokens. Pure Python, shell, n8n workflow, or cron job.

**Examples:**
- Fetching data from an API and writing to a database
- Running tests and reporting results
- Rotating credentials on schedule
- Sending alerts when metrics exceed thresholds
- Processing log files and extracting patterns (if rules are known)
- Batch data transformation

**Execution:**
- Script runs on schedule or on-trigger
- No human intervention needed
- Runs fastest, costs least, most reliable

**Cost profile:** Lowest (zero LLM tokens)

**Reliability:** Very high (deterministic)

**Tier classification rules:**
- If the work is completely rule-based → Tier 3
- If there's zero judgment required → Tier 3
- If the same script runs unchanged repeatedly → Tier 3

---

## 3. Tier Classification Matrix

| Task Characteristics | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| Requires reasoning | Yes | Partial | No |
| Has judgment layer | Yes | Yes | No |
| Has mechanical layer | No | Yes | Yes |
| LLM involvement | All work | Judgment only | None |
| Deterministic | No | Partial | Yes |
| Script can automate | No | 50%+ | 100% |
| Human verification common | Yes | Rare | No |
| First-pass success | 70–90% | 90–95% | 99%+ |

---

## 4. Model Selection (Cost Principle)

**Principle:** Use the least expensive model that produces correct output.

### 4.1 For Tier 1 (Reasoning Required)

Priority order:
1. **Local LLM first** (Ollama, local instance) — if task is within its capability, it's cheapest and fastest
2. **Cloud model** (Claude, GPT-4, etc.) — if local can't handle it

Do NOT assume cloud model is required for Tier 1. Local LLMs handle much Tier 1 work successfully.

**Fallback decision tree:**
```
Can local LLM handle this task?
  → Yes: Use local LLM
  → No: Is Claude Haiku capable?
       → Yes: Use Claude Haiku (cheapest capable cloud model)
       → No: Use Claude Opus or GPT-4o
```

### 4.2 For Tier 2 (Hybrid)

- Script component: Python or shell (zero cost)
- LLM component: Try local first, then cloud if needed
- Most Tier 2 tasks can use local LLMs for the judgment layer

### 4.3 For Tier 3 (Pure Script)

Zero LLM cost. Execution cost depends on:
- Compute requirements
- Execution time
- External API calls (if any)

---

## 5. Measuring Tier Classification

How do you know if a task is Tier 1, 2, or 3?

### 5.1 For a New Task

Before execution:
1. Can this be completely automated with a script? → Tier 3
2. Can 50%+ be scripted? → Tier 2
3. Otherwise → Tier 1

### 5.2 For a Repeated Task

After several executions:
- If it always succeeds first-try with the same approach → Tier 3 (automation candidate)
- If it needs judgment on 30–50% of cases → Tier 2 (hybrid candidate)
- If it always needs novel reasoning → Tier 1 (keep as-is)

---

## 6. Tier Progression Strategy

### 6.1 Identifying Tier Progression Opportunities

After completing a Tier 1 task:

**Reflection questions:**
- What part of this task was mechanical?
- What part required judgment?
- Could a script have done the mechanical part?
- Could we build a Tier 2 hybrid?

**Example progression:**
- Task: Review and approve pull requests
- First iteration (Tier 1): LLM reads entire PR and decides approve/reject
- Iteration 2 (Tier 2): Script runs tests; LLM reviews code only if tests pass
- Iteration 3 (Tier 3): Completely scripted — only failed tests are reviewed

### 6.2 Building Tier 2 From Tier 1

1. Run the Tier 1 task 3+ times
2. Extract the mechanical patterns
3. Write a script for those patterns
4. Update the task to Tier 2 (script + LLM judgment)
5. Compare cost/reliability improvement

### 6.3 Building Tier 3 From Tier 2

1. Track which judgment decisions are repetitive
2. Encode those decisions as rules
3. Encode rules into script
4. Remove LLM from the loop
5. Verify the script handles all cases

---

## 7. Tier Documentation

When assigning a task, specify its tier:

**In ticket:**
```yaml
tier: [1 | 2 | 3]
```

**In MEMORY.md or task notes:**
```markdown
## Task: [Name]
- Tier: 2 (Script + LLM hybrid)
- Script handles: [X]
- LLM handles: [Y]
- Estimated cost: [cost]
```

This enables tracking, cost analysis, and tier progression planning.

---

## 8. Tier Progression Tracking

Over time, a FAAILS system should shift from Tier 1-heavy to Tier 3-heavy:

**Healthy progression:**
- Year 1: 60% Tier 1, 30% Tier 2, 10% Tier 3
- Year 2: 40% Tier 1, 40% Tier 2, 20% Tier 3
- Year 3: 20% Tier 1, 40% Tier 2, 40% Tier 3
- Mature: 10% Tier 1, 30% Tier 2, 60% Tier 3

**Metric to track:**
```
Tier 3 score = (# Tier 3 tasks) / (total tasks)
Goal: Increase by 10% every 6 months
```

---

## 9. Tier and FVP Verification

### 9.1 FVP Differs by Tier

**Tier 1:** FVP checks humanization + accuracy — can loop 3 times

**Tier 2:** FVP checks script output + LLM judgment output — rarely loops

**Tier 3:** FVP checks script exit code + log output — loops only if syntax error

### 9.2 Pass Rates by Tier

Expect:
- Tier 1: 70–85% first-pass FVP
- Tier 2: 90–98% first-pass FVP
- Tier 3: 99%+ first-pass FVP

If a Tier 1 task is consistently failing FVP, candidate for Tier 2 conversion.

---

## 10. Examples

### Example 1: Tier 1 Task

**Task:** Write a press release for a new product feature

- Requires: Novel reasoning about messaging, audience, impact
- No script possible: Every product is different
- Classification: Tier 1
- Model: Claude Sonnet (complex writing)
- Cost: ~$0.10–0.50 per press release

### Example 2: Tier 2 Task

**Task:** Process customer feedback and extract themes

- Script part (80%): Parse CSV, normalize text, count frequency
- LLM part (20%): Interpret themes, suggest actions
- Classification: Tier 2
- Execution:
  1. Script processes 1000 feedback entries
  2. Script extracts top 50 recurring phrases
  3. LLM reads top 50 phrases and identifies 5 themes
  4. Script outputs theme report
- Cost: ~$0.02 (mostly CSV parsing; minimal LLM)
- First-pass success: 97%

### Example 3: Tier 3 Task

**Task:** Fetch daily metrics from API, compute averages, send alert if threshold exceeded

- Completely rule-based: No judgment
- Classification: Tier 3
- Execution: Pure Python script, runs on schedule
- Cost: ~$0.0001 (API call only, no LLM)
- Reliability: 99.99%

---

## 11. Compliance and Decision Checklist

Before assigning a task:

- [ ] Tier classification is explicit (1, 2, or 3)
- [ ] If Tier 2: script scope and LLM scope are clear
- [ ] If Tier 3: script is tested and documented
- [ ] Cost estimate is included
- [ ] Appropriate model is selected (cost-first principle)
- [ ] FVP expectations are set (loop limit varies by tier)
- [ ] Task is documented in ticket with tier info

---

*This specification is part of FAAILS. Maintained by DTP_ONXZA_Docs.*  
*Specification version: 1.0 — 2026-03-18*

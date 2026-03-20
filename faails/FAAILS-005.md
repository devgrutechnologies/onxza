# FAAILS-005: Shared Learnings Architecture

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

Shared Learnings is the mechanism by which knowledge flows through a FAAILS system. Specialists learn, companies accumulate, standards improve. This specification defines the architecture, types, promotion paths, and governance of shared learnings.

---

## 1. The Principle: Learning Flows Up

```
Specialist agent learns something on a task
        │
        ▼
Writes to company shared-learnings/[Company]/
        │
        ▼
Company PM reviews → promotes to global if cross-company valuable
        │
        ▼
MG_Parent_AgentDeveloper reviews → updates global standard if systemic
        │
        ▼
[Future] FAAILS community → public specification contribution
```

At each level, the learning is vetted, refined, and only promoted if it provides value at the next level. This prevents noise but ensures valuable knowledge rises.

---

## 2. Shared Learnings Directory Structure

```
~/.openclaw/workspace/shared-learnings/
├── global/
│   ├── skills/
│   │   ├── [skill-name].md
│   │   └── [skill-name].md
│   ├── patterns/
│   │   ├── [pattern-slug].md
│   │   └── [pattern-slug].md
│   ├── tool-notes/
│   │   ├── [tool-name]-[note-slug].md
│   │   └── [tool-name]-[note-slug].md
│   ├── escalation-logs/
│   │   └── [escalation-type]-[slug].md
│   └── model-observations/
│       └── [model-name]-[observation-slug].md
│
├── WDC/  (World Destination Club)
│   ├── skills/
│   ├── patterns/
│   ├── tool-notes/
│   ├── escalation-logs/
│   └── model-observations/
│
├── MGA/  (Marcus Gear Agency)
│   └── [same structure]
│
└── DTP/  (DevGru Technology Products)
    └── [same structure]
```

**Rules:**
- One directory per company at company level
- One directory per category within each level
- No nesting beyond category level (files, not folders, in tool-notes/ etc.)

---

## 3. Shared Learning Types

### 3.1 SKILL (skills/)

A skill is a packaged knowledge document for a specialized domain. It is not code — it is instructions and reference material that an agent loads to operate in that domain.

**Examples:**
- `linkedin-outreach-strategy.md` — how to approach LinkedIn professionally
- `api-documentation-best-practices.md` — how to write clear API docs
- `customer-onboarding-flow.md` — step-by-step onboarding process
- `python-async-patterns.md` — common async patterns in Python

**Structure:**
```yaml
---
type: skill
skill_id: [slug]
agent: [creator-agent-id]
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
version: [1.0]
tags: [tag1, tag2]
scope: [agent-private | company | global]
credit_line: present
---

## Skill: [Name]

### Purpose
What this skill teaches or provides.

### When to Use
When to load and apply this skill.

### Key Concepts
1. [Concept 1]
2. [Concept 2]

### How-To
Step-by-step instructions or reference material.

### Common Pitfalls
Things that go wrong and how to avoid them.

### Example
[Concrete example]
```

**Minimum length:** 500 words  
**Scope:** Can be agent-private, company-level, or global

### 3.2 PATTERN (patterns/)

A pattern is a reusable approach that solved a problem successfully.

**Examples:**
- `batch-processing-large-datasets` — how to chunk work for scalability
- `model-selection-by-task-complexity` — decision tree for model choice
- `managed-dependency-rollout` — how to safely update dependencies
- `async-polling-with-exponential-backoff` — implementation pattern

**Structure:**
```yaml
---
type: pattern
memory_id: [slug]
agent: [creator-agent-id]
created: YYYY-MM-DD
tags: [tag1, tag2]
summary: [one-liner]
promotable: [true | false]
credit_line: present
---

## Pattern: [Name]

### The Problem
What problem does this pattern solve?

### The Solution
How it works. Why it works.

### When to Apply
When is this pattern the right choice?

### When NOT to Apply
When should you use something else?

### Implementation Steps
1. [Step 1]
2. [Step 2]

### Variations
[Alternative implementations]

### Trade-offs
What you give up using this pattern.
```

**Minimum length:** 300 words  
**Scope:** Always company or global (not agent-private)  
**Promotable:** Flag if this pattern is valuable to other companies

### 3.3 CORRECTION (patterns/)

A correction documents something that failed and how to fix or avoid it.

**Examples:**
- `why-empty-catch-blocks-break-debugging` — what to do instead
- `the-race-condition-in-order-processing` — how we discovered and fixed it
- `when-retry-logic-masks-real-errors` — the hidden cost of naive retries
- `model-output-validation-failure-mode` — how we learned to validate

**Structure:**
```yaml
---
type: correction
memory_id: [slug]
agent: [creator-agent-id]
created: YYYY-MM-DD
tags: [tag1, tag2]
summary: [one-liner, "What we did wrong"]
promotable: true
credit_line: present
---

## Correction: [What Went Wrong]

### The Mistake
What we tried or assumed.

### Why It Failed
What actually happened. Impact.

### Root Cause
Why the mistake made sense at the time.

### The Fix
What we did to fix it.

### How to Avoid It
Rules or checks to prevent this in future.

### Generalization
Does this apply to similar problems?
```

**Minimum length:** 250 words  
**Scope:** Always company or global  
**Promotable:** Almost always true (failures are learning gold)

### 3.4 TOOL_NOTE (tool-notes/)

Observed behavior of an external tool, API, or service.

**Examples:**
- `slack-api-rate-limits-actually-are` — what the docs don't say
- `github-webhook-timeout-behavior` — what happens when it's slow
- `stripe-idempotency-keys-nuance` — how it actually works
- `openai-context-window-measurement` — real token counting

**Structure:**
```yaml
---
type: tool_note
memory_id: [tool-slug-note-slug]
agent: [creator-agent-id]
created: YYYY-MM-DD
tags: [tool-name, tag2]
summary: [one-liner]
tool: [tool-name-and-version]
credit_line: present
---

## Tool: [Tool Name] — [Note Title]

### Context
When and why we discovered this.

### Observation
What we found. What the tool actually does.

### Impact
How this affects our work with the tool.

### Workaround (if applicable)
How to work around limitations.

### Reference
Link to official documentation (if any).
```

**Minimum length:** 200 words  
**Scope:** Company or global  
**Tools covered:** APIs, SDKs, CLIs, external services

### 3.5 ESCALATION_LOG (escalation-logs/)

Why something escalated and how it was resolved.

**Examples:**
- `when-cost-explodes-escalation-and-bounds` — a runaway budget taught us this
- `security-flag-escalation-process` — how security flags move through the system
- `fvp-loop-exhaustion-escalation` — when 3 loops aren't enough
- `model-selection-disagreement-resolution` — router vs expert conflict handling

**Structure:**
```yaml
---
type: escalation_log
memory_id: [slug]
agent: [creator-agent-id]
created: YYYY-MM-DD
tags: [escalation-type, tag2]
summary: [one-liner]
promotable: true
credit_line: present
---

## Escalation: [Type]

### What Triggered Escalation
The situation that required escalation.

### Escalation Path Taken
Who escalated to whom. How it moved.

### Resolution
How was it resolved? Who decided?

### Lesson
What did we learn about escalation?

### Process Improvement
Should our escalation procedures change?
```

**Minimum length:** 250 words  
**Scope:** Company or global  
**Promotable:** True (escalations reveal process gaps)

### 3.6 MODEL_OBSERVATION (model-observations/)

Performance observations about specific models used in tasks.

**Examples:**
- `gpt-4o-structured-output-latency-vs-accuracy` — data on tradeoffs
- `claude-opus-long-context-capabilities-tested` — what it can actually do
- `local-llm-capability-boundaries` — where it hits a wall
- `grok-real-time-data-freshness-measurement` — how fresh is it really?

**Structure:**
```yaml
---
type: model_observation
memory_id: [model-slug-observation-slug]
agent: [creator-agent-id]
created: YYYY-MM-DD
tags: [model-name, performance-type]
summary: [one-liner]
model: [model-name-and-version]
anonymized: [true | false]
credit_line: present
---

## Model: [Model Name] — [Observation]

### Context
What task type. What scenario.

### Observation
What we measured or observed.

### Data (if quantified)
- Latency: X ms (±Y)
- Accuracy: X% (sample size N)
- Cost: $X per 1M tokens
- Token efficiency: X% of naive approach

### Conclusion
What this tells us about the model.

### Relevance to MPI
How does this inform routing decisions?
```

**Minimum length:** 200 words  
**Scope:** Company or global  
**Anonymized:** true if contains task details that shouldn't be public

---

## 4. Shared Learning Metadata Standard

Every shared learning file (all types) must include:

**YAML frontmatter:**
- `type` — one of: skill, pattern, correction, tool_note, escalation_log, model_observation
- `memory_id` — unique slug (kebab-case, 20 chars max)
- `agent` — creator agent ID
- `created` — ISO date
- `tags` — list of 3–5 searchable tags
- `summary` — one-sentence summary (for listing/search)
- `credit_line` — always "present"

**Additional fields by type:**
- skill: skill_id, version, scope
- pattern: promotable flag
- correction: promotable flag (usually true)
- tool_note: tool name and version
- escalation_log: promotable flag (usually true)
- model_observation: model name, anonymized flag

---

## 5. Shared Learning Lifecycle

### 5.1 Creation

An agent completes a task and identifies something valuable:

```
1. Agent writes shared learning file
2. File saved to shared-learnings/[Company]/[category]/[id].md
3. File includes all required frontmatter
4. File passes TORI-QMD validation
5. Agent submits ticket: contribution_notification or pattern_contribution
```

### 5.2 Company Review

Company PM or designated reviewer reads and assesses:

**Criteria:**
- Is this generalizable or proprietary?
- Are tags appropriate?
- Is the writing clear?
- Is the content accurate?
- Should this be promoted to global?

**Decision:**
- `APPROVED` — stays in company, search-indexed
- `REVISE` — returned for improvements
- `REJECT` — deleted or stored elsewhere
- `PROMOTE` — recommended for global

### 5.3 Global Promotion

If marked for global promotion:

1. MG_Parent_AgentDeveloper reviews
2. Assesses cross-company value
3. If valuable: copies to `shared-learnings/global/[category]/`
4. Original company learning links to global version
5. Global version becomes canonical; company version references it

**Criteria for global promotion:**
- Valuable to 2+ companies
- Generalizable (not specific to one context)
- Accurate and well-written
- Fills a gap in global standards

### 5.4 FAAILS Community Contribution

Periodically, valuable shared learnings are considered for public contribution to FAAILS:

1. AgentDeveloper selects candidates (patterns + corrections mostly)
2. Anonymizes if needed (remove company, client details)
3. Formats for FAAILS community repository
4. Submits with attribution
5. Publishes if approved by FAAILS stewards

---

## 6. Searching and Discovering Shared Learnings

Every FAAILS system must support:

**Search by:**
- Type (skill, pattern, correction)
- Tag (any tag in the document)
- Agent (creator)
- Date range
- Keyword (title and summary)

**Filtering:**
- Scope (agent-private, company, global)
- Promotable (yes/no)
- Company

**Output formats:**
- Human-readable summary (title, summary, agent, date)
- Full document markdown
- Machine-readable JSON (metadata only)

---

## 7. Skill Installation and Loading

### 7.1 Using a Skill

When an agent needs a skill:

```
Agent reads TOOLS.md
Sees reference to "markdown-documentation-best-practices" skill
Loads shared-learnings/global/skills/markdown-documentation-best-practices.md into context
Applies the skill to the current task
```

### 7.2 Skill Version Management

Skills can be updated. Agents should:

1. Pin to a version if critical behavior depends on it
2. Periodically review if newer versions are available
3. Opt-in to updates (not auto-updated)

**Version field in skill:** Incremented when substantive changes made

---

## 8. Governance and Quality

### 8.1 TORI-QMD Validation

All shared learnings must pass TORI-QMD:

```bash
python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py shared-learnings/[Company]/patterns/[file].md
```

**Required fields per type:**
- skill: skill_id, version, scope, credit_line
- pattern: memory_id, agent, tags, summary, credit_line
- correction: memory_id, agent, tags, summary, credit_line
- tool_note: memory_id, tool, credit_line
- escalation_log: memory_id, agent, tags, summary, credit_line
- model_observation: memory_id, model, credit_line

### 8.2 Archival and Deprecation

When a shared learning becomes obsolete:

1. Add header: `[DEPRECATED as of YYYY-MM-DD — see [newer-doc] instead]`
2. Do NOT delete (historical record)
3. Move to `archived/` subdirectory (if system supports)
4. Update references to point to replacements

---

## 9. Examples

### Example 1: Pattern
**File:** `shared-learnings/DTP/patterns/batch-processing-large-datasets.md`

```yaml
---
type: pattern
memory_id: batch-processing-large-datasets
agent: DTP_ONXZA_Backend
created: 2026-03-15
tags: [performance, scaling, datasets]
summary: "How to process millions of records without memory exhaustion"
promotable: true
credit_line: present
---

## Pattern: Batch Processing Large Datasets

### The Problem
Processing millions of records in a single operation exhausts memory and times out.

### The Solution
Divide work into fixed-size batches, process sequentially, with progress checkpoints.

[... rest of pattern ...]
```

### Example 2: Tool Note
**File:** `shared-learnings/global/tool-notes/stripe-idempotency-keys.md`

```yaml
---
type: tool_note
memory_id: stripe-idempotency-nuance
agent: MGA_Backend_Payments
created: 2026-03-10
tags: [stripe, api, payments]
summary: "Stripe idempotency key behavior differs from documented"
tool: "stripe-python==v7.4"
credit_line: present
---

## Tool: Stripe — Idempotency Keys Nuance

### Context
During transaction retry logic testing...

[... rest of note ...]
```

---

## 10. Compliance Checklist

Before a shared learning is considered final:

- [ ] Type field is set correctly
- [ ] memory_id is unique and kebab-case
- [ ] Agent is specified
- [ ] Created date is present
- [ ] Tags are 3–5 meaningful terms
- [ ] Summary is one sentence
- [ ] Content is 200+ words (depending on type)
- [ ] Writing is clear and specific
- [ ] No proprietary/sensitive data (unless in correction/escalation_log with anonymization)
- [ ] Credit line is present
- [ ] Passes TORI-QMD validation
- [ ] Contribution ticket filed (if new)
- [ ] Company PM has reviewed (if company-level)
- [ ] Promotable flag is set appropriately

---

*This specification is part of FAAILS. Maintained by DTP_ONXZA_Docs.*  
*Specification version: 1.0 — 2026-03-18*

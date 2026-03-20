# FAAILS-006: Skill Lifecycle Standard

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

Skills are domain-specific knowledge documents that agents load into their working context. This specification defines what a skill is, how skills are created and versioned, the approval workflow, publication to skill marketplaces, and the retirement process.

---

## 1. What is a Skill?

A skill is a **knowledge document, not code**.

It is a structured markdown file containing:
- Instructions and procedures
- Reference material and specifications
- Best practices and patterns
- Decision trees and checklists
- Examples and case studies
- Tools, APIs, and service configurations
- Domain-specific vocabulary and context

A skill is loaded by an agent into its working context, like reading a handbook before starting a shift.

**Not a skill:**
- Source code or scripts (those are artifacts)
- Executable programs (those run, not get loaded as context)
- Configuration files (though a skill may explain them)
- Raw data (though a skill may teach analysis)

**Examples of skills:**
- "markdown-documentation-best-practices" — how to write clear markdown
- "python-async-patterns" — common async patterns in Python
- "customer-onboarding-flow" — step-by-step onboarding checklist
- "stripe-webhook-handling" — how to safely handle Stripe webhooks
- "linkedin-outreach-strategy" — professional outreach approach

---

## 2. Skill File Format and Structure

### 2.1 Filename and Location

```
shared-learnings/[scope]/skills/[skill-name].md
```

**Scope:**
- `agent-private/` — agent's private workspace
- `[Company]/` — company-level shared
- `global/` — cross-company standard

**Naming:**
- Lowercase + hyphens (kebab-case)
- Descriptive and unique within scope
- 30 chars max
- Example: `python-async-patterns.md`

### 2.2 Frontmatter

```yaml
---
type: skill
skill_id: [kebab-case-id]
name: [Human-readable name]
version: 1.0
agent: [creator-agent-id]
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
scope: [agent-private | company | global]
tags: [tag1, tag2, tag3]
summary: [one-sentence summary]
category: [optional: domain category]
compatible_with: [optional: tools/versions]
credit_line: present
---
```

### 2.3 Required Sections

Every skill must have:

```markdown
## Overview
What this skill teaches. 1-2 paragraphs.

## When to Use This Skill
What situations call for loading this skill.

## Key Concepts
Core ideas, vocabulary, or principles. Bulleted list.

## Main Content
[Detailed instructions, reference material, procedures]

### [Subsection 1]
### [Subsection 2]

## Common Pitfalls
What goes wrong. How to avoid it.

## Examples
1. [Concrete example with context]
2. [Another example]

## Quick Reference
[Checklist or cheat sheet]

## Further Reading
[Links to external resources if any]
```

### 2.4 Minimum Length

Skills must be **500+ words**. Shorter documents are fine but don't constitute a full skill — they may be categorized as patterns instead (see FAAILS-005).

---

## 3. Skill Categories

Skills can be organized by category for discovery:

| Category | Examples |
|---|---|
| Documentation | markdown, API docs, readme writing |
| Code | async patterns, testing strategies |
| Infrastructure | deployment, container management |
| Integration | API integration, webhook handling |
| Sales/Business | outreach, negotiation, proposal |
| Operations | monitoring, alerting, incident response |
| Security | authentication, secret management |
| Content | writing, editing, SEO |
| Design | UI principles, UX patterns |
| Domain-specific | your domain-specific practices |

---

## 4. Skill Lifecycle

### 4.1 Phase 1 — Identification

An agent or PM identifies a need:
- "We need a standard way to approach X"
- "Multiple agents are struggling with Y"
- "New tool Z requires training"

This triggers a `skill_approval_request` ticket:

```yaml
type: skill_approval_request
created_by: [PM or agent]
assigned_to: [Company AgentDeveloper]
summary: "New skill needed: [topic]"
```

### 4.2 Phase 2 — Authoring

The assigned agent authors the skill:

1. Create file: `shared-learnings/[Company]/skills/[skill-id].md`
2. Include all required frontmatter
3. Write all sections per spec
4. Minimum 500 words
5. Include concrete examples
6. Include common pitfalls section
7. Validate using TORI-QMD

### 4.3 Phase 3 — Review

Company PM or lead reviews:

**Criteria:**
- Accuracy: Is the information correct?
- Clarity: Can agents understand and apply it?
- Completeness: Are critical sections present?
- Examples: Are examples concrete and helpful?
- Scope: Is it company-level or should it be global?

**Decisions:**
- `APPROVED` — skill is live and searchable
- `REVISIONS_REQUIRED` — returned for changes
- `REJECT` — skill is not approved; archived
- `PROMOTE_TO_GLOBAL` — approved and recommend for global

### 4.4 Phase 4 — Publication

Approved skills are:
- Indexed in skill catalog
- Made searchable by tag and category
- Available for agents to load
- Listed in shared-learnings browser (Mission Control)

### 4.5 Phase 5 — Maintenance

Once published:
- Agents load the skill as needed
- Agent updates the skill when new knowledge accumulates
- Version increments on meaningful updates
- PM reviews major updates before incrementing version

### 4.6 Phase 6 — Promotion to Global (optional)

If a company-level skill is valuable across companies:

1. Company PM recommends for global
2. MG_Parent_AgentDeveloper reviews
3. If approved: copied to `shared-learnings/global/skills/`
4. Company version links to global: `See global version: [link]`
5. Global version becomes authoritative

### 4.7 Phase 7 — Marketplace Publication (optional)

If a skill is valuable to the broader ONXZA community:

1. AgentDeveloper prepares for publication
2. Removes any company-specific context
3. Submits to ONXZA skills marketplace
4. Marketplace hosts and indexes it
5. Community can download and use it
6. Downloads tracked in MPI

### 4.8 Phase 8 — Deprecation (if needed)

When a skill becomes outdated:

1. Add banner: `[DEPRECATED — See [new-skill] instead]`
2. Update version to `[last-version]-deprecated`
3. Move to `archived/` subdirectory
4. Keep file discoverable (for historical reference)
5. Do NOT delete

---

## 5. Skill Versioning

Skills use semantic versioning:

```
[MAJOR].[MINOR].[PATCH]
Example: 2.1.3
```

**PATCH (2.1.3 → 2.1.4):**
- Typo fixes
- Clarifications
- Small examples added
- No substantive change to content

**MINOR (2.1 → 2.2):**
- New section added
- New examples added
- Updated tool version
- Non-breaking content updates

**MAJOR (2 → 3):**
- Fundamentally different approach
- Breaking change (old procedure no longer valid)
- Completely rewritten section

**Version field example:**
```yaml
version: 2.1.3
last_updated: 2026-03-18
```

---

## 6. Skill Installation and Use

### 6.1 How Agents Use Skills

Agent sees a task requiring expertise:

1. Checks TOOLS.md in their workspace
2. Finds reference to relevant skill
3. Loads the skill markdown into context
4. Applies the skill to the task
5. Updates skill with new learnings (if applicable)

### 6.2 Skill Loading in TOOLS.md

Agent's TOOLS.md section:

```markdown
## Available Skills

### Documentation Skills
- `shared-learnings/global/skills/markdown-documentation-best-practices.md`
  — How to write clear, maintainable markdown documentation
  
### Domain Skills
- `shared-learnings/DTP/skills/stripe-webhook-handling.md` 
  — How to safely handle Stripe webhooks in payment systems
```

### 6.3 Explicit vs Implicit

**Explicit skill use:**
- Agent consciously loads the skill
- Agent cites the skill when applying it ("As described in [skill-name]...")
- Agent updates the skill with new learnings

**Implicit skill use:**
- Agent is trained on skill during onboarding
- Skill becomes part of agent's baseline knowledge
- Agent applies it without explicit reference

Both are valid. Explicit is better for traceability.

---

## 7. Special Skill Types

### 7.1 Tool Configuration Skill

Teaches how to use a specific tool (e.g., Stripe API, Airtable, Slack):

```markdown
## Stripe Webhook Handling

### Integration Points
- Webhook endpoint setup
- Event type subscriptions
- Signature verification
- Idempotency handling
- Retry logic
```

### 7.2 Domain Process Skill

Teaches a business process (e.g., customer onboarding, sales workflow):

```markdown
## Customer Onboarding Flow

### Pre-Onboarding
[Steps]

### Onboarding Phase 1
[Steps]

### Post-Onboarding
[Steps]
```

### 7.3 Technical Pattern Skill

Teaches coding or architecture patterns:

```markdown
## Python Async Patterns

### When to Use Async
### Common Patterns
- Pattern 1: [explanation]
- Pattern 2: [explanation]
```

---

## 8. TORI-QMD Validation for Skills

All skills must pass TORI-QMD before approval:

```bash
python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py shared-learnings/[Company]/skills/[skill-id].md
```

**Required fields:**
- type: "skill"
- skill_id (kebab-case)
- name (human-readable)
- version
- agent
- created
- scope
- summary
- credit_line

**Content requirements:**
- Minimum 500 words
- All major sections present (Overview, When to Use, Key Concepts, Main Content, Common Pitfalls, Examples, Quick Reference)
- No sensitive/proprietary data (unless anonymized)

---

## 9. Skill Search and Discovery

FAAILS systems must support skill discovery:

**By:**
- Skill name (exact match and fuzzy)
- Category
- Tag
- Agent
- Scope (agent-private, company, global)
- Date range
- Keyword (full-text search in content)

**Output:**
- Skill title and summary
- Creator agent and date
- Tags and category
- Link to full document
- Version

---

## 10. Skill Contribution and Updates

### 10.1 Contributing Updates

If an agent has an improvement to a skill:

1. Agent updates the skill file locally
2. Agent increments version appropriately
3. Agent submits `skill_update_request` ticket with changes
4. PM reviews and approves
5. On approval: version is incremented in canonical file
6. Agent is credited

### 10.2 Merging Agent Updates

Company PM or designated reviewer:
1. Reviews proposed changes
2. Checks for accuracy
3. Merges accepted changes
4. Increments version
5. Updates last_updated date
6. Closes ticket

---

## 11. Examples

### Example: Python Async Patterns Skill

**File:** `shared-learnings/global/skills/python-async-patterns.md`

```yaml
---
type: skill
skill_id: python-async-patterns
name: Python Async Patterns
version: 1.2
agent: DTP_ONXZA_Backend
created: 2026-01-15
last_updated: 2026-03-18
scope: global
tags: [python, async, concurrency, patterns]
summary: "Common patterns for writing async code in Python"
category: Code
compatible_with: "Python 3.7+"
credit_line: present
---

## Overview

This skill teaches common patterns for writing asynchronous code in Python using asyncio. Async programming allows a single thread to handle multiple I/O operations concurrently, improving throughput without creating additional threads.

## When to Use This Skill

Load this skill when:
- Writing code that makes network requests
- Integrating with async APIs or message queues
- Building high-concurrency servers
- Optimizing I/O-bound applications

## Key Concepts

- **Coroutine:** An async function. Defined with `async def`.
- **Await:** Pauses execution until an async operation completes.
- **Event loop:** The runtime that executes coroutines.
- **Task:** A wrapper around a coroutine scheduled for execution.
- **Future:** A placeholder for a value that will be available later.

## Common Patterns

### Pattern 1: Gathering Multiple Async Calls

```python
results = await asyncio.gather(
    fetch_url("http://api1.com"),
    fetch_url("http://api2.com"),
    fetch_url("http://api3.com")
)
```

### Pattern 2: Timeout Protection

```python
try:
    result = await asyncio.wait_for(
        slow_operation(),
        timeout=5.0
    )
except asyncio.TimeoutError:
    # Handle timeout
```

## Common Pitfalls

1. **Forgetting await:** `result = fetch_url(url)` gets a coroutine, not the value
2. **Blocking the event loop:** `time.sleep()` blocks; use `await asyncio.sleep()`
3. **Not handling exceptions:** Exceptions in tasks are swallowed silently

## Examples

[Concrete, runnable examples...]

## Quick Reference

Checklist for async code:
- [ ] All I/O operations are async
- [ ] No blocking calls (time.sleep, requests)
- [ ] Exceptions are handled
- [ ] Timeouts are set
- [ ] Tasks are gathered or awaited

## Further Reading

- [asyncio documentation](https://docs.python.org/3/library/asyncio.html)
- [Real Python async guide](https://realpython.com/async-io-python/)
```

---

## 12. Compliance Checklist

Before a skill is published:

- [ ] File is named kebab-case.md
- [ ] Located in appropriate scope directory
- [ ] Frontmatter is complete and correct
- [ ] Type field is "skill"
- [ ] All required sections present
- [ ] Minimum 500 words
- [ ] Examples are concrete and runnable (when applicable)
- [ ] Common pitfalls section is included
- [ ] Writing is clear and accessible
- [ ] No proprietary data (unless anonymized)
- [ ] Passes TORI-QMD validation
- [ ] Approval ticket created and reviewed
- [ ] Credit line is present
- [ ] Indexed in skill catalog

---

*This specification is part of FAAILS. Maintained by DTP_ONXZA_Docs.*  
*Specification version: 1.0 — 2026-03-18*

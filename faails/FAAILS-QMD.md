---
title: FAAILS-QMD — Validator Specification
version: 1.0
owner: DTP_ONXZA_Docs
created: 2026-03-19
status: published
credit_line: present
---

# FAAILS-QMD: Validator Specification

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## What is TORI-QMD?

**TORI-QMD** stands for: **Top-level Organizational Requirements Indicator — Quality Markdown Descriptor**

TORI-QMD is the mandatory validation protocol for all markdown files produced by agents in a FAAILS system. It ensures structural consistency, completeness, and compliance with organizational standards before any file is committed or published.

**TORI-QMD is NOT:**
- A markdown linter or style checker
- A spelling or grammar validator
- A content fact-checker
- An optional quality check

**TORI-QMD IS:**
- A structural validator that checks required metadata and fields
- A mandatory quality gate — no file passes without TORI-QMD validation
- Enforced by pre-commit hooks and CI/CD pipelines
- The single source of truth for what files are "ready"

---

## Core Principle

Every markdown file produced by or for an agent must contain specific required fields depending on its type. If a required field is missing, the file fails validation and cannot be committed.

**Validation is deterministic.** The same file always produces the same result when checked against TORI-QMD rules.

---

## File Types and Required Fields

TORI-QMD defines validation rules for 8 file types used in FAAILS systems:

### 1. AGENT FILES (6 required per agent)

These are the core files in an agent's workspace. All 6 must pass TORI-QMD before the agent is live.

#### AGENTS.md

**Required fields:**
- `Identity` section (describes the agent, company, role)
- `Responsibilities` section (what the agent does and does NOT do)
- `Scope Boundaries` section (out-of-scope work)
- `Ticket Types Received` section (incoming work types)
- `credit_line: present` in frontmatter or prominently in file
- Minimum 200 words

**Validation check:**
```
✓ Has "## Identity"?
✓ Has "## Responsibilities"?
✓ Has "## Scope Boundaries"?
✓ Has "## Ticket Types"?
✓ Contains "credit_line"?
✓ Word count ≥ 200?
```

**Fails if:** Any required section missing or credit line absent.

#### SOUL.md

**Required fields:**
- `Values` or `Principles` section
- `Working Style` section (or equivalent: how agent approaches work)
- Minimum 150 words
- `credit_line: present`

**Validation check:**
```
✓ Has "Values" or "Principles"?
✓ Has "Working Style" or equivalent?
✓ Contains "credit_line"?
✓ Word count ≥ 150?
```

#### IDENTITY.md

**Required fields (YAML format):**
```yaml
Full Name: [Company_Dept_Role]
Company: [Company name]
Department: [Department]
Role: [Role description]
Model: [default model used]
Reports To: [supervisor agent ID]
Workspace: workspace-[lowercase-slug]
Persistence: [PERSISTENT DAEMON | TEMPORARY SUB-AGENT]
Created: [YYYY-MM-DD]
Status: [ACTIVE | TRAINING | ARCHIVED]
credit_line: present
```

**Validation check:**
```
✓ Has all 10 YAML fields?
✓ All fields non-empty?
✓ credit_line present?
```

#### MEMORY.md

**Required fields:**
- `Session Start Checklist` section (or "Session Start")
- `Context` section or `Current Projects` section
- `Current Priorities` section
- Minimum 100 words
- `credit_line: present`

**Validation check:**
```
✓ Has session start guidance?
✓ Has context/projects section?
✓ Has priorities section?
✓ Contains "credit_line"?
✓ Word count ≥ 100?
```

#### TOOLS.md

**Required fields:**
- `Available Tools` section (tools and CLI the agent uses)
- Minimum 100 words
- `credit_line: present`

**Validation check:**
```
✓ Has "Available Tools" section?
✓ Word count ≥ 100?
✓ Contains "credit_line"?
```

#### HEARTBEAT.md

**Required fields:**
- Either: Scheduled task definitions with cron, description, frequency
- Or: Statement "No scheduled tasks" or "Agent operates on task assignment only"
- `credit_line: present`

**Validation check:**
```
✓ Has task schedule OR has "No scheduled tasks" statement?
✓ Contains "credit_line"?
```

---

### 2. SPECIFICATION FILES (FAAILS-NNN, CDP, etc.)

All FAAILS protocol specification files.

**Required fields (frontmatter):**
```yaml
title: [Specification title]
version: [X.Y or X.Y.Z]
owner: [Agent ID]
created: [YYYY-MM-DD]
status: [draft | published | deprecated]
credit_line: present
```

**Required content:**
- At least one major section (## heading)
- Minimum 500 words
- Closing credit line (same as opening)

**Validation check:**
```
✓ Has all frontmatter fields?
✓ Has at least one ## section?
✓ Word count ≥ 500?
✓ Opens with credit_line?
✓ Closes with credit_line?
```

---

### 3. GOVERNANCE FILES (DOC-NNN)

Internal governance and operational documents.

**Required fields (frontmatter):**
```yaml
title: [Document title]
version: [X.Y.Z]
owner: [Agent ID]
created: [YYYY-MM-DD]
status: [ACTIVE | DEPRECATED | ARCHIVED]
credit_line: present
```

**Required content:**
- `## Purpose` section
- Minimum 300 words
- Credit line present

**Validation check:**
```
✓ Has title, version, owner, created?
✓ Has ## Purpose section?
✓ Word count ≥ 300?
✓ Contains credit_line?
```

---

### 4. SHARED LEARNING FILES

Patterns, corrections, tool notes, escalation logs stored in `shared-learnings/`.

**Required fields (frontmatter):**
```yaml
type: [pattern | correction | tool_note | escalation_log | model_observation | skill]
memory_id: [kebab-case-slug]
agent: [Agent ID]
created: [YYYY-MM-DD]
tags: [tag1, tag2, tag3]
summary: [one-sentence summary]
credit_line: present
```

**Required content:**
- Minimum 200 words
- At least one major section

**Validation check:**
```
✓ Has type, memory_id, agent, created, tags, summary?
✓ Word count ≥ 200?
✓ Tags count ≥ 3?
✓ Contains credit_line?
```

---

### 5. VISION FILES

Project vision documents.

**Required fields (frontmatter):**
```yaml
title: [Project Name] Vision
version: [X.Y or approval status]
owner: [Agent ID]
created: [YYYY-MM-DD]
status: [CDP-REVIEW | APPROVED — IMMUTABLE]
credit_line: present
```

**Required sections:**
- `## Original Vision Statement` (verbatim from human)
- `## Interpreted Intent`
- `## Targets` (30/90/180 day targets)
- `## Non-Negotiables`
- `## Scope`
- Minimum 500 words total
- Credit line present

**Validation check:**
```
✓ Has all frontmatter?
✓ Has Original Vision Statement?
✓ Has Interpreted Intent?
✓ Has Targets?
✓ Has Non-Negotiables?
✓ Has Scope?
✓ Word count ≥ 500?
✓ Contains credit_line?
```

---

### 6. TICKET FILES

Work assignment files in `tickets/` directory.

**Required fields (YAML frontmatter):**
```yaml
id: [TICKET-YYYYMMDD-NNN]
type: [task | approval_request | escalation | security_flag | etc]
created_by: [Agent ID]
created_at: [ISO 8601 timestamp]
assigned_to: [Agent ID]
project: [project-slug]
company: [company-code]
priority: [low | medium | high | critical]
status: [open | in-progress | pending-approval | blocked | closed]
```

**Required sections:**
- `## Summary` (one sentence)
- `## Requested Action` or `## What Is Stuck`
- `## Acceptance Criteria` (bulleted list)

**Validation check:**
```
✓ Has all 10 YAML fields?
✓ Has ## Summary?
✓ Has action description?
✓ Has acceptance criteria?
```

---

### 7. PLAN FILES (Three-Phase Tasks)

Execution plans created in PHASE 1 of three-phase task protocol.

**Required fields (frontmatter):**
```yaml
ticket_id: [TICKET-id]
agent: [Agent ID]
phase: 1-complete
```

**Required sections:**
- `# Goal` (one sentence)
- `# Steps` (numbered list of exact actions)
- `# Expected Output`
- `# Verification Method`

**Validation check:**
```
✓ Has ticket_id, agent, phase?
✓ Has # Goal?
✓ Has # Steps?
✓ Has # Expected Output?
✓ Has # Verification Method?
```

---

### 8. RESULTS FILES (Three-Phase Tasks)

Execution results created in PHASE 2.

**Required fields (frontmatter):**
```yaml
ticket_id: [TICKET-id]
agent: [Agent ID]
phase: 2-complete
steps_completed: [N/N]
```

**Required sections:**
- `# Results` (what happened, step by step)
- `# Output Location` (where files/changes are)
- `# Verification Data` (raw data for Phase 3)

**Validation check:**
```
✓ Has ticket_id, agent, phase, steps_completed?
✓ Has # Results section?
✓ Has # Output Location?
✓ Has # Verification Data?
```

---

## How to Run TORI-QMD Validation

### Command Line

```bash
# Validate a single file
python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py /path/to/file.md

# Expected output on PASS:
# PASS: /path/to/file.md

# Expected output on FAIL:
# FAIL: /path/to/file.md — missing: [field1], [field2]
```

### Exit Codes

- `0` = PASS (file validated successfully)
- `2` = FAIL (file validation failed — missing fields or invalid format)

### Pre-Commit Hook Integration

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Run TORI-QMD on all .md files being committed
for file in $(git diff --cached --name-only | grep '\.md$'); do
    if [ -f "$file" ]; then
        python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py "$file"
        if [ $? -ne 0 ]; then
            echo "Commit blocked: $file failed TORI-QMD validation"
            exit 1
        fi
    fi
done
exit 0
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

Once installed, every `git commit` will reject any `.md` files that fail TORI-QMD validation.

---

## Pass vs Fail Criteria

### A File PASSES TORI-QMD If:

✅ All required fields for its file type are present  
✅ All required sections exist  
✅ Minimum word count is met (where applicable)  
✅ Frontmatter is valid YAML (where applicable)  
✅ Credit line is present (where applicable)  
✅ No syntax errors in frontmatter

### A File FAILS TORI-QMD If:

❌ Any required field is missing  
❌ Any required section is missing  
❌ Word count is below minimum  
❌ Frontmatter is invalid YAML  
❌ Credit line is absent  
❌ Syntax errors in frontmatter

**When a file fails TORI-QMD:**
1. The file cannot be committed
2. The pre-commit hook blocks the commit with an error message
3. Agent must fix the file and re-run validation
4. No file enters the system without passing TORI-QMD

---

## Integration Points

### Agent Onboarding

Before an agent is live:
```bash
python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py \
  workspace-[agent-id]/AGENTS.md \
  workspace-[agent-id]/SOUL.md \
  workspace-[agent-id]/IDENTITY.md \
  workspace-[agent-id]/MEMORY.md \
  workspace-[agent-id]/TOOLS.md \
  workspace-[agent-id]/HEARTBEAT.md
```

All 6 must PASS before agent is registered.

### Pre-Commit Automation

Git pre-commit hook enforces TORI-QMD on all commits:
- Developers cannot commit non-compliant markdown
- CI/CD pipeline will reject PRs with validation failures
- Ensures no non-compliant docs reach main branch

### Publishing Pipeline

Before publishing to docs site or GitHub:
```bash
# Validate all markdown files
find docs/ -name "*.md" -type f | xargs \
  python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py
```

All files must pass before publication.

---

## Expanding the Acronym

**TORI-QMD:**
- **T**op-level — Foundation of system compliance
- **O**rganizational — Enforced by the organization
- **R**equirements — Non-optional standards
- **I**ndicator — Shows what passes/fails
- **Q**uality — Ensures minimum quality standards
- **M**arkdown — Works on markdown files
- **D**escriptor — Describes required structure

---

## Design Philosophy

TORI-QMD is minimalist. It only checks:
- Required fields are present
- Minimum content standards are met
- Metadata is valid

TORI-QMD does NOT check:
- Spelling or grammar
- Writing quality
- Factual accuracy
- Style consistency

This separation allows:
- Fast automated validation (seconds)
- Human reviewers to focus on content, not structure
- Clear pass/fail definition (no subjectivity)

---

## Compliance Checklist

For agents creating markdown files:

- [ ] File type identified (agent file / spec / governance / shared learning / etc)
- [ ] All required fields included
- [ ] Frontmatter is valid YAML
- [ ] Minimum word count met
- [ ] Credit line present (if applicable)
- [ ] Run TORI-QMD validation: `python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py [file]`
- [ ] Validation result: PASS ✅
- [ ] File ready to commit

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

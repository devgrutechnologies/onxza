---
title: ONXZA Skills Marketplace — Reference Skill Pack Specifications v1
version: 1.0.0
owner: dtp-onxza-pm
created: 2026-03-22
status: DRAFT
tags: marketplace, skills, specs, community, contribution
summary: First 5 reference skill pack specifications for the ONXZA Skills Marketplace. These serve as community contribution examples, marketplace seed inventory, and the template for all future skills.
credit_line: present
---

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

# ONXZA Skills Marketplace — Reference Skill Pack Specifications v1

These 5 skill packs define what community contributions look like. Each spec is complete enough to implement.

---

## Skill 1: Web Research

**Tier:** Free  
**Category:** Research  
**FAAILS component:** FAAILS-005 (Shared Learnings Architecture) + FAAILS-007 (Automation Tier Framework)  
**Compatible agents:** Any agent with researcher or analyst role

### What it does
Enables an agent to search the web, extract structured data from results, and write findings to the agent's shared learnings directory. Handles URL fetching, content extraction, deduplication, and citation formatting automatically.

### Inputs
- `query`: string — Search query or research question
- `depth`: number (1–5, default 3) — Number of sources to retrieve and synthesize
- `output_format`: enum (summary | bullets | structured) — Output shape
- `save_to_learnings`: boolean (default true) — Whether to write to shared-learnings/

### Outputs
- `summary`: string — Synthesized research summary
- `sources`: array — List of URLs with titles and relevance scores
- `learning_file`: string | null — Path to saved learning file (if save_to_learnings)
- `confidence`: number (0–100) — FVP confidence score

### Example Use Case
A `DTP_Research_Analyst` agent is assigned a ticket: "Research top 5 enterprise multi-agent frameworks." The skill searches for "enterprise multi-agent AI frameworks 2026", retrieves 3 sources, synthesizes a structured summary, saves it to `shared-learnings/DTP/research/multi-agent-frameworks-2026.md`, and returns confidence 82. The ticket is closed.

### Implementation Sketch
- **Tool calls required:** `web_search`, `web_fetch`, file write
- **AGENTS.md addition:** Add `web-research` to `available_skills`
- **Key files:**
  - `skills/web-research/SKILL.md` — execution instructions
  - `skills/web-research/scripts/extract.js` — content extraction
  - `skills/web-research/templates/learning-template.md` — output format
- **Automation tier:** Tier 1 (safe to automate fully)

---

## Skill 2: PR Review

**Tier:** Free  
**Category:** Engineering  
**FAAILS component:** FAAILS-009 (Escalation & Approval Protocol) + FAAILS-010 (Knowledge Base Governance)  
**Compatible agents:** Any agent with engineer, architect, or reviewer role

### What it does
Reviews a GitHub pull request against FAAILS compliance and code quality standards. Posts a structured review comment with: summary, FAAILS violations (if any), code quality notes, approval recommendation, and confidence score. Does not merge — only comments.

### Inputs
- `pr_url`: string — Full GitHub PR URL
- `review_level`: enum (quick | standard | deep) — Depth of analysis
- `faails_check`: boolean (default true) — Whether to validate FAAILS compliance in changed files
- `post_comment`: boolean (default false) — Whether to post review to GitHub (requires gh auth)

### Outputs
- `review_summary`: string — One-paragraph summary
- `faails_violations`: array — List of FAAILS spec violations found (empty if clean)
- `code_notes`: array — Inline code quality observations
- `recommendation`: enum (approve | request_changes | needs_discussion)
- `confidence`: number (0–100)

### Example Use Case
A `DTP_ONXZA_Architect` agent receives a PR review ticket. The skill fetches the PR diff, checks all changed `.md` files against TORI-QMD, validates `AGENTS.md` changes against FAAILS-001, and returns recommendation: `request_changes` with 2 FAAILS violations noted. Agent posts the review comment.

### Implementation Sketch
- **Tool calls required:** `gh pr view`, `gh pr diff`, `onxza validate`
- **AGENTS.md addition:** Add `pr-review` to `available_skills`
- **Key files:**
  - `skills/pr-review/SKILL.md`
  - `skills/pr-review/templates/review-template.md`
- **Automation tier:** Tier 2 (post comment requires human authorization flag)

---

## Skill 3: Competitive Intelligence

**Tier:** Pro ($49/mo)  
**Category:** Research + Operations  
**FAAILS component:** FAAILS-005 (Shared Learnings), FAAILS-007 (Automation Tiers)  
**Compatible agents:** Research, strategy, or PM agents

### What it does
Monitors a defined list of competitor URLs and GitHub repos on a schedule. Generates weekly diff reports: new features announced, pricing changes, GitHub star velocity, job postings (signals growth). Saves diffs to shared learnings and flags significant changes for PM escalation.

### Inputs
- `competitors`: array — List of {name, url, github_repo?} objects
- `monitor_types`: array — What to track: ["website", "github", "jobs", "pricing"]
- `diff_threshold`: string (minor | major | any) — What triggers an escalation flag
- `report_to`: string — Agent ID to receive escalation ticket if major change detected

### Outputs
- `weekly_report`: string — Formatted markdown report
- `changes_detected`: array — List of {competitor, change_type, severity, summary}
- `escalation_triggered`: boolean — Whether a major change warranted a PM ticket
- `report_path`: string — Path to saved report in shared-learnings/

### Example Use Case
Every Monday 9 AM UTC, the skill scrapes 5 competitor sites. This week: AutoGen released v0.4, LangGraph added a new routing primitive. The skill generates a diff report, saves it to `shared-learnings/DTP/competitive/weekly-2026-03-22.md`, and creates an escalation ticket to the PM because a major release was detected.

### Implementation Sketch
- **Tool calls required:** `web_fetch`, `gh api` (for GitHub star counts), cron scheduling
- **AGENTS.md addition:** Add `competitive-intelligence` to `available_skills`, add cron schedule
- **Key files:**
  - `skills/competitive-intelligence/SKILL.md`
  - `skills/competitive-intelligence/scripts/diff-engine.js`
  - `skills/competitive-intelligence/templates/weekly-report.md`
- **Automation tier:** Tier 1 for monitoring, Tier 2 if escalation is triggered

---

## Skill 4: Meeting Notes

**Tier:** Pro ($49/mo)  
**Category:** Operations  
**FAAILS component:** FAAILS-002 (Inter-Agent Communication), FAAILS-010 (Knowledge Base)  
**Compatible agents:** Any agent with operations, PM, or admin role

### What it does
Takes a meeting transcript (text or file) and produces: structured action items, owner assignments, decisions made, open questions, and a formatted summary. Action items are automatically converted into ONXZA tickets assigned to the appropriate agents. Decisions are saved to the knowledge base.

### Inputs
- `transcript`: string | file_path — Raw meeting transcript
- `participants`: array — List of {name, agent_id?} — used to auto-assign tickets
- `meeting_type`: enum (standup | sprint_review | planning | 1on1 | customer)
- `create_tickets`: boolean (default true) — Whether to auto-create action item tickets
- `company`: string — Company context for ticket assignment

### Outputs
- `summary`: string — One-paragraph meeting summary
- `action_items`: array — List of {owner_agent, action, due_date?, priority}
- `decisions`: array — List of {decision, rationale, made_by}
- `open_questions`: array — Unresolved items requiring follow-up
- `tickets_created`: array — Ticket IDs if create_tickets is true

### Example Use Case
Aaron pastes a sprint review transcript into the ticket system. The skill parses 8 action items, maps 6 to existing agents by name-matching participant list, creates 6 tickets, flags 2 items as needing Aaron assignment, and writes the decision log to `shared-learnings/DTP/decisions/2026-03-22-sprint-review.md`.

### Implementation Sketch
- **Tool calls required:** `onxza tickets create`, file write, LLM parsing
- **AGENTS.md addition:** Add `meeting-notes` to `available_skills`
- **Key files:**
  - `skills/meeting-notes/SKILL.md`
  - `skills/meeting-notes/scripts/parse-transcript.js`
  - `skills/meeting-notes/templates/action-item.md`
- **Automation tier:** Tier 2 (ticket creation for human review before send)

---

## Skill 5: Daily Status Report

**Tier:** Pro ($49/mo)  
**Category:** Operations  
**FAAILS component:** FAAILS-002 (Inter-Agent Communication), FAAILS-005 (Shared Learnings)  
**Compatible agents:** PM, COO, or CEO agents

### What it does
Reads all open tickets across the company, agent MEMORY.md files (where accessible), and recent shared learnings. Generates an executive daily status report: what's in progress, what's blocked, what completed yesterday, critical path items, and flags requiring human attention. Optionally delivers to email or messaging channel.

### Inputs
- `company`: string — Company to report on
- `include_agents`: array | "all" — Which agents to include
- `report_depth`: enum (brief | standard | full) — Level of detail
- `delivery`: object — Optional: {channel: "email" | "slack" | "imsg", to: string}
- `highlight_blockers`: boolean (default true) — Prominently flag blocked tickets

### Outputs
- `report_markdown`: string — Full formatted status report
- `critical_count`: number — Items requiring immediate human attention
- `blocked_count`: number — Tickets currently blocked
- `completed_yesterday`: array — Tickets closed in last 24h
- `report_path`: string — Path to saved report

### Example Use Case
Every morning at 8 AM, `DTP_ONXZA_PM` runs the daily status skill. It reads 47 open tickets, 12 agent MEMORY.md files, identifies 3 blocked items, 2 requiring Aaron input, 5 completed yesterday. Generates a 600-word executive summary, saves to `workspace/logs/daily-status-2026-03-22.md`, and sends to Aaron via email.

### Implementation Sketch
- **Tool calls required:** `onxza tickets`, file reads (MEMORY.md), email/messaging tool
- **AGENTS.md addition:** Add `daily-status-report` to `available_skills`, add morning cron
- **Key files:**
  - `skills/daily-status-report/SKILL.md`
  - `skills/daily-status-report/scripts/aggregate-status.js`
  - `skills/daily-status-report/templates/status-report.md`
- **Automation tier:** Tier 1 for generation, Tier 2 if sending externally

---

## Community Contribution Guidelines

These 5 specs are the template for community contributions. To submit a skill to the ONXZA Skills Marketplace:

1. Fork the ONXZA repo
2. Create `skills/[skill-name]/` directory
3. Write `SKILL.md` following the spec format above
4. Include at minimum: `what it does`, `inputs`, `outputs`, `implementation sketch`
5. Open a PR with title: `[Skill] [Name] — [Category] — [Tier]`
6. Marketplace team reviews within 7 days

Free-tier skills receive a faster review. Pro-tier skills require revenue-sharing agreement before listing.

---

*Prepared by DTP_ONXZA_PM — 2026-03-22. For marketplace timeline, see ROADMAP.md M2 Sprint 7.*

# FAAILS-008: Agent Creation Standard

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

Agent creation is a formal, multi-phase process. This specification defines the five phases, required approvals, the design document template, workspace structure, and test task requirements that ensure every new agent is qualified and integrated correctly.

---

## 1. The Five-Phase Process

Every new agent follows this sequence. No shortcuts.

```
Phase 1: Research        (Who and what is needed?)
        │
        ▼
Phase 2: Design          (Document the plan)
        │
        ▼
Phase 3: Approval        (Is the plan sound? Do we need new tools?)
        │
        ▼
Phase 4: Build           (Create workspace, validate, register)
        │
        ▼
Phase 5: Validation      (Test task, quality check, readiness)
```

---

## 2. Phase 1: Research

**Owner:** AgentDeveloper + requesting PM  
**Duration:** 1–2 days  
**Output:** Research document

### 2.1 Questions to Answer

- **Why is this agent needed?** What work is currently blocked or inefficient without it?
- **What is the scope?** What is in the agent's domain? What is explicitly NOT in scope?
- **What model tier?** Haiku, Sonnet, Opus? Local LLM? What justifies the choice?
- **What persistence class?** PERSISTENT DAEMON or TEMPORARY SUB-AGENT?
- **What skills does it need?** What shared learnings must it load?
- **What are its failure modes?** What happens if this agent fails?
- **Who does it report to?** What PM or CEO supervises it?
- **What's the urgency?** Critical path blocker or nice-to-have?

### 2.2 Research Deliverable

A document answering all questions above, 500+ words. Created as a ticket attachment or shared learning.

### 2.3 Approval Gate

Agent requestor reviews research. Confirms scope is correct. Approves or requests changes.

---

## 3. Phase 2: Design

**Owner:** AgentDeveloper  
**Duration:** 1–2 days  
**Output:** Agent Design Document

### 3.1 Design Document Template

Create a document titled: `[Company]_[Dept]_[Role] - Design Document`

```markdown
# [Company_Dept_Role] Design Document

## Executive Summary
1–2 paragraphs. What is this agent? Why is it needed?

## Agent Identity
- Full name: [Company_Dept_Role]
- Role: [description]
- Model: [default model]
- Reports to: [supervisor agent-id]
- Persistence: [PERSISTENT DAEMON | TEMPORARY SUB-AGENT]
- Created: [date]

## Scope and Responsibilities

### In Scope
- [Responsibility 1]
- [Responsibility 2]

### Explicitly NOT in Scope
- [What this agent does NOT do]
- [Where it hands off]

### Ticket Types Received
- [task type 1] → [handler]
- [task type 2] → [handler]

### Ticket Types Created
- [ticket type 1]
- [ticket type 2]

## Relationships

### Reports To
[Supervisor agent-id] — [relationship description]

### Collaborates With
- [Agent ID] — [how they collaborate]

### Downstream Dependencies
- [Agent ID] — [what it depends on]

## Workflow and Decision Tree

How this agent decides what to do:

1. [Input trigger]
2. [Decision point 1] → paths A, B, C
3. [For path A: execution]
4. [Output / escalation]

## Failure Modes and Escalation

What can go wrong? Where does it escalate?

| Failure Mode | Consequence | Escalation To | Recovery |
|---|---|---|---|
| [Mode 1] | [Impact] | [Agent/PM] | [How to recover] |

## Required Skills and Knowledge

List all shared learnings this agent must load:

- `shared-learnings/global/skills/[skill-name].md`
- `shared-learnings/[Company]/patterns/[pattern-name].md`

## Model and Tier Justification

Why this model? Why this tier?

- Primary work: [description]
- Reasoning complexity: [low/medium/high]
- Cost sensitivity: [low/medium/high]
- Alternative considered: [other model] — rejected because [reason]

## Workspace Files Outline

Preview of what will be in each workspace file:

### AGENTS.md
- [Key responsibility 1]
- [Key responsibility 2]
- [Ticket types to be handled]

### SOUL.md
- [Core value]
- [Decision approach]

### TOOLS.md
- [CLI tool 1]
- [External service 1]

### MEMORY.md
- [Key knowledge for this domain]

## Integration Points

What systems will this agent integrate with?

- [System 1] — [type of integration]
- [API] — [read/write/execute]
- [Database] — [tables accessed]

## Success Metrics

How will we know this agent is working?

- [ ] Metric 1
- [ ] Metric 2

## Risks and Mitigation

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| [Risk] | [P] | [I] | [Plan] |

## Approval Gates

- [ ] Phase 2 design review (PM approval)
- [ ] Phase 3 tool approval (if new integrations needed)
- [ ] Phase 4 build approval (AgentDeveloper readiness)
- [ ] Phase 5 validation (test task passed)
```

### 3.2 Design Review

PM and AgentDeveloper review:
- Is the scope clear and reasonable?
- Are responsibilities well-defined?
- Does the agent fit into the organization?
- Are failure modes identified?
- Is the model choice justified?

**Decision:**
- `APPROVED` — proceed to Phase 3
- `REVISIONS` — return for changes
- `BLOCKED` — cannot proceed (dependencies missing, scope unclear)

---

## 4. Phase 3: Approval

**Owner:** AgentDeveloper + tool stewards  
**Duration:** 1 day  
**Output:** Approval ticket

### 4.1 Tool Approval (if new integrations)

If the agent needs new integrations or paid services:

- AgentDeveloper creates an approval_request ticket
- Lists all new tools/APIs needed
- Estimates costs
- Marcus (or PM) approves or denies
- On approval: credentials provisioned, limits set

### 4.2 Design Approval

Designed is reviewed by:
- Requesting PM (scope is right)
- Supervising agent (can this agent be managed correctly)
- AgentDeveloper (can this be built)

All three approve before proceeding.

---

## 5. Phase 4: Build

**Owner:** AgentDeveloper  
**Duration:** 2–3 days  
**Output:** Live workspace, registered in openclaw.json

### 5.1 Workspace Scaffolding

Create directory:
```
~/.openclaw/workspace-[company-dept-role-lowercase]/
```

Copy global standard template:
```
└── AGENTS.md
└── SOUL.md
└── IDENTITY.md
└── MEMORY.md
└── TOOLS.md
└── HEARTBEAT.md
```

### 5.2 File Customization

For each file, fill in agent-specific content based on design document:

**AGENTS.md:**
- Copy identity section from design
- List responsibilities in-scope and out-of-scope
- List ticket types
- Include OUT OF LANE PROTOCOL

**SOUL.md:**
- Describe working philosophy
- Values specific to this agent's domain
- Communication style

**IDENTITY.md:**
- All fields filled from design document
- Model, reports-to, persistence class
- Shared learnings paths

**MEMORY.md:**
- Session start checklist (what to read first)
- Key learnings in domain
- Current projects (initially empty)
- Current priorities

**TOOLS.md:**
- All tools and APIs for this agent
- Credentials? Pending? Provisioned?
- Rate limits if applicable

**HEARTBEAT.md:**
- If agent has cron tasks: schedule + description
- If not: "No scheduled tasks" statement

### 5.3 Validation

Run TORI-QMD on all 6 files:

```bash
python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py workspace-[agent-id]/
```

All files must PASS. If any file fails:
- Return to customization
- Fix validation errors
- Re-run validator

### 5.4 Registration

Update `~/.openclaw/openclaw.json`:

```json
{
  "agents": [
    {
      "id": "Company_Dept_Role",
      "workspace": "workspace-company-dept-role-lowercase",
      "persistence": "PERSISTENT_DAEMON",
      "status": "TRAINING",
      "created": "2026-03-18",
      "model": "claude-haiku-4-5",
      "supervisor": "SupervisorAgentId"
    }
  ]
}
```

### 5.5 Checkpoint

Create a checkpoint before the agent is live:

```bash
python3 ~/.openclaw/workspace/scripts/create-checkpoint.py [Company]_[Dept]_[Role]-creation
```

---

## 6. Phase 5: Validation

**Owner:** PM + designated reviewer  
**Duration:** 3–7 days  
**Output:** Readiness ticket

### 6.1 Test Task

Give the agent a single, well-defined test task:

**Test task requirements:**
- Real work (not a mock task)
- Medium complexity (not trivial, not impossible)
- Clear success criteria
- No dependencies on other agents
- Time-bound (should complete within 2–4 hours)

**Example test task:**
```
Task: Write documentation for [feature X]
Success criteria:
- [ ] Documentation page written and formatted
- [ ] Examples included
- [ ] Passes TORI-QMD validation
- [ ] No critical errors flagged by reviewer
Time: 3 hours
```

### 6.2 Execution and Feedback

1. Agent executes test task
2. Reviewer evaluates output against success criteria
3. Agent iterates if needed
4. Reviewer provides feedback on:
   - Output quality
   - Communication style
   - Alignment with scope
   - Any issues encountered

### 6.3 Quality Checklist

Reviewer assesses:

- [ ] Task completed per acceptance criteria
- [ ] Output quality meets standards
- [ ] Agent asks questions appropriately
- [ ] No scope violations
- [ ] Memory was updated correctly
- [ ] Communication was clear

### 6.4 Readiness Ticket

AgentDeveloper creates a `readiness_validation` ticket:

```yaml
type: readiness_validation
assigned_to: [PM]
related_agent: [Company_Dept_Role]
summary: "[Agent name] completed test task and is ready for live assignment"

## Test Task
[Summary of test task]

## Results
[What the agent produced]

## Reviewer Assessment
[Feedback from reviewer]

## Recommendation
[READY | NEEDS REVISION | NOT READY]
```

### 6.5 Go-Live Decision

PM reviews ticket:
- **READY:** Agent status set to ACTIVE. Agent begins receiving real assignments.
- **NEEDS REVISION:** Specific feedback given. Agent completes another test task.
- **NOT READY:** Agent is not progressed. Decision and action plan documented.

---

## 7. The Two-Layer Formula (Verification)

Every agent is built from the same global standard template. This ensures consistency.

```
Global Standard Template (MG_Parent_AgentDeveloper maintains)
  + [Company_Dept_Role] specific context
  + [Company] vision and learnings
  + [Department] responsibilities and scope
= [Company_Dept_Role] ready-to-operate agent
```

The standard template is never modified per-agent. Context is layered on top.

---

## 8. Model Selection in Agent Creation

When choosing the default model for an agent:

**Decision tree:**
```
Does this agent do complex reasoning?
  → Yes: Claude Opus or Sonnet
  → No: Can local LLM handle it?
       → Yes: Local LLM (cheapest)
       → No: Claude Haiku or GPT-4o
```

### 8.1 Model Tiers for Agents

| Agent Type | Typical Model | Rationale |
|---|---|---|
| CEO agents | Claude Sonnet | Strategic thinking, complex vision |
| Product PMs | Claude Haiku | Structured decisions, routing |
| Architects | Claude Opus | Complex technical reasoning |
| Documentation | Claude Haiku | Markdown generation, consistency |
| Code agents | Claude Code | Complex reasoning, long context |
| Simple routing | Local LLM | Rule-based decisions |
| Verification | Claude Haiku | Quality checks, comparison |

---

## 9. Training Period

New agents start in TRAINING status (5–10 tasks or 2 weeks).

During training:
- PM has direct oversight
- Agents errors are expected and corrected
- Agent learns from feedback
- Memory is updated carefully
- Skills are loaded and tested

After training period:
- Status changes to ACTIVE
- Agent operates independently
- PM continues periodic check-ins

---

## 10. Compliance Checklist

Before an agent is created:

**Phase 1 (Research):**
- [ ] Research document completed
- [ ] Why, what, and who are clear
- [ ] PM approves scope

**Phase 2 (Design):**
- [ ] Design document completed
- [ ] All sections filled
- [ ] PM reviews and approves
- [ ] Tool dependencies identified

**Phase 3 (Approval):**
- [ ] Any new tools are approved
- [ ] Credentials can be provisioned
- [ ] Cost estimates are approved

**Phase 4 (Build):**
- [ ] Workspace directory created
- [ ] All 6 files customized
- [ ] All files pass TORI-QMD
- [ ] Registered in openclaw.json
- [ ] Checkpoint created

**Phase 5 (Validation):**
- [ ] Test task completed successfully
- [ ] Output reviewed and approved
- [ ] Readiness ticket approved
- [ ] Status set to ACTIVE or TRAINING

---

## 11. Examples

### Example: New Documentation Agent

```
Phase 1 (Research):
- DTP_ONXZA_PM identifies need for dedicated docs agent
- Currently docs work is split across team
- New agent would own all doc updates, API specs, tutorials

Phase 2 (Design):
- DTP_ONXZA_Architect drafts design document
- Agent named: DTP_ONXZA_Docs
- Model: Claude Haiku (markdown generation)
- Reports to: DTP_ONXZA_PM
- Persistent daemon

Phase 3 (Approval):
- No new tools needed (uses existing doc infrastructure)
- PM approves design

Phase 4 (Build):
- AgentDeveloper creates workspace-dtp-onxza-docs/
- Customizes 6 files with docs-specific content
- All pass TORI-QMD
- Registered in openclaw.json
- Status: TRAINING

Phase 5 (Validation):
- Test task: Write FAAILS-001.md spec
- Agent completes task
- PM reviews: clear, complete, passes validation
- Readiness approved → Status: ACTIVE
```

---

*This specification is part of FAAILS. Maintained by DTP_ONXZA_Docs.*  
*Specification version: 1.0 — 2026-03-18*

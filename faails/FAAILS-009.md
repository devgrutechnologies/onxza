# FAAILS-009: Escalation & Approval Protocol

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

Some decisions require human judgment or approval from a higher authority. This specification defines when escalation is required, how escalations move through the chain, approval authorities at each level, and timeout procedures.

---

## 1. Core Principle: Only Escalate When Stuck

An agent escalates when it cannot resolve a situation at its current authority level.

**Not an escalation:**
- Asking for clarification (submit in ticket; wait for response)
- Requesting resources (submit approval_request; PM can approve)
- Delegating to another agent (create task ticket; assign)

**An escalation:**
- Fundamental uncertainty about interpretation (vision conflict)
- Authority needed to make a decision (security issue, major trade-off)
- Multiple agents disagree and cannot reach consensus
- Approval required from a human

---

## 2. Escalation Authority Hierarchy

```
Aaron Gear (final authority — human)
        ↑
Marcus (principal agent)
        ↑
CEO agents (company level)
        ↑
Department PMs and Leads
        ↑
Specialist agents (cannot escalate beyond their PM)
```

**Rule:** An agent can only escalate to its direct supervisor or the next level up. No skipping levels.

---

## 3. Escalation Scenarios and Protocols

### 3.1 FVP Loop Exhaustion (Loop 3 Failed)

**Trigger:** Agent completes a task, FVP verification fails 3 times, cannot fix

**Path:**
```
Agent → PM (decision: retry / escalate / accept-with-flag)
```

**What PM decides:**
1. **RETRY** — Agent reattempts with modifications
   - PM provides specific feedback on what to improve
   - Agent gets one more attempt (loop 4)
   - If loop 4 fails: escalate to PM's supervisor

2. **ESCALATE** — Send to expert PM in that domain
   - Example: Code FVP failed → escalate to architecture PM
   - Expert PM reviews → decides accept or reject

3. **ACCEPT-WITH-FLAG** — Ship despite FVP failure
   - Unusual. Only if critical timing or work cannot be improved
   - Flag is permanent record
   - Learning captured: why was this accepted?

**Response SLA:** PM responds within 1 hour

**Ticket type:** `fvp_escalation`

**Example:**
```yaml
type: fvp_escalation
created_by: DTP_ONXZA_Docs
assigned_to: DTP_ONXZA_PM
summary: "FAAILS-002 failed FVP humanization check 3x — needs PM decision"
body: |
## Failed Task
Writing FAAILS-002 spec. FVP feedback: "writing is too formal and robotic"

## Attempts
1. Tried more examples → still too formal
2. Tried more conversational language → lost technical precision
3. Unable to balance both

## Request
Guidance: retry with new approach (suggest what approach?)
or accept-with-flag this version?
```

---

### 3.2 Security Flag

**Trigger:** Agent detects a security concern

**Path:**
```
Agent → Security agent (IMMEDIATE, no delay)
```

**What happens:**
1. Agent creates `security_flag` ticket
2. Ticket goes to DTP_Security (or company security agent)
3. Security agent responds within 15 minutes
4. If real: security agent takes ownership or directs action
5. If false alarm: agent is informed; ticket closed

**Security flag categories:**
- Credential exposure (API key, password in logs)
- Unauthorized access attempt
- Data breach possibility
- Policy violation
- Suspicious activity pattern

**Response SLA:** 15 minutes (security is real-time)

**Escalation path if security agent doesn't respond:** → PM → CEO

**Ticket type:** `security_flag`

---

### 3.3 Vision Conflict

**Trigger:** Agent discovers a task conflicts with the vision document

**Path:**
```
Agent → PM (immediate notification)
```

**What agent does:**
1. Stops work on the conflicting task
2. Creates escalation ticket with:
   - Which vision section is in conflict
   - What the task asks
   - Why they conflict
   - Agent's recommended resolution (option A, B, C)
3. Awaits PM decision

**What PM does:**
1. Reviews the conflict
2. Decides: Was the task correctly specified? Or should vision be updated?
3. If vision needs update: creates vision_update_request ticket (for Marcus)
4. If task was wrong: corrects the ticket or closes it
5. Informs agent of decision

**Response SLA:** PM responds within 2 hours

**Ticket type:** `escalation` with tag "vision-conflict"

---

### 3.4 Resource Deadlock

**Trigger:** Multiple agents need the same resource; cannot proceed without it

**Examples:**
- Multiple agents requesting same credentials
- Multiple agents requesting same time slot from a shared system
- Multiple agents waiting for output from a single source

**Path:**
```
Agents → PM (resource allocation authority)
```

**What PM does:**
1. Assesses urgency of each competing need
2. Assigns priority: which agent gets resource first
3. Schedules others for sequence (if possible) or alternative
4. Communicates decision to all waiting agents

**Response SLA:** 1 hour

**Ticket type:** `escalation` with tag "resource-conflict"

---

### 3.5 Model Selection Disagreement

**Trigger:** Router suggests one model; agent disagrees; data supports agent

**Path:**
```
Agent (expert) → Router data logged
```

**What happens:**
1. Agent executes with its own model (not router's suggestion)
2. Both outcomes logged to MPI data
3. No escalation needed — data decides over time
4. If pattern emerges (router consistently wrong), flagged to ModelIndex agent

**This is NOT an escalation — it's the self-correcting routing system working as designed.**

No ticket required unless the agent suspects a bug in the router.

---

### 3.6 Policy Gap (Undocumented Procedure)

**Trigger:** Agent encounters a situation with no documented policy

**Path:**
```
Agent → PM (create policy_gap_request)
```

**What agent does:**
1. Documents the situation
2. Proposes 2–3 possible policies
3. Submits ticket requesting PM guidance

**What PM does:**
1. Reviews situation
2. May decide: this is already covered (point to doc)
3. Or: this is new, needs a policy decision
4. If new: escalates to CEO if company-level policy needed
5. Decides policy
6. Documents in governance or updates DOC-XXX
7. Informs agent

**Response SLA:** 4 hours (unless CEO escalation needed, then 8 hours)

**Ticket type:** `policy_gap_request`

---

### 3.7 Approval Required (Aaron Decision)

**Trigger:** A decision requires Aaron's final judgment

**Examples:**
- Major strategy change
- Large spending approval
- Vision change
- New company or major new initiative
- Irreversible action
- Conflict between two visions

**Path:**
```
Agent → PM → Marcus → Aaron
```

**Process:**
1. Agent creates `approval_request` ticket with `requires_aaron: true`
2. Ticket routed to PM
3. PM reviews and adds recommendation (yes, no, or neutral)
4. Marcus reviews and surfaces to Aaron with summary
5. Aaron responds: APPROVE, DENY, or REQUEST CLARIFICATION
6. Response flows back: Aaron → Marcus → PM → Agent
7. Agent acts on decision

**Response SLA:**
- PM reviews: 1 hour
- Marcus surfaces: 2 hours
- Aaron responds: within 24 hours (or next available)
- Total: 27 hours

**Ticket type:** `approval_request` with `requires_aaron: true`

**Example:**
```yaml
type: approval_request
requires_aaron: true
assigned_to: DTP_ONXZA_PM
created_by: DTP_ONXZA_PM
summary: "Should we commit to Q2 product launch with current feature set?"

body: |
## The Decision
Launch the product in Q2 with the currently planned feature set,
or delay to Q3 to add Feature X and Feature Y?

## Context
- Q2 launch: reaches market faster, earlier revenue
- Q3 launch: more complete, might win larger deals

## PM Recommendation
Q2 (time-to-market matters more than completeness)

## Request
Aaron's judgment on timing vs feature completeness tradeoff.
```

---

## 4. Approval Authority Matrix

Who can approve what:

| Type | Authority | Conditions |
|---|---|---|
| Task assignment | PM | Standard work |
| Resource allocation | PM | Up to budget limit |
| New skill creation | PM | Follows skill spec |
| Minor policy clarification | PM | Already in governance docs |
| New tool integration | PM + Security | Under cost limit |
| Major tool integration | CEO | Significant cost or risk |
| New agent creation | CEO + AgentDeveloper | Follows agent creation spec |
| Policy creation | CEO | New governance needed |
| Spending >$5000 | Marcus + CEO | Budget authority |
| Spending >$50000 | Aaron | Final spending approval |
| Vision document change | Aaron | Always requires final approval |
| Irreversible action | Aaron | Always requires confirmation |
| Company strategy change | Aaron | Requires vision update |

---

## 5. Timeout and Escalation Paths

### 5.1 Response Timeouts

If authority doesn't respond within SLA:

```
Agent waits [SLA] → no response
        │
        ▼
Escalate to next level up
        │
        ▼
Next level responds within half-SLA
        │
        ├─ No response
        │
        └─ Escalate further (if available)
        │
        ▼
Marcus or CEO always available within 4 hours
        │
        ▼
Decision made (or decision to hold pending Aaron)
```

### 5.2 Example: FVP Escalation Timeout

```
Agent completes task (time: T+0)
FVP fails (time: T+1h)
Agent escalates to PM (time: T+1h)

SLA: PM responds within 1 hour
        │
        ├─ PM responds (time: T+1.5h) → decision made ✓
        │
        └─ No response (time: T+2h)
                │
                ▼
        Escalate to CEO (time: T+2h)
        CEO responds within 30 min (half of 1h SLA)
                │
                └─ CEO makes decision (time: T+2.5h) ✓
```

---

## 6. Consensus and Disagreement

### 6.1 Two-Agent Disagreement

If two agents disagree on interpretation or approach:

1. Agents discuss (max 1 hour of back-and-forth)
2. If consensus reached: proceed
3. If no consensus: escalate to PM
4. PM decides

### 6.2 Three-or-More-Agent Disagreement

If 3+ agents are in conflict:

1. PM convenes a synchronous decision session (30 min)
2. Each agent presents position
3. PM makes decision (not a vote, PM authority)
4. Decision is binding

If agents believe PM's decision violates company vision:

1. Escalate to CEO
2. CEO reviews
3. CEO confirms or overrules PM

---

## 7. Escalation Ticket Structure

Every escalation uses a structured ticket:

```yaml
---
type: escalation
created_by: [requesting agent]
assigned_to: [supervisor or authority]
project: [project]
company: [company]
priority: [low | medium | high | critical]
status: open
requires_aaron: [true if needed]
parent_ticket: [original task if applicable]
related_vision: [vision path if vision-related]
---

## What Is Stuck
Clear description of the situation.

## Why It's Stuck
Why can't the requesting agent resolve this?

## Options Considered
Option A: [description] — pros/cons
Option B: [description] — pros/cons
Option C: [description] — pros/cons

## Recommendation
[Requesting agent's recommendation]

## Required Authority
What level decision-maker is needed?
```

---

## 8. Irreversible Actions

Some actions require explicit approval even if technically possible:

### 8.1 Irreversible Action List

- Deleting any file or directory
- Modifying any approved vision.md
- Publishing anything externally (code, content, specs)
- Sending external communications (email, social, press)
- Modifying any agent's workspace files directly
- Installing new major tool or API
- Making bulk changes (10+ files)
- Spending money or committing funds
- Creating or modifying policies
- Retiring an agent

### 8.2 Irreversible Action Protocol

Before any irreversible action (in order, no exceptions):

```
Step 1: Create checkpoint
Step 2: Log to audit trail (pending status)
Step 3: Present to Aaron with exact consequences
Step 4: Wait for explicit CONFIRM or CANCEL
Step 5: Execute only on CONFIRM
Step 6: Update audit trail (executed or cancelled)
```

**Irreversible actions cannot be delegated.** Only Marcus or Aaron can approve.

---

## 9. Escalation Case Studies

### Case 1: FVP Escalation

```
Task: Write documentation
FVP feedback: "Too technical for the audience"
Loop 1: Agent rewrites for simpler audience
FVP feedback: "Now too simplified, lost important details"
Loop 2: Agent tries to balance
FVP feedback: Same feedback as Loop 1 — stuck in conflict

Decision: Escalate to PM
PM feedback: "Actually, write two versions: expert and beginner"
Agent retakes task with new approach (loop 3)
FVP passes → document accepts
```

### Case 2: Vision Conflict

```
Task ticket says: "Launch product in Q2"
Vision says: "We prioritize quality over speed. Ship only when it's perfect."

Agent realizes conflict
Creates escalation ticket
PM reviews both
Determines: Task ticket was created before vision was locked
PM corrects task: "Align launch timing with quality standards in vision"
Escalation resolved

Root cause: Task was assigned before vision was locked. Now aligned.
```

### Case 3: Approval Required

```
Agent encounters: "Should we migrate from Framework X to Framework Y?"
This is not a task-level decision — it's architecture strategy
Agent escalates to PM
PM escalates to Architect
Architect escalates to CEO
CEO escalates to Aaron (strategy decision)

Aaron decides: "Yes, migrate to Y by end of Q2"
Decision flows back down
New tickets created for migration work
```

---

## 10. Compliance Checklist

Before an escalation ticket is created:

- [ ] Agent has tried to resolve at current level
- [ ] Clear description of what is stuck
- [ ] Clear description of why it's stuck
- [ ] At least 2 options documented
- [ ] Escalation authority is correct (not skipping levels)
- [ ] Response SLA is specified in ticket
- [ ] No personal blame in escalation (focus on situation, not person)

Before an escalation is approved:

- [ ] Authority has reviewed situation
- [ ] Decision is explicit and documented
- [ ] Decision is communicated back to requesting agent
- [ ] Learning is captured (why did this escalate?)

---

*This specification is part of FAAILS. Maintained by DTP_ONXZA_Docs.*  
*Specification version: 1.0 — 2026-03-18*

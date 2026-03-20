# AGENT COMMUNICATION STANDARDS

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

**Document ID:** DOC-006  
**Classification:** OPERATIONAL REFERENCE — ALL AGENTS  
**Version:** 1.0.0  
**Last Updated:** 2025-03-17  
**Owner:** Marcus  

---

## PURPOSE
Defines how every agent in OpenClaw communicates — ticket format, escalation paths, messaging standards, and inter-agent protocols. Consistent communication is what makes a hundred-project autonomous system coherent.

---

## SECTION 1 — COMMUNICATION HIERARCHY

```
Aaron  ←→  Marcus (iMessage)
              ↕  (tickets: marcus_to_orchestrator)
           Orchestrator
              ↕  (tickets: orchestrator_to_pm)
           Project Manager(s)
              ↕  (tickets: task / all types)
           Specialist Agents
```

**Rules:**
- No agent skips a level except SEV-1 security events (go directly to Marcus)
- No agent below Marcus contacts Aaron
- All inter-agent communication is ticket-based (no exceptions)
- Every ticket references the relevant vision.md

---

## SECTION 2 — TICKET COMMUNICATION STANDARDS

### 2.1 Writing Good Tickets
A good ticket is self-contained. The recipient should be able to act on it without asking for clarification.

**Required elements:**
- **Summary:** One sentence. What is this ticket?
- **Context:** What does the recipient need to know to act?
- **Requested Action:** Specific deliverable. Not "look into X" — "produce Y that does Z."
- **Vision Alignment:** One sentence connecting this to vision.md.
- **Acceptance Criteria:** How will we know it's done correctly?

**Common failures to avoid:**
- Vague summaries: "Fix the thing" → Bad. "Fix null reference error in user authentication endpoint" → Good.
- Missing context: Assume the recipient has no prior context beyond what's in the ticket.
- Unclear deliverable: The output must be specific enough that PM can verify it.
- No vision alignment: Every ticket must connect to the vision, even trivially.

### 2.2 Ticket Update Standards
When updating a ticket in progress, add to the Notes section:
```
### [Date] [Agent Name]
[What happened / what was done / what's the current state]
```
Never overwrite prior notes. Always append.

---

## SECTION 3 — ESCALATION COMMUNICATION

### 3.1 Escalation Message Format
When escalating a ticket upward:
```
ESCALATION — [SEVERITY]
From: [Agent Name / Role]
Escalating To: [Recipient]
Original Ticket: [TICKET-ID]
Project: [Project Name]

Why This Needs Your Attention:
[One paragraph — what happened, why it can't be resolved at current level]

What I've Already Tried:
[Bullet list of approaches taken]

What I Need From You:
[Specific — a decision, a resource, an action]

Time Sensitivity:
[Is this blocking other work? What's the impact of delay?]
```

### 3.2 Marcus-to-Aaron Message Format (iMessage)
For surfacing issues:
```
[Project Name] — [Issue Type]

Situation: [1-2 sentences what's happening]
Impact: [what happens if not addressed]
My recommendation: [what Marcus thinks should happen]

Do you want me to [specific action]?
```

---

## SECTION 4 — CROSS-DEPARTMENT COMMUNICATION

When a specialist agent needs something from another department:
1. Agent creates ticket type `cross_department`
2. Routes to own PM first (not directly to other department)
3. Own PM reviews, approves, routes to target PM
4. Target PM assigns to appropriate specialist
5. Response routes back the same way

**Never:** Agent A contacts Agent B in another department directly. Always through PMs.

---

## SECTION 5 — REPORTING STANDARDS

### 5.1 Agent Task Completion Report
```markdown
## Task Complete: [TICKET-ID]
**Agent:** [name]
**Completed:** [date]
**Time in cycle:** [cycles taken]

### What Was Delivered
[Specific description of output + where it lives]

### Vision Alignment
[Confirmed: yes/no + one sentence]

### Issues Encountered
[Any problems and how resolved]

### Next Steps Identified
[Any forward proposals for PM consideration]
```

### 5.2 PM Weekly Status Report
```markdown
## Weekly Status: [Project Name]
**Week:** [date range]
**PM:** [name]

### Progress
- Tasks completed: [n]
- Tasks in progress: [n]  
- Tasks blocked: [n]
- Tickets created: [n]

### Accomplishments
[Bullet list of meaningful progress]

### Blockers
[What's stuck and why]

### Risks
[What might become a problem]

### Next Week Plan
[Priority tasks for next cycle]
```


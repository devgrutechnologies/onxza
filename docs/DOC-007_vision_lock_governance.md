# VISION LOCK & GOVERNANCE

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

**Document ID:** DOC-007  
**Classification:** CRITICAL — NO EXCEPTIONS  
**Version:** 1.0.0  
**Last Updated:** 2025-03-17  
**Owner:** Marcus  

---

## THE VISION LOCK PRINCIPLE
vision.md is the immutable north star of every project. Once Aaron approves it, it cannot be changed by any agent below Marcus. This is not bureaucracy — it is the mechanism that prevents vision drift across hundreds of autonomous agents running in parallel.

## WHO CAN DO WHAT WITH VISION.MD

| Action | Who Can Do It |
|---|---|
| Create vision.md | Marcus only |
| Read vision.md | All agents |
| Approve vision.md | Aaron only |
| Modify vision.md | Marcus only, with Aaron's explicit instruction |
| Propose a change to vision.md | Any agent — via `vision_update_request` ticket |
| Archive vision.md (project end) | Marcus only, with Aaron's instruction |

## THE IMMUTABILITY GUARANTEE
- vision.md files are Git-committed with every change
- Marcus's system prompt explicitly prohibits modification without Aaron's instruction
- Any agent that attempts to write to vision.md triggers a SEV-1 security event
- Dashboard monitors vision.md modification timestamps — any unauthorized change is an immediate alert

## VISION UPDATE PROCESS
1. Any agent (including Marcus observing system state) identifies a reason the vision may need updating
2. Agent creates ticket type `vision_update_request` with: what needs changing, why, evidence
3. Ticket escalates to Marcus
4. Marcus reviews and forms a recommendation
5. Marcus presents to Aaron via iMessage: one sentence what, one sentence why, recommendation
6. Aaron says yes or no or gives new direction
7. If yes: Marcus updates vision.md, commits to Git with rationale, notifies Orchestrator
8. If no: ticket closed, vision unchanged, reason logged

## PROJECT CONTEXT LAYER
PMs maintain a `project-context.md` alongside vision.md. This file:
- SUPPLEMENTS vision.md with implementation details
- NEVER overrides or contradicts vision.md
- Contains: tech stack decisions, constraints discovered, lessons learned, integration notes
- Is writable by the PM
- Does not require Aaron's approval to update

If project-context.md ever contradicts vision.md, vision.md wins. Always.

# AGENT ONBOARDING & LIFECYCLE

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

**Document ID:** DOC-008  
**Version:** 1.0.0 | **Last Updated:** 2025-03-17 | **Owner:** Agent Developer Orchestrator  

---

## AGENT LIFECYCLE STAGES

```
REQUESTED → DESIGNED → APPROVED → BUILT → TESTED → ACTIVE → [RETIRED | EVOLVED]
```

### Stage 1: REQUESTED
- Triggered by: Orchestrator or PM identifying a skill gap
- Ticket: `agent_creation_request`
- Contains: role needed, project, why no existing agent can fill it

### Stage 2: DESIGNED
- Agent Developer creates design.md (see DOC-003 Section 7.1)
- Research conducted, skills identified, scope defined
- Model tier assigned per DOC-001

### Stage 3: APPROVED
- If new paid tools needed → Aaron approval required
- PM reviews design for project fit
- Design signed off before build begins

### Stage 4: BUILT
- Directory structure created
- Deployed at OpenClaw daemon level
- Skills installed, identity.md written, memory initialized

### Stage 5: TESTED
- Test task run, output reviewed
- Security review of skill set
- PM final check

### Stage 6: ACTIVE
- Agent receives and executes tickets
- Self-learns on every task
- Participates in normal ticket flow

### Stage 7: RETIRED or EVOLVED
**Retired when:** Project ends, role becomes redundant, agent replaced by better version
- Memory archived to `/openclaw/archive/agents/[name]/`
- Never fully deleted — historical record preserved
- Retirement requires PM + Orchestrator approval

**Evolved when:** Agent's skill domain needs to expand
- Same process as new skill approval (DOC-005)
- Identity.md updated with version increment

## AGENT HEALTH INDICATORS
| Indicator | Healthy | At Risk | Failing |
|---|---|---|---|
| Task completion rate | >90% | 70-90% | <70% |
| Memory update frequency | Every task | Every 2-3 tasks | Rarely |
| Revision request rate | <20% | 20-40% | >40% |
| Escalation rate | <10% | 10-25% | >25% |
| Response to tickets | Active | Slow | Silent |

PM reviews agent health monthly. Failing agents are flagged to Orchestrator for review or rebuild.

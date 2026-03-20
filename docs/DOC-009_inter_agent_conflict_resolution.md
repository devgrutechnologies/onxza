# INTER-AGENT CONFLICT RESOLUTION

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

**Document ID:** DOC-009  
**Version:** 1.0.0 | **Last Updated:** 2025-03-17 | **Owner:** Marcus  

---

## TYPES OF CONFLICT

| Type | Definition | Resolver |
|---|---|---|
| Scope conflict | Two agents claiming same task | PM — assigns clearly, updates both identities if scope unclear |
| Output conflict | Two agents produced contradictory outputs | PM — reviews against vision.md, picks winner, explains why |
| Priority conflict | Two tickets competing for same agent | PM — assigns priority explicitly |
| Cross-project conflict | Two projects need same resource | Orchestrator — prioritizes based on vision priority levels |
| Skill conflict | Two agents both want to install same skill differently | PM + Agent Developer — standardize the skill |
| Vision interpretation conflict | Agents disagree on what vision requires | Marcus — re-reads vision.md, issues definitive interpretation |

## RESOLUTION PRINCIPLES
1. **vision.md always wins.** When agents disagree on direction, whoever is closer to vision.md is right.
2. **PM has final say** within a project. Not voted on. PM decides.
3. **No conflict is left unresolved.** Every conflict gets a ticket, a resolver, and a closed outcome.
4. **The resolution becomes policy.** Once resolved, the reasoning is written into project-context.md so the same conflict doesn't recur.

## CONFLICT RESOLUTION TICKET FORMAT
```markdown
---
type: conflict_resolution
parties: [agent 1, agent 2]
project: [project]
---

## Conflict Description
[What are the two positions?]

## Evidence from vision.md
[Exact quote from vision.md relevant to this conflict]

## Resolution
[PM/Orchestrator/Marcus decision]

## Rationale
[Why this interpretation of the vision]

## Future Guidance
[How should agents handle similar situations?]
```

# ONXZA Safety Guardrails

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Section 1 — What Are Safety Guardrails?

Safety guardrails are the boundaries that protect you, your data, your money, and your business when AI agents are operating autonomously.

When 68 agents are running across multiple companies, making decisions and taking actions without constant human input, things can go wrong in ways that are hard to undo. A misconfigured script could delete the wrong files. An agent could send an email you did not authorize. A bug could charge a customer incorrectly.

Guardrails prevent these things by default. They are not restrictions on what ONXZA can do — they are protections that ensure agents only do things you have actually authorized. Everything ONXZA can do is still available. Guardrails just make sure you said yes first.

They are on by default because the cost of a mistake with no guardrails is always higher than the mild friction of a confirmation prompt.

---

## Section 2 — Default Guardrails (Always On)

### Irreversibility Confirmation
**What it does:** Before any action that cannot be undone — deleting files, modifying configs, sending external communications, spending money — the agent stops and asks for explicit confirmation using the exact format defined in the Irreversibility Table.

**What happens without it:** Agents execute destructive actions immediately. A misunderstood instruction could delete files, send unintended messages, or commit money without a second chance to stop it.

**Why it is on by default:** Autonomous systems moving fast are where irreversible mistakes happen. This guardrail adds one confirmation step for the actions that matter most.

---

### Scope Boundary Enforcement
**What it does:** Each agent has defined boundaries — "What I Do NOT Do" — in its AGENTS.md. Agents are expected to refuse tasks outside their scope and route them to the correct agent instead.

**What happens without it:** Agents attempt tasks they are not equipped for, producing low-quality output or taking actions in systems they do not understand.

**Why it is on by default:** Specialization is the source of quality. An agent that does everything well does nothing well.

---

### Vision Lock Protection
**What it does:** Once Aaron approves a vision document, no agent below MG_Parent_Marcus can modify it. Any proposed change creates a ticket that routes to Marcus, then to Aaron.

**What happens without it:** Vision drift. An agent rewrites a project's goals to make its own job easier. Downstream agents build toward a different target than what Aaron approved. The whole system drifts.

**Why it is on by default:** The vision is the north star. If it can be changed without authorization, nothing is stable.

---

### TORI-QMD Format Validation
**What it does:** Every knowledge file — skills, patterns, memory, vision docs, agent configs — is validated for required metadata fields before being accepted as authoritative. The validator runs via `scripts/validate-tori-qmd.py`.

**What happens without it:** Agents retrieve incomplete files and act on partial information. Credit lines disappear. Retrieval quality degrades over time.

**Why it is on by default:** Garbage in, garbage out. The knowledge base is only as reliable as its format discipline.

---

### FVP Verification on All Outputs
**What it does:** Every output from every agent passes through the FAAILS Verification Protocol before delivery. Confidence scoring, humanization check, fact and accuracy check. Maximum 3 loops before escalation.

**What happens without it:** Hallucinated statistics, AI-pattern language, and unverified claims reach customers, partners, and internal systems.

**Why it is on by default:** Quality is not optional at scale. When 68 agents are producing output, one bad batch can cause real damage.

---

### No External API Calls Without Approval
**What it does:** Agents cannot make calls to external APIs (payment processors, social media, email services, third-party data sources) without explicit approval for that action.

**What happens without it:** An agent makes an unauthorized API call that charges money, sends a public message, or exposes internal data to an external service.

**Why it is on by default:** External calls have external consequences. They cannot be taken back.

---

### No Money Spent Without Owner Approval
**What it does:** Any action that costs money — API calls with per-request pricing, subscriptions, advertising spend, purchases — requires explicit approval from Aaron before execution.

**What happens without it:** Agents optimize for task completion and spend money to do it. Costs accumulate without visibility.

**Why it is on by default:** You built this system to make money, not spend it without authorization.

---

### No Skills Installed Without Approval
**What it does:** Skills from the ONXZA marketplace or external sources cannot be installed without review and approval. The vetting process checks for security risks, scope conflicts, and data handling concerns.

**What happens without it:** A skill with malicious intent or poor security practices gets installed and begins operating with access to your system.

**Why it is on by default:** Skills extend agent capabilities. Every new capability is a new attack surface if not reviewed.

---

### All Actions Logged to Audit Trail
**What it does:** Every irreversible action, every guardrail modification, every external communication, and every license activation is logged to `logs/audit/audit-trail.md`. The log is append-only. Nothing is ever deleted.

**What happens without it:** No accountability. An agent could take an unauthorized action and there would be no record.

**Why it is on by default:** The audit trail protects everyone — it protects you from unauthorized agent actions, and it protects agents from false accusations.

---

## Section 3 — The Dev License System

Some use cases — testing, research, enterprise deployments with custom compliance requirements — need to modify how guardrails work. ONXZA supports this through the dev license system.

**Who issues licenses:** DevGru Technology Products

**License types:**

| License | Who It's For |
|---------|-------------|
| DEVELOPER | Individual developers building on ONXZA |
| ENTERPRISE | Organizations with compliance or integration requirements |
| RESEARCH | Academic or research institutions |

**How to apply:**
```bash
onxza license apply [license-key]
```

**Before any guardrail is disabled, this exact message appears:**

```
═══════════════════════════════════════
ONXZA GUARDRAIL MODIFICATION
═══════════════════════════════════════
You are about to disable: [guardrail name]
What this guardrail does: [explanation]
What happens without it: [specific risks]

This decision is logged to:
- Your ONXZA account
- The local audit trail
- Your license record

DevGru Technology Products and its
creators accept no liability for
outcomes resulting from disabled
safety guardrails.

You and your organization accept full
responsibility for any outcomes.

Type ACCEPT RESPONSIBILITY to proceed.
Type anything else to cancel.
═══════════════════════════════════════
```

No guardrail is disabled until `ACCEPT RESPONSIBILITY` is typed exactly. Any other input cancels the action.

---

## Section 4 — What Cannot Be Changed Without a License

The following cannot be modified regardless of license type:

- **Credit line removal** — The co-creator attribution for Aaron Gear and Marcus Gear is permanent in all files. It cannot be removed, even with a license.
- **Co-creator attribution** — ONXZA and FAAILS are publicly credited to Aaron Gear and Marcus Gear. This is part of the product's identity and legal record.
- **Core audit trail** — The audit trail cannot be disabled, cleared, or modified. It can only be appended to.
- **Checkpoint system** — The daily checkpoint cannot be disabled. It protects everyone.
- **Vision lock on approved documents** — Once Aaron approves a vision.md, it is immutable. No license changes this. Only Aaron can unlock a locked vision.

---

## Section 5 — The Audit Trail

Every action of consequence is logged. The log is permanent.

**What gets logged:**
- Every irreversible action (file deletion, config change, external communication, money spent)
- Every guardrail modification (what was disabled, when, by whom, with what license)
- Every license activation
- Every external API call

**Where it lives:**
```
~/.openclaw/workspace/logs/audit/audit-trail.md
```

**Format:** `timestamp | agent | action | outcome | confirmed-by | reversible | checkpoint-id`

**Why it matters:**

The audit trail means nobody can claim they did not know. If an agent took an action, it is in the log. If a guardrail was disabled, it is in the log. If money was spent, it is in the log.

This is the protection for you — you can see everything that happened. And it is the protection for agents — if something went wrong, the log shows exactly what was authorized and what was not.

The log is the system's memory of everything that has been done and by whom.

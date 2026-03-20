# FVP Runtime — Technical Reference

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0  
**File:** `projects/onxza/core/fvp_runtime.py`  
**Protocol Spec:** `projects/onxza/faails/FVP-001.md`  
**Status:** Active

---

## What This Is

The FVP Runtime is the automated gate that every agent-produced output must pass through before being accepted as complete. It is the executable implementation of the [FAAILS Verification Protocol](../faails/FVP-001.md).

FVP cannot be bypassed. Any output that reaches a ticket's `completion_note` without passing FVP is a protocol violation.

---

## How to Call It

### Option A — Python import (recommended for agents in Python flows)

```python
from projects.onxza.core.fvp_runtime import run_fvp

result = run_fvp(
    output="Your produced output here...",
    confidence_score=82,             # Self-assessed, 0–100
    ticket_id="TICKET-20260318-XYZ-001",
    agent_id="WDC_Content_BlogWriter",
    task_type="blog_post",
    vision_path="projects/wdc/vision.md",  # optional
    acceptance_criteria=[            # optional — from ticket
        "Post is 800–1200 words",
        "Includes affiliate CTA",
    ],
    model="claude-haiku-4-5",
)

if result.passed:
    # Safe to use output and close ticket
    print("Output accepted.")
else:
    # Revise output based on result.notes, then call run_fvp again
    # FVPRuntime tracks loop count — loop 3 failure auto-escalates
    print(f"Revision needed: {result.notes}")
```

### Option B — CLI (for scripts and bash flows)

```bash
python3 ~/.openclaw/workspace/projects/onxza/core/fvp_runtime.py \
  --output-file /tmp/my-output.txt \
  --confidence 82 \
  --ticket-id TICKET-20260318-XYZ-001 \
  --agent-id WDC_Content_BlogWriter \
  --task-type blog_post \
  --model claude-haiku-4-5

# Exit code 0 = passed, 1 = failed
```

---

## The Three FVP Steps

| Step | Check | Pass Condition | Fail Action |
|------|-------|----------------|-------------|
| 1 | Confidence | Score ≥ 70 | Loop back immediately |
| 2 | Humanization | No AI tells, natural prose/code | Loop back |
| 3 | Accuracy | Vision-aligned, criteria met | Loop back |

**Max loops: 3.** On loop 3 failure, an `fvp_escalation` ticket is auto-created and assigned to the producing agent's PM.

---

## Loop Tracking

The `FVPRuntime` object tracks loops internally. To use multi-loop retry correctly:

```python
fvp = FVPRuntime(
    ticket_id="TICKET-...",
    agent_id="MY_AGENT",
    task_type="code",
)

for attempt in range(3):  # outer loop by producing agent
    output = produce_output()
    confidence = self_assess()

    result = fvp.run(output=output, confidence_score=confidence)
    if result.passed:
        break
    if result.escalation_ticket_id:
        # Escalation auto-handled — stop and wait for PM
        break
    # Otherwise revise based on result.notes
```

> **Important:** Create ONE `FVPRuntime` instance per ticket. Do not create a new instance per retry — loop count is tracked on the instance.

---

## FVP Result Object

```python
@dataclass
class FVPResult:
    passed: bool                    # True = accepted
    loop_count: int                 # Which loop this was (1–3)
    confidence: int                 # Score used in Step 1
    humanization_passed: bool       # Step 2 result
    accuracy_passed: bool           # Step 3 result
    notes: str                      # Human-readable explanation
    escalation_ticket_id: str|None  # Set if escalation was created
    timestamp: str                  # ISO-8601 UTC
```

---

## Humanization Check — Live vs. Heuristic

The humanization check (Step 2) routes to `DTP_ONXZA_Verification` agent via a `verification_request` ticket.

- **Live mode** (when verification agent is active): A ticket is created, the agent processes it, and the result is read back.
- **Heuristic fallback** (when agent is not yet available): A rule-based check runs automatically, flagging common AI tells (e.g., "certainly!", "it's worth noting that", over-structured numbered lists).

The heuristic fallback is intentionally strict. False positives that cause a revision loop are preferable to passing AI-tell-ridden output.

---

## MPI Logging

Every FVP outcome — pass or fail — is logged to:

```
~/.openclaw/workspace/logs/quality/fvp-mpi.jsonl
```

Fields logged per run:

```json
{
  "timestamp": "2026-03-18T...",
  "ticket_id": "TICKET-...",
  "agent_id": "WDC_Content_BlogWriter",
  "model": "claude-haiku-4-5",
  "task_type": "blog_post",
  "fvp_passed": true,
  "confidence_score": 82,
  "loop_count": 1,
  "humanization_passed": true,
  "accuracy_passed": true,
  "escalation_ticket": null,
  "elapsed_seconds": 4.2,
  "notes": "FVP passed on loop 1."
}
```

This data feeds the ONXZA Model Performance Index (MPI). Over time it reveals which models pass FVP on the first attempt, which task types cause loop failures, and where specific model/task combinations need improvement.

---

## Audit Log

Full loop-by-loop history is logged separately for accountability:

```
~/.openclaw/workspace/logs/quality/fvp-audit.jsonl
```

---

## Escalation Ticket Format

When loop 3 fails, `FVPRuntime` auto-creates a ticket at:

```
~/.openclaw/workspace/tickets/open/FVP-ESC-[TICKET-ID]-[timestamp].md
```

The ticket is `assigned_to: dtp-onxza-pm` and contains the full loop history. PM must decide: retry, escalate to human, or accept-with-flag.

---

## Enforcement

FVP is non-optional. Enforcement mechanism:

1. **Convention:** Every ONXZA agent's AGENTS.md states that outputs must pass FVP before ticket completion.
2. **TORI-QMD Validation:** Agent workspace files are validated; AGENTS.md must include FVP compliance statement.
3. **Audit Trail:** FVP audit log is cross-referenceable against ticket close timestamps. Any ticket closed without a corresponding FVP log entry is a violation.
4. **PM Review:** DTP_ONXZA_PM spot-checks closed tickets against the FVP audit log as part of quality review.

There is no code-level enforcement that can prevent an agent from bypassing FVP — that is intentional (we do not want hard locks that break things). The enforcement is procedural, auditable, and PM-enforced. This is the right model.

---

## Files

| File | Purpose |
|------|---------|
| `core/fvp_runtime.py` | Runtime module (import or run as CLI) |
| `core/FVP-RUNTIME-001.md` | This document |
| `faails/FVP-001.md` | Protocol specification |
| `logs/quality/fvp-mpi.jsonl` | MPI data output |
| `logs/quality/fvp-audit.jsonl` | Audit trail |

---

*Built by DTP_ONXZA_Verification. Part of the FAAILS quality backbone.*

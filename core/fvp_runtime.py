#!/usr/bin/env python3
"""
FVP Runtime — FAAILS Verification Protocol v1.0
================================================
The automated quality gate every ONXZA agent output must pass before acceptance.

Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful
Anthropic Models, OpenAI Models, and Local LLMs.

Usage (from any agent):
    from fvp_runtime import FVPRuntime

    fvp = FVPRuntime(
        ticket_id="TICKET-20260318-DTP-018",
        agent_id="DTP_ONXZA_Docs",
        task_type="documentation",
        vision_path="projects/onxza/docs/vision.md",   # optional
        acceptance_criteria=["Criterion 1", "Criterion 2"]  # optional
    )

    result = fvp.run(
        output="The output to verify.",
        confidence_score=82
    )
    # result.passed → True/False
    # result.loop_count → int
    # result.confidence → int
    # result.notes → str

FVP cannot be bypassed. Calling code must use the result.
"""

import json
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent.parent.parent  # ~/.openclaw/workspace
TICKETS_OPEN      = BASE_DIR / "tickets" / "open"
TICKETS_IN_PROG   = BASE_DIR / "tickets" / "in-progress"
MPI_LOG           = BASE_DIR / "logs" / "quality" / "fvp-mpi.jsonl"
FVP_AUDIT_LOG     = BASE_DIR / "logs" / "quality" / "fvp-audit.jsonl"
AGENT_REGISTRY    = BASE_DIR / "docs" / "AGENT-REGISTRY.md"

VERIFICATION_AGENT_ID = "dtp-onxza-verification"
MAX_LOOPS = 3
CONFIDENCE_THRESHOLD = 70

# ── Data classes ─────────────────────────────────────────────────────────────

@dataclass
class FVPResult:
    passed: bool
    loop_count: int
    confidence: int
    humanization_passed: bool
    accuracy_passed: bool
    notes: str
    escalation_ticket_id: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))


@dataclass
class LoopRecord:
    loop_number: int
    output: str
    confidence_score: int
    confidence_check: str       # "PASS" | "FAIL"
    humanization_check: str     # "PASS" | "FAIL" | "PENDING"
    accuracy_check: str         # "PASS" | "FAIL" | "PENDING"
    humanization_notes: str
    accuracy_notes: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))


# ── Main Runtime ─────────────────────────────────────────────────────────────

class FVPRuntime:
    """
    The FVP runtime gate.  Call run() to pass an output through the full
    3-step verification protocol (confidence → humanization → accuracy).

    Loop tracking is automatic.  On loop 3 failure an fvp_escalation ticket
    is auto-created and returned in FVPResult.escalation_ticket_id.
    All outcomes are logged to MPI and the FVP audit log.
    """

    def __init__(
        self,
        ticket_id: str,
        agent_id: str,
        task_type: str,
        vision_path: Optional[str] = None,
        acceptance_criteria: Optional[list] = None,
        model: Optional[str] = None,
    ):
        self.ticket_id = ticket_id
        self.agent_id = agent_id
        self.task_type = task_type
        self.vision_path = vision_path
        self.acceptance_criteria = acceptance_criteria or []
        self.model = model or "unknown"
        self.loop_records: list[LoopRecord] = []
        self._start_time = datetime.now(timezone.utc)

        # Ensure log dirs exist
        MPI_LOG.parent.mkdir(parents=True, exist_ok=True)
        FVP_AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)

    # ── Public entrypoint ────────────────────────────────────────────────────

    def run(self, output: str, confidence_score: int) -> FVPResult:
        """
        Run the full FVP protocol for a single output.

        Args:
            output:           The produced output text (code, copy, data, etc.)
            confidence_score: Self-assessed score 0–100 by producing agent.

        Returns:
            FVPResult — check .passed before using the output.
        """
        print(f"[FVP] Starting verification — ticket={self.ticket_id} agent={self.agent_id}")

        loop_count = len(self.loop_records) + 1
        record = LoopRecord(
            loop_number=loop_count,
            output=output,
            confidence_score=confidence_score,
            confidence_check="PENDING",
            humanization_check="PENDING",
            accuracy_check="PENDING",
            humanization_notes="",
            accuracy_notes="",
        )

        # ── Step 1: Confidence Check ─────────────────────────────────────────
        if confidence_score < CONFIDENCE_THRESHOLD:
            record.confidence_check = "FAIL"
            record.humanization_check = "SKIP"
            record.accuracy_check = "SKIP"
            record.humanization_notes = f"Skipped — confidence {confidence_score} < {CONFIDENCE_THRESHOLD}"
            record.accuracy_notes = "Skipped — confidence gate failed"
            self.loop_records.append(record)
            print(f"[FVP] Step 1 FAIL — confidence {confidence_score} < {CONFIDENCE_THRESHOLD}. Loop {loop_count}.")
            return self._handle_loop_failure(record)

        record.confidence_check = "PASS"
        print(f"[FVP] Step 1 PASS — confidence {confidence_score}")

        # ── Step 2: Humanization Check ───────────────────────────────────────
        hum_pass, hum_notes = self._run_humanization_check(output)
        record.humanization_check = "PASS" if hum_pass else "FAIL"
        record.humanization_notes = hum_notes

        if not hum_pass:
            record.accuracy_check = "SKIP"
            record.accuracy_notes = "Skipped — humanization check failed"
            self.loop_records.append(record)
            print(f"[FVP] Step 2 FAIL — humanization. Loop {loop_count}.")
            return self._handle_loop_failure(record)

        print(f"[FVP] Step 2 PASS — humanization")

        # ── Step 3: Accuracy / Vision Alignment Check ────────────────────────
        acc_pass, acc_notes = self._run_accuracy_check(output)
        record.accuracy_check = "PASS" if acc_pass else "FAIL"
        record.accuracy_notes = acc_notes
        self.loop_records.append(record)

        if not acc_pass:
            print(f"[FVP] Step 3 FAIL — accuracy. Loop {loop_count}.")
            return self._handle_loop_failure(record)

        print(f"[FVP] Step 3 PASS — accuracy. Output accepted.")

        # ── Acceptance ───────────────────────────────────────────────────────
        result = FVPResult(
            passed=True,
            loop_count=loop_count,
            confidence=confidence_score,
            humanization_passed=True,
            accuracy_passed=True,
            notes=f"FVP passed on loop {loop_count}. {hum_notes} {acc_notes}".strip(),
        )
        self._log_mpi(result)
        self._log_audit(result, record)
        return result

    # ── Internal helpers ─────────────────────────────────────────────────────

    def _handle_loop_failure(self, record: LoopRecord) -> FVPResult:
        """
        Called when any FVP step fails.  On loop 3 failure, escalates.
        Otherwise returns a FAIL result so the producing agent can retry.
        """
        loop_count = len(self.loop_records)

        if loop_count >= MAX_LOOPS:
            print(f"[FVP] Max loops ({MAX_LOOPS}) reached — escalating.")
            esc_id = self._create_escalation_ticket()
            result = FVPResult(
                passed=False,
                loop_count=loop_count,
                confidence=record.confidence_score,
                humanization_passed=(record.humanization_check == "PASS"),
                accuracy_passed=(record.accuracy_check == "PASS"),
                notes=f"FVP failed after {MAX_LOOPS} loops. Escalation ticket: {esc_id}.",
                escalation_ticket_id=esc_id,
            )
        else:
            result = FVPResult(
                passed=False,
                loop_count=loop_count,
                confidence=record.confidence_score,
                humanization_passed=(record.humanization_check == "PASS"),
                accuracy_passed=(record.accuracy_check == "PASS"),
                notes=(
                    f"FVP failed on loop {loop_count}. "
                    f"Confidence={record.confidence_check}, "
                    f"Humanization={record.humanization_check}, "
                    f"Accuracy={record.accuracy_check}. "
                    f"Retry with revised output."
                ),
            )

        self._log_mpi(result)
        self._log_audit(result, record)
        return result

    def _run_humanization_check(self, output: str) -> tuple[bool, str]:
        """
        Routes to DTP_ONXZA_Verification agent via ticket.
        Creates a verification_request ticket, then reads back the result.

        In the full wired-up runtime this creates a real ticket and waits
        for the verification agent's response.  This implementation writes
        the ticket and returns the result synchronously by reading the
        completed ticket file (assumes verification agent processes it).

        For automated/scripted flows where the verification agent is not
        live, falls back to rule-based heuristic checks.
        """
        ticket_path = self._create_verification_request_ticket(output, check_type="humanization")
        print(f"[FVP] Humanization check ticket created: {ticket_path.name}")

        # Attempt to read result back (if agent has already processed)
        result_path = self._wait_for_verification_result(ticket_path, timeout_seconds=5)
        if result_path:
            return self._parse_verification_result(result_path)

        # Fallback: rule-based heuristic humanization check
        return self._heuristic_humanization_check(output)

    def _run_accuracy_check(self, output: str) -> tuple[bool, str]:
        """
        Checks output against:
        1. vision.md alignment (if vision_path provided)
        2. acceptance criteria (if provided in constructor)

        Returns (passed: bool, notes: str)
        """
        issues = []

        # Vision alignment
        if self.vision_path:
            vision_full = BASE_DIR / self.vision_path
            if vision_full.exists():
                vision_text = vision_full.read_text().lower()
                # Basic keyword presence check — can be extended with LLM call
                key_terms = self._extract_vision_terms(vision_text)
                output_lower = output.lower()
                missed = [t for t in key_terms if t not in output_lower]
                if len(missed) > len(key_terms) * 0.5:
                    issues.append(
                        f"Output misses key vision terms: {', '.join(missed[:5])}"
                    )

        # Acceptance criteria check
        if self.acceptance_criteria:
            uncovered = []
            for criterion in self.acceptance_criteria:
                # Simple presence check: criterion keywords in output
                c_lower = criterion.lower()
                key_words = [w for w in c_lower.split() if len(w) > 4]
                matches = sum(1 for w in key_words if w in output.lower())
                if key_words and matches / len(key_words) < 0.3:
                    uncovered.append(criterion[:60])
            if uncovered:
                issues.append(
                    f"Acceptance criteria possibly not met: {'; '.join(uncovered[:3])}"
                )

        if issues:
            return False, " | ".join(issues)
        return True, "Vision alignment and acceptance criteria check passed."

    def _heuristic_humanization_check(self, output: str) -> tuple[bool, str]:
        """
        Rule-based fallback for humanization check when verification agent
        is not available.  Flags common AI tells.
        """
        ai_tells = [
            ("certainly!", "AI certainty tell"),
            ("absolutely!", "AI certainty tell"),
            ("of course!", "AI certainty tell"),
            ("as an ai", "direct AI self-reference"),
            ("as a language model", "AI self-reference"),
            ("i don't have personal", "AI self-reference"),
            ("i cannot provide", "AI hedge"),
            ("i must emphasize", "AI emphasis tell"),
            ("it's worth noting that", "filler phrase"),
            ("it is important to note", "filler phrase"),
            ("in conclusion, ", "AI essay structure"),
            ("in summary, ", "AI essay structure — leading summary"),
        ]

        found = []
        output_lower = output.lower()
        for phrase, label in ai_tells:
            if phrase in output_lower:
                found.append(f'"{phrase}" ({label})')

        # Check for unnaturally structured lists (e.g. 1. ... 2. ... 3. with no variation)
        import re
        numbered_items = re.findall(r'^\d+\.\s', output, re.MULTILINE)
        if len(numbered_items) > 8:
            found.append("excessive numbered list structure (>8 items)")

        if found:
            return False, f"AI tells detected: {'; '.join(found[:5])}"

        # Minimum length sanity
        if len(output.strip()) < 10:
            return False, "Output too short to evaluate"

        return True, "Heuristic humanization check passed (no AI tells detected)."

    def _create_verification_request_ticket(self, output: str, check_type: str) -> Path:
        """Creates a verification_request ticket for DTP_ONXZA_Verification."""
        ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        ticket_id = f"FVP-VR-{self.ticket_id}-{check_type.upper()}-{ts}"
        ticket_path = TICKETS_OPEN / f"{ticket_id}.md"

        loop_count = len(self.loop_records) + 1
        content = f"""---
id: {ticket_id}
type: verification_request
created_by: fvp-runtime
created_at: {datetime.now(timezone.utc).isoformat()}
assigned_to: dtp-onxza-verification
parent_ticket: {self.ticket_id}
check_type: {check_type}
loop_count: {loop_count}
status: open
---

## Verification Request

**Parent Ticket:** {self.ticket_id}
**Requesting Agent:** {self.agent_id}
**Check Type:** {check_type}
**FVP Loop:** {loop_count}

## Output to Verify

{output}

## Instructions

Run FVP Step 2 ({check_type} check) on the output above.
Return a verification_complete ticket with:
- result: PASS or FAIL
- confidence: 0–100
- notes: specific findings

*Auto-generated by FVP Runtime. Non-optional.*
"""
        ticket_path.write_text(content)
        return ticket_path

    def _wait_for_verification_result(self, request_ticket: Path, timeout_seconds: int = 5) -> Optional[Path]:
        """
        In a live system this would poll for the verification agent's response ticket.
        Currently returns None immediately (triggers heuristic fallback).
        TODO: Implement blocking wait with OpenClaw IPC when agent runtime is wired.
        """
        return None

    def _parse_verification_result(self, result_path: Path) -> tuple[bool, str]:
        """Parse a verification_complete ticket file."""
        content = result_path.read_text()
        passed = "result: PASS" in content or "**Result:** PASS" in content
        notes = ""
        for line in content.splitlines():
            if line.startswith("**Notes:**") or line.startswith("notes:"):
                notes = line.split(":", 1)[-1].strip()
                break
        return passed, notes or "Verification result parsed."

    def _extract_vision_terms(self, vision_text: str) -> list[str]:
        """Extract key terms from a vision document for alignment checking."""
        import re
        # Pull out meaningful words (>5 chars) from headings
        headings = re.findall(r'^#{1,3}\s+(.+)$', vision_text, re.MULTILINE)
        words = []
        for heading in headings:
            words += [w.strip('.,!?') for w in heading.lower().split() if len(w) > 5]
        return list(set(words))[:20]

    def _create_escalation_ticket(self) -> str:
        """
        Auto-creates an fvp_escalation ticket addressed to the producing
        agent's PM.  Includes full loop history.
        """
        ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        esc_id = f"FVP-ESC-{self.ticket_id}-{ts}"
        ticket_path = TICKETS_OPEN / f"{esc_id}.md"

        loop_summary = self._format_loop_history()
        elapsed = (datetime.now(timezone.utc) - self._start_time).total_seconds()

        content = f"""---
id: {esc_id}
type: fvp_escalation
created_by: fvp-runtime
created_at: {datetime.now(timezone.utc).isoformat()}
assigned_to: dtp-onxza-pm
parent_ticket: {self.ticket_id}
producing_agent: {self.agent_id}
loops_attempted: {MAX_LOOPS}
status: open
priority: high
---

## FVP Escalation — Max Loops Reached

The FVP runtime reached the maximum loop count ({MAX_LOOPS}) without acceptance.
Human or PM review required before this output can be used.

**Ticket:** {self.ticket_id}
**Producing Agent:** {self.agent_id}
**Task Type:** {self.task_type}
**Time Elapsed:** {elapsed:.0f}s

## Loop History

{loop_summary}

## Required Action

PM must decide one of:
1. **Retry** — Assign back to producing agent with specific guidance
2. **Escalate to Human** — Flag for Aaron / human review
3. **Accept with Flag** — Mark output as accepted-with-caveats and document

Update this ticket with decision before closing.

*Auto-generated by FVP Runtime. Non-optional. FVP cannot be bypassed.*

---
*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
Powered by DevGru US Inc. DBA DevGru Technology Products.*
"""
        ticket_path.write_text(content)
        print(f"[FVP] Escalation ticket created: {esc_id}")
        return esc_id

    def _format_loop_history(self) -> str:
        lines = []
        for r in self.loop_records:
            lines.append(f"""### Loop {r.loop_number} — {r.timestamp}
- Confidence: {r.confidence_score} → {r.confidence_check}
- Humanization: {r.humanization_check} — {r.humanization_notes}
- Accuracy: {r.accuracy_check} — {r.accuracy_notes}
""")
        return "\n".join(lines) if lines else "No loops recorded."

    def _log_mpi(self, result: FVPResult) -> None:
        """Log FVP outcome to MPI data file (JSONL)."""
        elapsed = (datetime.now(timezone.utc) - self._start_time).total_seconds()
        entry = {
            "timestamp": result.timestamp,
            "ticket_id": self.ticket_id,
            "agent_id": self.agent_id,
            "model": self.model,
            "task_type": self.task_type,
            "fvp_passed": result.passed,
            "confidence_score": result.confidence,
            "loop_count": result.loop_count,
            "humanization_passed": result.humanization_passed,
            "accuracy_passed": result.accuracy_passed,
            "escalation_ticket": result.escalation_ticket_id,
            "elapsed_seconds": round(elapsed, 1),
            "notes": result.notes,
        }
        with open(MPI_LOG, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def _log_audit(self, result: FVPResult, last_record: LoopRecord) -> None:
        """Log FVP audit trail entry."""
        entry = {
            "timestamp": result.timestamp,
            "ticket_id": self.ticket_id,
            "agent_id": self.agent_id,
            "total_loops": result.loop_count,
            "passed": result.passed,
            "loop_history": [
                {
                    "loop": r.loop_number,
                    "confidence": r.confidence_score,
                    "confidence_check": r.confidence_check,
                    "humanization": r.humanization_check,
                    "accuracy": r.accuracy_check,
                }
                for r in self.loop_records
            ],
            "escalation": result.escalation_ticket_id,
        }
        with open(FVP_AUDIT_LOG, "a") as f:
            f.write(json.dumps(entry) + "\n")


# ── Convenience function ─────────────────────────────────────────────────────

def run_fvp(
    output: str,
    confidence_score: int,
    ticket_id: str,
    agent_id: str,
    task_type: str,
    vision_path: Optional[str] = None,
    acceptance_criteria: Optional[list] = None,
    model: Optional[str] = None,
) -> FVPResult:
    """
    One-call convenience wrapper.  Creates an FVPRuntime and runs it.

    Example:
        result = run_fvp(
            output="My blog post...",
            confidence_score=84,
            ticket_id="TICKET-20260318-WDC-001",
            agent_id="WDC_Content_BlogWriter",
            task_type="blog_post",
        )
        if result.passed:
            submit_output(result)
        else:
            revise_and_retry(result.notes)
    """
    fvp = FVPRuntime(
        ticket_id=ticket_id,
        agent_id=agent_id,
        task_type=task_type,
        vision_path=vision_path,
        acceptance_criteria=acceptance_criteria,
        model=model,
    )
    return fvp.run(output=output, confidence_score=confidence_score)


# ── CLI entrypoint ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="FVP Runtime CLI — run verification on a text file output"
    )
    parser.add_argument("--output-file", required=True, help="Path to output file to verify")
    parser.add_argument("--confidence", type=int, required=True, help="Self-assessed confidence score 0–100")
    parser.add_argument("--ticket-id", required=True, help="Parent ticket ID")
    parser.add_argument("--agent-id", required=True, help="Producing agent ID")
    parser.add_argument("--task-type", required=True, help="Task type (e.g. blog_post, code, documentation)")
    parser.add_argument("--vision-path", help="Relative path to vision.md from workspace root")
    parser.add_argument("--criteria", nargs="*", help="Acceptance criteria strings")
    parser.add_argument("--model", help="Model used by producing agent")
    args = parser.parse_args()

    output_text = Path(args.output_file).read_text()

    result = run_fvp(
        output=output_text,
        confidence_score=args.confidence,
        ticket_id=args.ticket_id,
        agent_id=args.agent_id,
        task_type=args.task_type,
        vision_path=args.vision_path,
        acceptance_criteria=args.criteria,
        model=args.model,
    )

    print("\n" + "="*60)
    print(f"FVP RESULT: {'✅ PASSED' if result.passed else '❌ FAILED'}")
    print(f"Loops used: {result.loop_count}/{MAX_LOOPS}")
    print(f"Confidence: {result.confidence}")
    print(f"Humanization: {'PASS' if result.humanization_passed else 'FAIL'}")
    print(f"Accuracy:     {'PASS' if result.accuracy_passed else 'FAIL'}")
    print(f"Notes: {result.notes}")
    if result.escalation_ticket_id:
        print(f"Escalation: {result.escalation_ticket_id}")
    print("="*60)

    sys.exit(0 if result.passed else 1)

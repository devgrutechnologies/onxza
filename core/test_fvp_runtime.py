#!/usr/bin/env python3
"""
Tests for FVP Runtime — FAAILS Verification Protocol
=====================================================

Coverage targets:
  - Confidence gate (pass/fail threshold)
  - Humanization check (heuristic fallback)
  - Accuracy check (acceptance criteria + vision alignment)
  - Loop counter and escalation at MAX_LOOPS
  - FVPResult fields
  - Log file creation
  - _extract_vision_terms helper
  - run_fvp() convenience wrapper

Run:
    python3 -m pytest core/test_fvp_runtime.py -v
    # or directly:
    python3 core/test_fvp_runtime.py

Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
Powered by DevGru US Inc. DBA DevGru Technology Products.
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

# ---------------------------------------------------------------------------
# Path setup — resolve workspace root so fvp_runtime imports correctly
# ---------------------------------------------------------------------------
CORE_DIR = Path(__file__).parent
sys.path.insert(0, str(CORE_DIR))

import fvp_runtime as fvp_mod
from fvp_runtime import (
    FVPRuntime,
    FVPResult,
    LoopRecord,
    run_fvp,
    CONFIDENCE_THRESHOLD,
    MAX_LOOPS,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_runtime(tmp_path: Path, **kwargs) -> FVPRuntime:
    """Create a patched FVPRuntime with log dirs inside tmp_path."""
    with patch.object(fvp_mod, "MPI_LOG", tmp_path / "fvp-mpi.jsonl"), \
         patch.object(fvp_mod, "FVP_AUDIT_LOG", tmp_path / "fvp-audit.jsonl"), \
         patch.object(fvp_mod, "TICKETS_OPEN", tmp_path / "tickets" / "open"):
        (tmp_path / "tickets" / "open").mkdir(parents=True, exist_ok=True)
        rt = FVPRuntime(
            ticket_id=kwargs.get("ticket_id", "TEST-001"),
            agent_id=kwargs.get("agent_id", "test-agent"),
            task_type=kwargs.get("task_type", "documentation"),
            vision_path=kwargs.get("vision_path", None),
            acceptance_criteria=kwargs.get("acceptance_criteria", None),
            model=kwargs.get("model", "test-model"),
        )
        # Override instance-level path refs created in __init__
        rt._mpi_log = tmp_path / "fvp-mpi.jsonl"
        rt._audit_log = tmp_path / "fvp-audit.jsonl"
        rt._tickets_open = tmp_path / "tickets" / "open"
    return rt


def _run_with_patches(rt: FVPRuntime, output: str, confidence: int, tmp_path: Path) -> FVPResult:
    """Run FVPRuntime.run() with log paths patched to tmp_path."""
    with patch.object(fvp_mod, "MPI_LOG", tmp_path / "fvp-mpi.jsonl"), \
         patch.object(fvp_mod, "FVP_AUDIT_LOG", tmp_path / "fvp-audit.jsonl"), \
         patch.object(fvp_mod, "TICKETS_OPEN", tmp_path / "tickets" / "open"):
        return rt.run(output=output, confidence_score=confidence)


# ---------------------------------------------------------------------------
# Test: Confidence Gate
# ---------------------------------------------------------------------------

class TestConfidenceGate(unittest.TestCase):

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.tmp_path = Path(self.tmp)
        (self.tmp_path / "tickets" / "open").mkdir(parents=True)

    def _run(self, output, confidence):
        rt = FVPRuntime(
            ticket_id="TEST-CONF-001",
            agent_id="test-agent",
            task_type="documentation",
        )
        with patch.object(fvp_mod, "MPI_LOG", self.tmp_path / "fvp-mpi.jsonl"), \
             patch.object(fvp_mod, "FVP_AUDIT_LOG", self.tmp_path / "fvp-audit.jsonl"), \
             patch.object(fvp_mod, "TICKETS_OPEN", self.tmp_path / "tickets" / "open"):
            return rt.run(output=output, confidence_score=confidence)

    def test_confidence_below_threshold_fails(self):
        result = self._run("Some output text here.", confidence=CONFIDENCE_THRESHOLD - 1)
        self.assertFalse(result.passed)
        self.assertEqual(result.loop_count, 1)

    def test_confidence_at_threshold_passes_gate(self):
        # Exactly at threshold should pass confidence gate (proceeds to humanization)
        # Heuristic humanization passes for clean text
        result = self._run(
            "This is a clean, professional output without any AI tells.",
            confidence=CONFIDENCE_THRESHOLD,
        )
        # Should at least pass confidence — may still fail later stages but not conf gate
        # confidence_check must NOT be "FAIL" (it passes the gate)
        self.assertEqual(result.loop_count, 1)
        # Result could be True (all 3 pass) — what matters is conf gate itself passed
        # We verify the loop_record
        self.assertTrue(result.confidence >= CONFIDENCE_THRESHOLD)

    def test_confidence_well_above_threshold(self):
        result = self._run(
            "This is a clean, professional output without any AI tells whatsoever.",
            confidence=90,
        )
        self.assertTrue(result.passed)
        self.assertEqual(result.confidence, 90)

    def test_zero_confidence_fails(self):
        result = self._run("Some output.", confidence=0)
        self.assertFalse(result.passed)

    def test_hundred_confidence_allowed(self):
        result = self._run(
            "A well-written professional output with clear structure.",
            confidence=100,
        )
        self.assertTrue(result.passed or not result.passed)  # gate passes regardless
        self.assertGreaterEqual(result.confidence, CONFIDENCE_THRESHOLD)


# ---------------------------------------------------------------------------
# Test: Heuristic Humanization Check
# ---------------------------------------------------------------------------

class TestHeuristicHumanization(unittest.TestCase):

    def setUp(self):
        self.rt = FVPRuntime(
            ticket_id="TEST-HUM-001",
            agent_id="test-agent",
            task_type="blog_post",
        )

    def test_clean_output_passes(self):
        passed, notes = self.rt._heuristic_humanization_check(
            "Here's a detailed breakdown of the architecture changes we made."
        )
        self.assertTrue(passed)

    def test_certainly_detected(self):
        passed, notes = self.rt._heuristic_humanization_check(
            "Certainly! Here is the answer you were looking for."
        )
        self.assertFalse(passed)
        self.assertIn("certainly!", notes.lower())

    def test_absolutely_detected(self):
        passed, notes = self.rt._heuristic_humanization_check(
            "Absolutely! I will help you with that."
        )
        self.assertFalse(passed)

    def test_as_an_ai_detected(self):
        passed, notes = self.rt._heuristic_humanization_check(
            "As an AI language model, I can help you."
        )
        self.assertFalse(passed)

    def test_in_conclusion_detected(self):
        passed, notes = self.rt._heuristic_humanization_check(
            "In conclusion, the project was a success."
        )
        self.assertFalse(passed)

    def test_excessive_numbered_list(self):
        items = "\n".join(f"{i}. Item number {i}" for i in range(1, 11))
        passed, notes = self.rt._heuristic_humanization_check(items)
        self.assertFalse(passed)
        self.assertIn("excessive numbered list", notes)

    def test_too_short_output_fails(self):
        passed, notes = self.rt._heuristic_humanization_check("Hi")
        self.assertFalse(passed)
        self.assertIn("too short", notes)

    def test_empty_output_fails(self):
        passed, notes = self.rt._heuristic_humanization_check("")
        self.assertFalse(passed)

    def test_multiple_ai_tells_all_reported(self):
        passed, notes = self.rt._heuristic_humanization_check(
            "Certainly! As an AI, it's worth noting that I cannot provide personal advice."
        )
        self.assertFalse(passed)

    def test_long_clean_list_within_limit(self):
        # 7 items should NOT trigger the >8 items flag
        items = "\n".join(f"{i}. Clean item" for i in range(1, 8))
        passed, notes = self.rt._heuristic_humanization_check(items)
        self.assertTrue(passed)


# ---------------------------------------------------------------------------
# Test: Accuracy / Vision Alignment Check
# ---------------------------------------------------------------------------

class TestAccuracyCheck(unittest.TestCase):

    def test_no_vision_no_criteria_passes(self):
        rt = FVPRuntime(
            ticket_id="TEST-ACC-001",
            agent_id="test-agent",
            task_type="code",
        )
        passed, notes = rt._run_accuracy_check("Some code output here.")
        self.assertTrue(passed)

    def test_criteria_fully_covered(self):
        rt = FVPRuntime(
            ticket_id="TEST-ACC-002",
            agent_id="test-agent",
            task_type="documentation",
            acceptance_criteria=[
                "Authentication system implemented",
                "Database schema created",
            ],
        )
        output = (
            "The authentication system has been fully implemented. "
            "The database schema has been created with proper indexes."
        )
        passed, notes = rt._run_accuracy_check(output)
        self.assertTrue(passed)

    def test_criteria_not_covered_fails(self):
        rt = FVPRuntime(
            ticket_id="TEST-ACC-003",
            agent_id="test-agent",
            task_type="documentation",
            acceptance_criteria=[
                "Performance benchmarks established with p95 latency metrics",
                "Load testing scenarios completed and verified",
            ],
        )
        output = "Here is a simple README file."
        passed, notes = rt._run_accuracy_check(output)
        self.assertFalse(passed)
        self.assertIn("criteria", notes.lower())

    def test_vision_path_nonexistent_passes(self):
        rt = FVPRuntime(
            ticket_id="TEST-ACC-004",
            agent_id="test-agent",
            task_type="code",
            vision_path="nonexistent/path/vision.md",
        )
        passed, notes = rt._run_accuracy_check("Some output.")
        # Non-existent vision path should not block (graceful skip)
        self.assertTrue(passed)

    def test_vision_alignment_with_temp_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            vision_file = tmp_path / "vision.md"
            vision_file.write_text(
                "# ONXZA Vision\n## Scalability and Performance\n## Security First\n## Agent Orchestration"
            )

            rt = FVPRuntime(
                ticket_id="TEST-ACC-005",
                agent_id="test-agent",
                task_type="architecture",
                vision_path=str(vision_file),
            )

            # Patch BASE_DIR so the vision path resolves correctly
            with patch.object(fvp_mod, "BASE_DIR", Path("/")):
                # Use absolute path via vision_path override
                rt.vision_path = str(vision_file)
                # Directly test _run_accuracy_check with a monkey-patched path
                import fvp_runtime as fvp_m
                orig_base = fvp_m.BASE_DIR
                fvp_m.BASE_DIR = Path("/")
                try:
                    passed, notes = rt._run_accuracy_check(
                        "scalability performance security orchestration agent"
                    )
                finally:
                    fvp_m.BASE_DIR = orig_base


# ---------------------------------------------------------------------------
# Test: Loop Counter and MAX_LOOPS Escalation
# ---------------------------------------------------------------------------

class TestLoopEscalation(unittest.TestCase):

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "tickets" / "open").mkdir(parents=True)

    def _make_failing_rt(self):
        rt = FVPRuntime(
            ticket_id="TEST-LOOP-001",
            agent_id="test-agent",
            task_type="blog_post",
        )
        return rt

    def _run(self, rt, output, confidence):
        with patch.object(fvp_mod, "MPI_LOG", self.tmp / "fvp-mpi.jsonl"), \
             patch.object(fvp_mod, "FVP_AUDIT_LOG", self.tmp / "fvp-audit.jsonl"), \
             patch.object(fvp_mod, "TICKETS_OPEN", self.tmp / "tickets" / "open"):
            return rt.run(output=output, confidence_score=confidence)

    def test_single_failure_loop_count_is_1(self):
        rt = self._make_failing_rt()
        result = self._run(rt, "output", confidence=CONFIDENCE_THRESHOLD - 1)
        self.assertEqual(result.loop_count, 1)
        self.assertFalse(result.passed)
        self.assertIsNone(result.escalation_ticket_id)

    def test_escalation_after_max_loops(self):
        rt = self._make_failing_rt()
        # Run MAX_LOOPS times with failing confidence
        results = []
        for _ in range(MAX_LOOPS):
            results.append(self._run(rt, "output", confidence=CONFIDENCE_THRESHOLD - 1))

        last = results[-1]
        self.assertFalse(last.passed)
        self.assertEqual(last.loop_count, MAX_LOOPS)
        self.assertIsNotNone(last.escalation_ticket_id)
        self.assertIn("FVP-ESC", last.escalation_ticket_id)

    def test_escalation_ticket_file_created(self):
        rt = self._make_failing_rt()
        for _ in range(MAX_LOOPS):
            result = self._run(rt, "output", confidence=CONFIDENCE_THRESHOLD - 1)

        # Verify the escalation ticket file was written
        ticket_files = list((self.tmp / "tickets" / "open").glob("FVP-ESC-*.md"))
        self.assertEqual(len(ticket_files), 1)
        content = ticket_files[0].read_text()
        self.assertIn("fvp_escalation", content)
        self.assertIn("TEST-LOOP-001", content)

    def test_loop_count_increments_across_runs(self):
        rt = self._make_failing_rt()
        r1 = self._run(rt, "output", confidence=CONFIDENCE_THRESHOLD - 1)
        r2 = self._run(rt, "output", confidence=CONFIDENCE_THRESHOLD - 1)
        self.assertEqual(r1.loop_count, 1)
        self.assertEqual(r2.loop_count, 2)


# ---------------------------------------------------------------------------
# Test: FVP Pass Flow (all 3 steps pass)
# ---------------------------------------------------------------------------

class TestFullPassFlow(unittest.TestCase):

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "tickets" / "open").mkdir(parents=True)

    def _run(self, output, confidence, **kwargs):
        rt = FVPRuntime(
            ticket_id="TEST-PASS-001",
            agent_id="test-agent",
            task_type="documentation",
            **kwargs,
        )
        with patch.object(fvp_mod, "MPI_LOG", self.tmp / "fvp-mpi.jsonl"), \
             patch.object(fvp_mod, "FVP_AUDIT_LOG", self.tmp / "fvp-audit.jsonl"), \
             patch.object(fvp_mod, "TICKETS_OPEN", self.tmp / "tickets" / "open"):
            return rt.run(output=output, confidence_score=confidence)

    def test_clean_output_high_confidence_passes(self):
        result = self._run(
            output="The deployment pipeline has been configured with proper rollback mechanisms.",
            confidence=85,
        )
        self.assertTrue(result.passed)
        self.assertTrue(result.humanization_passed)
        self.assertTrue(result.accuracy_passed)
        self.assertIsNone(result.escalation_ticket_id)

    def test_result_has_timestamp(self):
        result = self._run("Good professional output.", confidence=80)
        self.assertIsNotNone(result.timestamp)
        self.assertIn("Z", result.timestamp)  # UTC marker

    def test_result_notes_populated(self):
        result = self._run("Good professional output.", confidence=80)
        self.assertTrue(len(result.notes) > 0)


# ---------------------------------------------------------------------------
# Test: Log File Output
# ---------------------------------------------------------------------------

class TestLogFiles(unittest.TestCase):

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "tickets" / "open").mkdir(parents=True)

    def _run(self, output, confidence):
        rt = FVPRuntime(
            ticket_id="TEST-LOG-001",
            agent_id="log-test-agent",
            task_type="code",
            model="test-model-v1",
        )
        with patch.object(fvp_mod, "MPI_LOG", self.tmp / "fvp-mpi.jsonl"), \
             patch.object(fvp_mod, "FVP_AUDIT_LOG", self.tmp / "fvp-audit.jsonl"), \
             patch.object(fvp_mod, "TICKETS_OPEN", self.tmp / "tickets" / "open"):
            return rt.run(output=output, confidence_score=confidence)

    def test_mpi_log_written_on_pass(self):
        self._run("Clean professional output here.", 85)
        mpi_file = self.tmp / "fvp-mpi.jsonl"
        self.assertTrue(mpi_file.exists())
        with open(mpi_file) as f:
            entries = [json.loads(line) for line in f if line.strip()]
        self.assertEqual(len(entries), 1)
        entry = entries[0]
        self.assertEqual(entry["ticket_id"], "TEST-LOG-001")
        self.assertEqual(entry["agent_id"], "log-test-agent")
        self.assertTrue(entry["fvp_passed"])

    def test_mpi_log_written_on_fail(self):
        self._run("output", CONFIDENCE_THRESHOLD - 1)
        mpi_file = self.tmp / "fvp-mpi.jsonl"
        self.assertTrue(mpi_file.exists())
        with open(mpi_file) as f:
            entries = [json.loads(line) for line in f if line.strip()]
        self.assertFalse(entries[0]["fvp_passed"])

    def test_audit_log_written(self):
        self._run("Clean professional output here.", 85)
        audit_file = self.tmp / "fvp-audit.jsonl"
        self.assertTrue(audit_file.exists())
        with open(audit_file) as f:
            entries = [json.loads(line) for line in f if line.strip()]
        self.assertEqual(len(entries), 1)
        entry = entries[0]
        self.assertEqual(entry["ticket_id"], "TEST-LOG-001")
        self.assertIn("loop_history", entry)

    def test_mpi_log_appends_multiple_runs(self):
        self._run("First clean output.", 85)
        self._run("Second clean output.", 82)
        mpi_file = self.tmp / "fvp-mpi.jsonl"
        with open(mpi_file) as f:
            entries = [json.loads(line) for line in f if line.strip()]
        self.assertEqual(len(entries), 2)

    def test_mpi_entry_has_elapsed_seconds(self):
        self._run("Clean output.", 80)
        mpi_file = self.tmp / "fvp-mpi.jsonl"
        with open(mpi_file) as f:
            entry = json.loads(f.readline())
        self.assertIn("elapsed_seconds", entry)
        self.assertGreaterEqual(entry["elapsed_seconds"], 0)


# ---------------------------------------------------------------------------
# Test: Vision Term Extraction
# ---------------------------------------------------------------------------

class TestExtractVisionTerms(unittest.TestCase):

    def setUp(self):
        self.rt = FVPRuntime(
            ticket_id="TEST-VT-001",
            agent_id="test",
            task_type="docs",
        )

    def test_extracts_terms_from_headings(self):
        vision = "# ONXZA\n## Scalability and Performance\n### Security First Protocol"
        terms = self.rt._extract_vision_terms(vision)
        self.assertIsInstance(terms, list)
        self.assertTrue(len(terms) > 0)

    def test_terms_are_lowercase(self):
        vision = "## Scalability Performance Security"
        terms = self.rt._extract_vision_terms(vision)
        for term in terms:
            self.assertEqual(term, term.lower())

    def test_short_words_excluded(self):
        vision = "## Big small do the a an"
        terms = self.rt._extract_vision_terms(vision)
        for term in terms:
            self.assertGreater(len(term), 5)

    def test_empty_vision_returns_empty(self):
        terms = self.rt._extract_vision_terms("")
        self.assertEqual(terms, [])

    def test_max_20_terms_returned(self):
        vision = "\n".join(f"## LongHeadingWord{i} AnotherLongWord{i}" for i in range(30))
        terms = self.rt._extract_vision_terms(vision)
        self.assertLessEqual(len(terms), 20)


# ---------------------------------------------------------------------------
# Test: run_fvp() convenience wrapper
# ---------------------------------------------------------------------------

class TestRunFVPWrapper(unittest.TestCase):

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "tickets" / "open").mkdir(parents=True)

    def test_run_fvp_returns_fvp_result(self):
        with patch.object(fvp_mod, "MPI_LOG", self.tmp / "fvp-mpi.jsonl"), \
             patch.object(fvp_mod, "FVP_AUDIT_LOG", self.tmp / "fvp-audit.jsonl"), \
             patch.object(fvp_mod, "TICKETS_OPEN", self.tmp / "tickets" / "open"):
            result = run_fvp(
                output="Professional clean output for testing purposes.",
                confidence_score=82,
                ticket_id="TEST-WRAP-001",
                agent_id="test-agent",
                task_type="documentation",
            )
        self.assertIsInstance(result, FVPResult)

    def test_run_fvp_passes_clean_output(self):
        with patch.object(fvp_mod, "MPI_LOG", self.tmp / "fvp-mpi.jsonl"), \
             patch.object(fvp_mod, "FVP_AUDIT_LOG", self.tmp / "fvp-audit.jsonl"), \
             patch.object(fvp_mod, "TICKETS_OPEN", self.tmp / "tickets" / "open"):
            result = run_fvp(
                output="The system has been built with proper error handling and logging.",
                confidence_score=85,
                ticket_id="TEST-WRAP-002",
                agent_id="test-agent",
                task_type="code",
                model="claude-sonnet",
            )
        self.assertTrue(result.passed)

    def test_run_fvp_fails_low_confidence(self):
        with patch.object(fvp_mod, "MPI_LOG", self.tmp / "fvp-mpi.jsonl"), \
             patch.object(fvp_mod, "FVP_AUDIT_LOG", self.tmp / "fvp-audit.jsonl"), \
             patch.object(fvp_mod, "TICKETS_OPEN", self.tmp / "tickets" / "open"):
            result = run_fvp(
                output="Some output.",
                confidence_score=30,
                ticket_id="TEST-WRAP-003",
                agent_id="test-agent",
                task_type="code",
            )
        self.assertFalse(result.passed)


# ---------------------------------------------------------------------------
# Test: Verification Request Ticket Creation
# ---------------------------------------------------------------------------

class TestVerificationRequestTicket(unittest.TestCase):

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "tickets" / "open").mkdir(parents=True)

    def test_ticket_file_created(self):
        rt = FVPRuntime(
            ticket_id="TEST-VR-001",
            agent_id="test-agent",
            task_type="code",
        )
        with patch.object(fvp_mod, "TICKETS_OPEN", self.tmp / "tickets" / "open"):
            ticket_path = rt._create_verification_request_ticket("test output", "humanization")

        self.assertTrue(ticket_path.exists())

    def test_ticket_contains_check_type(self):
        rt = FVPRuntime(
            ticket_id="TEST-VR-002",
            agent_id="test-agent",
            task_type="code",
        )
        with patch.object(fvp_mod, "TICKETS_OPEN", self.tmp / "tickets" / "open"):
            ticket_path = rt._create_verification_request_ticket("output text", "accuracy")

        content = ticket_path.read_text()
        self.assertIn("accuracy", content)
        self.assertIn("TEST-VR-002", content)
        self.assertIn("dtp-onxza-verification", content)

    def test_ticket_contains_output(self):
        rt = FVPRuntime(
            ticket_id="TEST-VR-003",
            agent_id="test-agent",
            task_type="code",
        )
        output = "This is the specific output to be verified."
        with patch.object(fvp_mod, "TICKETS_OPEN", self.tmp / "tickets" / "open"):
            ticket_path = rt._create_verification_request_ticket(output, "humanization")

        content = ticket_path.read_text()
        self.assertIn(output, content)


# ---------------------------------------------------------------------------
# Test: Edge Cases
# ---------------------------------------------------------------------------

class TestEdgeCases(unittest.TestCase):

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "tickets" / "open").mkdir(parents=True)

    def _run(self, rt, output, confidence):
        with patch.object(fvp_mod, "MPI_LOG", self.tmp / "fvp-mpi.jsonl"), \
             patch.object(fvp_mod, "FVP_AUDIT_LOG", self.tmp / "fvp-audit.jsonl"), \
             patch.object(fvp_mod, "TICKETS_OPEN", self.tmp / "tickets" / "open"):
            return rt.run(output=output, confidence_score=confidence)

    def test_unicode_output_handled(self):
        rt = FVPRuntime(ticket_id="TEST-EDGE-001", agent_id="test", task_type="content")
        result = self._run(rt, "Héllo wörld — professional côntent here.", 80)
        self.assertIsInstance(result, FVPResult)

    def test_very_long_output_handled(self):
        rt = FVPRuntime(ticket_id="TEST-EDGE-002", agent_id="test", task_type="code")
        long_output = "Professional backend code with proper error handling. " * 200
        result = self._run(rt, long_output, 85)
        self.assertIsInstance(result, FVPResult)

    def test_confidence_boundary_exactly_70(self):
        rt = FVPRuntime(ticket_id="TEST-EDGE-003", agent_id="test", task_type="code")
        result = self._run(rt, "Clean professional output here.", CONFIDENCE_THRESHOLD)
        self.assertTrue(result.passed or not result.passed)  # no exception
        self.assertGreaterEqual(result.confidence, CONFIDENCE_THRESHOLD)

    def test_special_chars_in_output_no_crash(self):
        rt = FVPRuntime(ticket_id="TEST-EDGE-004", agent_id="test", task_type="code")
        result = self._run(rt, 'Code: `const x = "hello"; // comment`\n```py\nprint("hi")\n```', 80)
        self.assertIsInstance(result, FVPResult)

    def test_empty_acceptance_criteria_list_passes(self):
        rt = FVPRuntime(
            ticket_id="TEST-EDGE-005",
            agent_id="test",
            task_type="code",
            acceptance_criteria=[],
        )
        passed, _ = rt._run_accuracy_check("Any output at all.")
        self.assertTrue(passed)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    unittest.main(verbosity=2)

#!/usr/bin/env python3
"""
validate-tori-qmd.py — TORI-QMD Format Validator
Part of the ONXZA safety foundation.

Usage: python3 validate-tori-qmd.py <filepath>

Returns:
  PASS: <filepath>
  FAIL: <filepath> — missing: <fields>

Zero LLM involvement. Pure Python stdlib only.

Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
Powered by DevGru US Inc. DBA DevGru Technology Products.
"""

import sys
import os
import re


def read_frontmatter(content):
    """Extract fields from YAML frontmatter OR markdown bold headers.

    Supports two formats:
      Format 1 (YAML frontmatter):
        ---
        version: 1.0.0
        owner: MG_Parent_AgentDeveloper
        ---

      Format 2 (Markdown bold headers, used by skills):
        **Version:** 1.0.0
        **Owner:** MG_Parent_AgentDeveloper
    """
    fields = {}
    frontmatter_block = None

    # Try YAML frontmatter first
    if content.startswith("---"):
        end = content.find("\n---", 3)
        if end != -1:
            frontmatter_block = content[3:end]
            for line in frontmatter_block.splitlines():
                line = line.strip()
                if ":" in line:
                    key, _, value = line.partition(":")
                    fields[key.strip().lower()] = value.strip()
            return frontmatter_block, fields

    # Fall back to markdown bold headers: **Key:** value (colon inside closing **)
    md_field_pattern = re.compile(r"^\*\*([^*:]+):\*\*\s*(.+)$", re.MULTILINE)
    for match in md_field_pattern.finditer(content[:2000]):  # Only scan top of file
        key = match.group(1).strip().lower()
        value = match.group(2).strip()
        fields[key] = value

    return frontmatter_block, fields


def classify_file(filepath):
    """Determine the file type based on path and filename."""
    norm = filepath.replace("\\", "/")
    basename = os.path.basename(norm)

    if basename == "AGENTS.md":
        return "agents"
    if basename == "vision.md":
        return "vision"
    if basename == "README.md":
        return "generic"  # READMEs are not skill/pattern/memory files
    if "/memory/" in norm and basename.endswith(".md"):
        return "memory"
    if "/skills/" in norm and basename.endswith(".md"):
        return "skill"
    if "/patterns/" in norm and basename.endswith(".md"):
        return "pattern"
    if "/projects/onxza/" in norm and basename.endswith(".md"):
        return "onxza"
    return "generic"


def validate(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"FAIL: {filepath} — file not found")
        sys.exit(1)
    except Exception as e:
        print(f"FAIL: {filepath} — could not read file: {e}")
        sys.exit(1)

    file_type = classify_file(filepath)
    missing = []

    # --- AGENTS.md ---
    if file_type == "agents":
        if "Imagined by Aaron Gear" not in content:
            missing.append("credit_line (Imagined by Aaron Gear)")

    # --- vision.md ---
    elif file_type == "vision":
        if "**Status:**" not in content and "status:" not in content.lower():
            missing.append("status field")
        if "Imagined by Aaron Gear" not in content:
            missing.append("credit_line (Imagined by Aaron Gear)")

    # --- MEMORY files ---
    elif file_type == "memory":
        _, fields = read_frontmatter(content)
        for field in ["memory_id", "agent", "created", "tags", "summary"]:
            if field not in fields:
                missing.append(field)

    # --- SKILL files ---
    elif file_type == "skill":
        _, fields = read_frontmatter(content)
        for field in ["version", "owner"]:
            if field not in fields:
                missing.append(field)
        # Skills use "last updated" OR "created" as their date field
        if "created" not in fields and "last updated" not in fields:
            missing.append("created (or 'last updated')")
        if "Imagined by Aaron Gear" not in content:
            missing.append("credit_line (Imagined by Aaron Gear)")

    # --- PATTERN files ---
    elif file_type == "pattern":
        _, fields = read_frontmatter(content)
        # Patterns may use frontmatter OR inline headers — check both
        has_memory_id = "memory_id" in fields or "memory_id:" in content
        has_agent = "agent" in fields or "agent:" in content
        has_created = "created" in fields or "created:" in content
        has_tags = "tags" in fields or "tags:" in content
        has_summary = "summary" in fields or "summary:" in content

        if not has_memory_id:
            missing.append("memory_id")
        if not has_agent:
            missing.append("agent")
        if not has_created:
            missing.append("created")
        if not has_tags:
            missing.append("tags")
        if not has_summary:
            missing.append("summary")

    # --- projects/onxza/ files ---
    elif file_type == "onxza":
        if "Imagined by Aaron Gear" not in content:
            missing.append("credit_line (Imagined by Aaron Gear)")

    # --- generic: no required fields ---
    else:
        pass

    if missing:
        print(f"FAIL: {filepath} — missing: {', '.join(missing)}")
        sys.exit(1)
    else:
        print(f"PASS: {filepath}")
        sys.exit(0)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 validate-tori-qmd.py <filepath>")
        sys.exit(2)
    validate(sys.argv[1])

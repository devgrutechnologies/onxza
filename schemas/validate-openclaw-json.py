#!/usr/bin/env python3
"""
Validate openclaw.json against the official ONXZA schema.
Usage: python3 validate-openclaw-json.py [path-to-openclaw.json]
"""

import json
import sys
import os
from pathlib import Path

try:
    from jsonschema import validate, ValidationError, Draft202012Validator
except ImportError:
    print("ERROR: jsonschema not installed. Run: pip3 install jsonschema")
    sys.exit(2)

SCHEMA_PATH = Path(__file__).parent / "openclaw.schema.json"

def load_json(path):
    with open(path, "r") as f:
        return json.load(f)

def validate_openclaw_json(file_path):
    errors = []
    warnings = []

    # Step 1: Parse JSON
    try:
        data = load_json(file_path)
        print("✓ JSON syntax valid")
    except json.JSONDecodeError as e:
        print(f"✗ JSON syntax error: {e}")
        return 1

    # Step 2: Check $schemaVersion
    schema_version = data.get("$schemaVersion")
    if not schema_version:
        warnings.append("No $schemaVersion found. Treating as pre-schema (0.0.0). Run 'onxza config migrate' to upgrade.")
        print(f"⚠ {warnings[-1]}")
    else:
        print(f"✓ Schema version: {schema_version}")

    # Step 3: Schema validation
    try:
        schema = load_json(SCHEMA_PATH)
    except FileNotFoundError:
        print(f"✗ Schema file not found: {SCHEMA_PATH}")
        return 2

    # For pre-schema files, add $schemaVersion temporarily for validation
    test_data = dict(data)
    if not schema_version:
        test_data["$schemaVersion"] = "0.0.0"

    validator = Draft202012Validator(schema)
    schema_errors = sorted(validator.iter_errors(test_data), key=lambda e: list(e.path))

    if schema_errors:
        print(f"✗ Schema validation: {len(schema_errors)} error(s)")
        for err in schema_errors:
            path = ".".join(str(p) for p in err.path) or "(root)"
            print(f"  → {path}: {err.message}")
            errors.append(err.message)
    else:
        print("✓ Schema validation passed (0 errors)")

    # Step 4: Referential integrity
    agents_list = data.get("agents", {}).get("list", [])
    companies_list = data.get("companies", {}).get("list", [])
    company_slugs = {c.get("slug") for c in companies_list}
    agent_count = len(agents_list)

    agents_with_company = [a for a in agents_list if a.get("company")]
    if companies_list:
        orphans = [a["id"] for a in agents_with_company if a.get("company") not in company_slugs]
        if orphans:
            for orphan in orphans:
                errors.append(f"Agent '{orphan}' references unknown company")
                print(f"  ✗ Agent '{orphan}' references unknown company")
        print(f"✓ Referential integrity: {agent_count} agents → {len(company_slugs)} companies")
    else:
        warnings.append("No companies registry found. Run 'onxza config migrate' to add it.")
        print(f"⚠ {warnings[-1]}")

    # Step 5: Uniqueness — agent IDs
    agent_ids = [a.get("id") for a in agents_list]
    dupes = set([x for x in agent_ids if agent_ids.count(x) > 1])
    if dupes:
        errors.append(f"Duplicate agent IDs: {dupes}")
        print(f"✗ Duplicate agent IDs: {dupes}")
    else:
        print(f"✓ Agent IDs unique ({len(agent_ids)} entries)")

    # Step 6: Uniqueness — company slugs
    if companies_list:
        slugs = [c.get("slug") for c in companies_list]
        slug_dupes = set([x for x in slugs if slugs.count(x) > 1])
        if slug_dupes:
            errors.append(f"Duplicate company slugs: {slug_dupes}")
            print(f"✗ Duplicate company slugs: {slug_dupes}")
        else:
            print(f"✓ Company slugs unique ({len(slugs)} entries)")

    # Step 7: Workspace paths
    missing_workspaces = []
    for agent in agents_list:
        ws = agent.get("workspace")
        if ws and not os.path.isdir(ws):
            missing_workspaces.append((agent["id"], ws))
    if missing_workspaces:
        for aid, ws in missing_workspaces:
            warnings.append(f"Workspace path missing: {ws} (agent: {aid})")
            print(f"⚠ Workspace path missing: {ws} (agent: {aid})")
    else:
        print(f"✓ All {len(agents_list)} workspace paths exist")

    # Step 8: Model references
    model_errors = []
    import re
    model_pattern = re.compile(r'^[a-z0-9-]+/[a-z0-9._-]+$')
    for agent in agents_list:
        model = agent.get("model", {}).get("primary")
        if model and not model_pattern.match(model):
            model_errors.append(f"Agent '{agent['id']}' has invalid model ref: {model}")
    defaults_model = data.get("agents", {}).get("defaults", {}).get("model", {}).get("primary")
    if defaults_model and not model_pattern.match(defaults_model):
        model_errors.append(f"Default model ref invalid: {defaults_model}")

    if model_errors:
        for me in model_errors:
            errors.append(me)
            print(f"✗ {me}")
    else:
        print("✓ Model references valid")

    # Summary
    print()
    if errors:
        print(f"Result: FAIL ({len(errors)} error(s), {len(warnings)} warning(s))")
        return 1
    elif warnings:
        print(f"Result: PASS ({len(warnings)} warning(s))")
        return 0
    else:
        print("Result: PASS")
        return 0


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/.openclaw/openclaw.json")
    sys.exit(validate_openclaw_json(target))

---
title: openclaw.json Schema Versioning Strategy
version: 1.0.0
owner: DTP_ONXZA_Architect
created: 2026-03-18
status: APPROVED
tags: schema, versioning, migration, openclaw-json, architecture
summary: Defines how the openclaw.json schema is versioned, how forward/backward compatibility is maintained, and how migrations are handled across ONXZA releases.
credit_line: "Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs."
---

# openclaw.json Schema Versioning Strategy

**Version:** 1.0.0 | **Owner:** DTP_ONXZA_Architect | **Date:** 2026-03-18

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## 1. Version Field

Every `openclaw.json` **must** include a `$schemaVersion` field at the root level:

```json
{
  "$schemaVersion": "1.0.0",
  "meta": { ... },
  "agents": { ... }
}
```

The version follows **Semantic Versioning 2.0.0** (MAJOR.MINOR.PATCH):

| Increment | Meaning | Compatibility |
|---|---|---|
| **MAJOR** | Breaking change — fields removed, types changed, required fields added to existing sections | Requires migration |
| **MINOR** | Backward-compatible addition — new optional fields, new optional sections | Old files validate against new schema |
| **PATCH** | Clarification, description updates, no structural change | Fully compatible |

---

## 2. Compatibility Rules

### 2.1 Forward Compatibility (old schema reads new file)

Achieved via `additionalProperties: true` on leaf configuration objects where extension is expected (channels, plugins). Core structural sections use `additionalProperties: false` to catch typos and enforce discipline — forward compatibility for those sections requires a MINOR or MAJOR bump.

**Rule:** ONXZA CLI versions MUST ignore unknown properties in sections marked extensible. They MUST NOT fail on unknown properties in channel configs or plugin entries.

### 2.2 Backward Compatibility (new schema reads old file)

Achieved by:
- New fields always have defaults
- New sections are always optional
- Existing field types never change within a MAJOR version
- The `$schemaVersion` field itself is the one exception — files without it are treated as `0.0.0` (pre-schema era) and auto-migrated

**Rule:** `onxza config validate` MUST accept any file from the same MAJOR version without error.

---

## 3. Migration System

### 3.1 Migration Files

Migrations live in the ONXZA codebase:

```
projects/onxza/schemas/migrations/
├── 0.0.0-to-1.0.0.json    ← initial migration for pre-schema files
├── 1.0.0-to-1.1.0.json    ← example future minor migration
└── 1.0.0-to-2.0.0.json    ← example future major migration
```

Each migration file is a declarative transform:

```json
{
  "from": "0.0.0",
  "to": "1.0.0",
  "operations": [
    { "op": "add", "path": "/$schemaVersion", "value": "1.0.0" },
    { "op": "add", "path": "/companies", "value": { "list": [] } },
    { "op": "add", "path": "/dispatcher", "value": { "enabled": true, "scanIntervalMinutes": 5 } }
  ]
}
```

### 3.2 Migration Execution

```bash
# Dry run — shows what would change
onxza config migrate --dry-run

# Apply migration
onxza config migrate

# Migrate to specific version
onxza config migrate --to 2.0.0
```

**Safety:** Migrations always create a checkpoint before modifying `openclaw.json`. The checkpoint includes the pre-migration file verbatim.

### 3.3 Migration Chain

When jumping multiple versions (e.g. 0.0.0 → 2.0.0), migrations execute sequentially:
```
0.0.0 → 1.0.0 → 1.1.0 → 2.0.0
```

Each step is validated against its target schema before proceeding to the next.

---

## 4. Validation Command

### 4.1 Usage

```bash
# Validate current openclaw.json
onxza config validate

# Validate a specific file
onxza config validate --file /path/to/openclaw.json

# Validate with verbose output
onxza config validate --verbose

# Output in JSON format
onxza config validate --json
```

### 4.2 Validation Steps

1. **Parse** — is the file valid JSON?
2. **Version check** — does `$schemaVersion` exist and match a known schema?
3. **Schema validation** — does the file pass JSONSchema validation?
4. **Referential integrity** — do all agent `company` fields reference companies in the `companies.list`?
5. **Uniqueness** — are all agent IDs unique? All company slugs unique?
6. **Workspace paths** — do referenced workspace directories exist on disk?
7. **Model references** — are all model references in a known provider/model format?

### 4.3 Output Format

```
✓ JSON syntax valid
✓ Schema version: 1.0.0
✓ Schema validation passed (0 errors)
✓ Referential integrity: 94 agents → 5 companies
✓ Agent IDs unique (94 entries)
✓ Company slugs unique (5 entries)
⚠ Workspace path missing: /Users/marcusgear/.openclaw/workspace-dtp-onxza-qa (agent: dtp-onxza-qa)
✓ Model references valid

Result: PASS (1 warning)
```

Warnings are informational. Errors are blocking. Exit code 0 for pass, 1 for fail.

---

## 5. Schema Change Process

Any modification to the schema follows this protocol:

1. **Proposal** — Create a ticket of type `architecture_decision_record` describing the change, rationale, and impact assessment
2. **Review** — DTP_ONXZA_Architect reviews for compatibility implications
3. **Version bump** — Determine MAJOR/MINOR/PATCH based on the rules in Section 1
4. **Schema update** — Modify `openclaw.schema.json` with new `$id` reflecting new version
5. **Migration authoring** — Write the migration file from previous version to new version
6. **Test** — Validate the current DevGru `openclaw.json` against the new schema (with migration if needed)
7. **Publish** — Commit schema + migration + docs update

---

## 6. Pre-Schema File Handling

The current `openclaw.json` (as of 2026-03-18) predates the schema system. It has no `$schemaVersion` field.

**Handling:**
- `onxza config validate` on a file without `$schemaVersion` treats it as version `0.0.0`
- It reports: `⚠ No $schemaVersion found. Treating as pre-schema (0.0.0). Run 'onxza config migrate' to upgrade.`
- `onxza config migrate` applies the `0.0.0-to-1.0.0` migration which:
  - Adds `$schemaVersion: "1.0.0"`
  - Adds `companies.list` populated from agent `company` fields (inferred)
  - Adds `dispatcher` section with sensible defaults
  - Preserves all existing fields verbatim

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

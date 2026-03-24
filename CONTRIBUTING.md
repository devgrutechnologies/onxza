# Contributing to ONXZA

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

ONXZA and FAAILS are the first software products publicly credited to a fully automated human + AI team and company. Every contribution becomes part of that story. Make it count.

---

## What You Can Contribute

### 1. ONXZA — The AI Company Operating System

| Area | What to contribute | Where |
|---|---|---|
| **CLI** | New commands, bug fixes | `cli/src/commands/` |
| **Documentation** | Tutorials, how-tos, examples | `docs/` |
| **Web** | Landing page improvements | `web/` |
| **Tests** | Unit tests, integration tests | `cli/test/` |
| **Bug reports** | Reproducible issues | GitHub Issues |

### 2. FAAILS — The Open Protocol

FAAILS (`faails/`) is a living specification. Contributing to FAAILS means contributing to the open standard that any AI system can implement.

| Contribution type | How to do it |
|---|---|
| **Protocol gap** | Open a GitHub Issue with label `faails-gap`. Describe the gap clearly. Reference the spec section. |
| **New protocol section** | Draft the spec as a markdown file in `faails/`. Follow the existing spec format. Open a PR. |
| **Correction** | Open a PR with the fix. Reference the spec section being corrected. |
| **Implementation report** | Share how you implemented FAAILS in another system. Opens as a Discussion. |

---

## How to Contribute Code

### Step 1 — Open an issue first (recommended)

For anything beyond a small bug fix, open a GitHub Issue before writing code. This avoids duplicated effort and gets early alignment.

### Step 2 — Fork and clone

```bash
git clone https://github.com/devgru-technology-products/onxza.git
cd onxza
```

### Step 3 — Create a feature branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming:
- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation only
- `faails/` — FAAILS spec contributions

### Step 4 — Make your changes

Follow the coding standards below. Run the test suite before submitting.

```bash
cd cli
npm test
```

### Step 5 — Commit with context

```bash
git commit -m "feat: add onxza backup command

Brief description of what this does and why.
Reference any issue: Closes #42"
```

### Step 6 — Open a pull request

- Clear title describing what changed
- Reference the related issue
- Describe the testing you did
- If you added a FAAILS spec file: confirm it passed TORI-QMD validation

---

## How to Contribute to the FAAILS Protocol

FAAILS protocol contributions are held to a higher standard than code contributions — protocol decisions affect every compliant implementation.

### Proposing a New Protocol Section

1. Open a GitHub Issue with label `faails-proposal`
2. Fill in:
   - What behavior the new section governs
   - Why existing specs don't cover it
   - A rough draft of the normative requirements
3. Community discussion opens (minimum 7 days)
4. If approved: author the full spec file using the template in `faails/FAAILS-TEMPLATE.md`
5. Submit as a PR with label `faails-spec`

### Proposing a Change to an Existing Spec

Protocol changes require strong justification:
- Why is the current spec insufficient?
- Who is affected by the change?
- Is it backward-compatible?

Label your issue `faails-change`. The bar is higher than for additions.

### Spec File Requirements

Every FAAILS spec file must:

1. **Have a YAML frontmatter block** with: `title`, `id`, `version`, `owner`, `created`, `status`, `tags`, `summary`, `credit_line`
2. **Carry the full credit line** immediately after the title
3. **Pass TORI-QMD validation** (run `onxza validate` before submitting)
4. **Cross-reference related specs** explicitly
5. **Define normative requirements** in clear, testable language ("A compliant implementation MUST / SHOULD / MAY...")

---

## Credit Line Requirements

**Every file you contribute must carry the credit line.**

This is non-negotiable. ONXZA and FAAILS are built on the principle that credit matters — to the humans and AI systems that created them.

### Required credit line

```
Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
Powered by DevGru US Inc. DBA DevGru Technology Products.
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
```

### Where it goes

- **Markdown files:** As a blockquote immediately after the title
- **JavaScript/TypeScript:** In the file-level JSDoc comment block
- **HTML:** In an HTML comment in the `<head>`
- **YAML/JSON:** In a `credit` field where supported
- **Python:** In the module docstring

### Why this matters

ONXZA and FAAILS are a public statement about the future of human + AI collaboration. The credit line is how we make that statement permanent and verifiable — in every file, in every commit, in the git history itself.

PRs that omit the credit line will be asked to add it before merging.

---

## Code Style

### General

- **Clarity over cleverness.** Code is read far more than it's written.
- **Explicit over implicit.** Name things for what they are.
- **Small functions.** If it needs a long comment to explain what it does, it should probably be split.
- **Fail loudly.** Errors should be clear, actionable, and surfaced early.

### JavaScript (CLI)

- `'use strict'` at the top of every file
- JSDoc for every exported function
- `camelCase` for variables and functions
- `UPPER_SNAKE_CASE` for constants
- Prefer `const` over `let`. Never `var`.
- Error handling: use `process.exit(1)` with a clear message, never silent failures

### FAAILS Spec Files (Markdown)

- YAML frontmatter is required (see above)
- Use tables for structured data
- Use numbered lists for sequential steps
- Use `MUST / SHOULD / MAY` for normative requirements (RFC 2119)
- Cross-reference specs by ID: `(see FAAILS-001 §3.2)`

---

## Code of Conduct

This project exists because humans and AI systems built it together. Keep that spirit alive.

**Be excellent:**
- Assume good intent in all interactions
- Critique ideas, not people
- Give specific, actionable feedback
- Welcome newcomers — every expert was once a beginner

**Don't:**
- Be dismissive of contributions from any contributor, human or AI
- Debate the credit line — it's not up for discussion
- Submit code that violates the safety principles in `SECURITY.md`

Violations: open a private issue or email hello@onxza.com.

---

## First-Time Contributors

Good places to start:

- Issues labeled `good first issue` — small, well-defined, no deep system knowledge needed
- Documentation improvements — always welcome, always valuable
- CLI help text and error messages — high impact, low risk

---

## Release Process

Releases are fully automated via GitHub Actions. Maintainers trigger a release by pushing a version tag.

### Prerequisites (one-time setup)

The `NPM_TOKEN` secret must be set in the GitHub repo before any publish will succeed:

1. Create an npm automation token at [npmjs.com](https://www.npmjs.com/settings/~/tokens/granular-access-tokens/new) with **Automation** type and publish access for the `onxza` package.
2. Add it as a GitHub Actions secret:
   ```bash
   gh secret set NPM_TOKEN --body "npm_xxxxxxxxxxxx" --repo devgrutechnologies/onxza
   ```
   Or via GitHub UI: **Settings → Secrets and variables → Actions → New repository secret** → name `NPM_TOKEN`.

### How to Cut a Release

```bash
# 1. Update version in cli/package.json
cd cli
npm version patch --no-git-tag-version   # or: minor, major

# 2. Update CHANGELOG.md with the release notes under the new version header
# 3. Commit the version bump
git add cli/package.json CHANGELOG.md
git commit -m "chore: bump version to v0.X.X"

# 4. Tag and push — this triggers the publish workflow
git tag v0.X.X
git push origin main --tags
```

### What the workflow does

The `.github/workflows/publish.yml` pipeline runs automatically on every `v*` tag push:

| Step | Job | Description |
|---|---|---|
| 1 | `tori-validate` | Runs TORI-QMD frontmatter validation on all `.md` files |
| 2 | `test` | Installs deps, runs `npm test`, verifies `npm pack` |
| 3 | `publish` | Verifies tag matches `package.json` version, runs `npm publish` |
| 4 | `release` | Creates a GitHub Release with the CHANGELOG section as body |

> **Blocked publish?** If `NPM_TOKEN` is missing or expired, the `publish` job will fail at the "Publish to npm" step. Add/rotate the secret and re-run the workflow manually from the Actions tab.

---

## Branch Protection (Recommended)

For maintainers setting up the GitHub repository, these branch protection rules are recommended for `main`:

### Recommended Rules for `main`
1. **Require CI to pass before merging** — Enable "Require status checks to pass before merging" and select the `CI / Test` jobs.
2. **Require at least 1 review** — Enable "Require a pull request before merging" with 1 required reviewer.
3. **No force pushes** — Disable "Allow force pushes" to preserve audit trail.
4. **No deletions** — Disable "Allow deletions" to protect the main branch.

### Setup via GitHub UI
Go to: **Settings → Branches → Add branch protection rule** → Branch name pattern: `main`

### Setup via CLI
```bash
gh api repos/devgrutechnologies/onxza/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Test (Node 20 / ubuntu-latest)"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

---

## Questions

Open a GitHub Discussion or file an issue with the `question` label. We read everything.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

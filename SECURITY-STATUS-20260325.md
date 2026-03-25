# SECURITY-STATUS-20260325.md
**Ticket:** TICKET-20260325-DTP-DEPENDABOT-VULN-AUDIT
**Generated:** 2026-03-25T05:00:00Z
**Agent:** DTP_ONXZA_CLI
**PR:** https://github.com/devgrutechnologies/onxza/pull/3

---

## Summary

| Severity | Total Alerts | Fixed | Deferred | False Positive |
|----------|-------------|-------|----------|----------------|
| 🔴 Critical | 1 | 1 | 0 | 0 |
| 🟠 High | 6 | 3 | 3 | 0 |
| 🟡 Medium/Low | 16 | 14 | 0 | 2 |

---

## Critical — FIXED

### Alert #1 — Authorization Bypass in Next.js Middleware
- **Package:** `next`
- **Manifest:** `marketplace-web/package-lock.json`
- **Vulnerable range:** >= 14.0.0, < 14.2.25
- **Patched version:** 14.2.25
- **Previous version:** 14.2.21
- **Fix:** Bumped to 14.2.35 (latest stable 14.x)
- **Status:** ✅ FIXED — included in PR #3

---

## High — FIXED

### Alert #7 — Next.js DoS with Server Components
- **Package:** `next`
- **Manifest:** `marketplace-web/package-lock.json`
- **Vulnerable range:** >= 13.3.0, < 14.2.34
- **Fix:** Bumped to 14.2.35
- **Status:** ✅ FIXED

### Alert #8 — Next.js DoS with Server Components (Incomplete Fix Follow-Up)
- **Package:** `next`
- **Manifest:** `marketplace-web/package-lock.json`
- **Vulnerable range:** >= 13.3.1-canary.0, < 14.2.35
- **Fix:** Bumped to 14.2.35
- **Status:** ✅ FIXED

### Alert #13 — glob CLI Command Injection
- **Package:** `glob`
- **Manifest:** `mission-control/package-lock.json`
- **Vulnerable range:** >= 10.2.0, < 10.5.0
- **Root cause:** Transitive dep via `@next/eslint-plugin-next` → `glob@10.3.10`
- **Fix:** Added `overrides.glob: ">=10.5.0"` in mission-control/package.json. Resolves to 13.0.6.
- **Status:** ✅ FIXED

---

## High — DEFERRED

### Alerts #10, #15, #23 — Next.js RSC Deserialization DoS
- **Package:** `next`
- **Manifests:** `marketplace-web/`, `mission-control/`, `docs-site/` package-lock.json
- **Vulnerable range:** >= 13.0.0, < 15.0.8
- **Patched version:** 15.0.8 (requires Next.js major version bump: 14.x → 15.x)

**Deferral Rationale:**
1. Next.js 14 → 15 is a **major breaking change** affecting App Router APIs, caching behavior, `next/image`, and React 18/19 compatibility.
2. All affected apps (`marketplace-web`, `mission-control`, `docs-site`) are **pre-launch / internal staging only** — zero external users exposed at this time.
3. The vulnerability requires **remote code execution context with RSC enabled** — not trivially exploitable without active deployments processing untrusted RSC payloads.
4. A full Next.js 15 migration sprint is the correct scope for this fix, not a patch bump.

**Mitigation:** No public traffic on affected apps (marketplace-web and mission-control are not deployed externally yet). docs-site is deployed at docs-site-ebon.vercel.app but uses static page generation — RSC deserialization path is not exercised.

**Planned Resolution:** Schedule `TICKET-DTP-NEXT15-MIGRATION` in v0.2 sprint (target: pre-public-launch).

---

## Medium/Low — FIXED (via next 14.2.35 bump)

| Alert # | Summary | Manifest | Fix |
|---------|---------|----------|-----|
| #2 | Info exposure in Next.js dev server | marketplace-web | ✅ 14.2.35 |
| #3 | Cache Key Confusion for Image Optimization | marketplace-web | ✅ 14.2.35 |
| #4 | Content Injection for Image Optimization | marketplace-web | ✅ 14.2.35 |
| #5 | Improper Middleware Redirect / SSRF | marketplace-web | ✅ 14.2.35 |
| #6 | Race Condition Cache Poisoning | marketplace-web | ✅ 14.2.35 |
| #9 | DoS via Image Optimizer remotePatterns | marketplace-web | ✅ 14.2.35 |
| #11 | HTTP request smuggling in rewrites | marketplace-web | ✅ 14.2.35 |
| #12 | Unbounded disk cache growth | marketplace-web | ✅ 14.2.35 |
| #14 | DoS via Image Optimizer remotePatterns | mission-control | ✅ 14.2.35 |
| #16 | HTTP request smuggling in rewrites | mission-control | ✅ 14.2.35 |
| #17 | Unbounded disk cache growth | mission-control | ✅ 14.2.35 |
| #22 | DoS via Image Optimizer remotePatterns | docs-site | ✅ 14.2.35 |
| #24 | HTTP request smuggling in rewrites | docs-site | ✅ 14.2.35 |
| #25 | Unbounded disk cache growth | docs-site | ✅ 14.2.35 |

---

## False Positives — NO ACTION

### Alerts #18, #19 — esbuild dev server vulnerability
- **Package:** `esbuild`
- **Manifests:** `packages/cli/package-lock.json`, `packages/core/package-lock.json`
- **Vulnerable range:** <= 0.24.2
- **Dependabot finding:** flags lock files containing esbuild entries
- **Reality:** Lock file resolved version for both manifests is **0.27.4** (confirmed via `packages["node_modules/esbuild"]["version"]`)
- **0.27.4 >= 0.25.0** — patched version. False positive due to Dependabot parsing the `peerDependencies` or legacy range entries in the lock file rather than the resolved version.
- **Status:** No action required.

---

## Verification Command

After PR #3 merges to main:

```bash
gh api repos/devgrutechnologies/onxza/dependabot/alerts \
  --jq '[.[] | select(.state=="open" and (.security_advisory.severity=="critical" or .security_advisory.severity=="high")) | {number: .number, severity: .security_advisory.severity, summary: .security_advisory.summary}]'
```

Expected: Only alerts #10, #15, #23 remain open (deferred RSC DoS — see rationale above).

---

*Generated by DTP_ONXZA_CLI | Ticket TICKET-20260325-DTP-DEPENDABOT-VULN-AUDIT*
*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products.*

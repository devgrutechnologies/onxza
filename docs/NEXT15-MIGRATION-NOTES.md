# Next.js 14 → 15 Migration Notes
**Date:** 2026-03-25  
**Ticket:** TICKET-20260325-DTP-NEXT15-MIGRATION  
**Commit:** 07ae5ea  

## Summary
All 3 ONXZA web apps upgraded from Next.js 14.x → 15.5.14 to resolve Dependabot high-severity RSC deserialization DoS alerts (#10, #15, #23) and related CVEs.

## Apps Migrated

### docs-site
- **next:** `^14.2.0` → `15.5.14`
- **nextra:** `^3.0.0` → `^3.3.1`
- **nextra-theme-docs:** `^3.0.0` → `^3.3.1`
- **react:** Retained `^18.3.0` (Nextra v3 requires React ≥ 18 but does NOT require React 19)
- **Build result:** ✅ 21 static pages generated successfully
- **Notes:** Nextra v3 peerDeps are `next >= 13` and `react >= 18` — compatible with Next 15 + React 18.

### marketplace-web
- **next:** `14.2.21` → `15.5.14`
- **react / react-dom:** `^18.3.1` → `^19.2.4`
- **@types/react:** `^18.3.3` → `^19.2.14`
- **Build result:** ✅ 12 routes (App Router), all render correctly
- **Notes:** React 19 upgrade required for full Next 15 compatibility. No breaking component changes observed.

### mission-control
- **next:** `14.2.35` → `15.5.14`
- **react / react-dom:** `^18` → `^19.2.4`
- **@types/react:** `^18` → `^19.2.14`
- **eslint-config-next:** `14.2.35` → `15.5.14`
- **Build result:** ✅ 30 routes (App Router), all render correctly

## Dependabot Alerts Resolved
| Alert | Severity | CVE | Package | Status |
|-------|----------|-----|---------|--------|
| #10 | High | RSC deserialization DoS | next @ marketplace-web | ✅ Closed |
| #15 | High | RSC deserialization DoS | next @ mission-control | ✅ Closed |
| #23 | High | RSC deserialization DoS | next @ docs-site | ✅ Closed |
| #24 | Medium | HTTP request smuggling | next @ docs-site | ✅ Closed |
| #25 | Medium | Unbounded disk cache | next @ docs-site | ✅ Closed |
| #22 | Medium | Image DoS | next @ docs-site | ✅ Closed |
| #16 | Medium | HTTP request smuggling | next @ mission-control | ✅ Closed |
| #17 | Medium | Unbounded disk cache | next @ mission-control | ✅ Closed |
| #14 | Medium | Image DoS | next @ mission-control | ✅ Closed |
| #11 | Medium | HTTP request smuggling | next @ marketplace-web | ✅ Closed |
| #12 | Medium | Unbounded disk cache | next @ marketplace-web | ✅ Closed |
| #9 | Medium | Image DoS | next @ marketplace-web | ✅ Closed |
| #8, #7 | High | Next.js DoS (Server Components) | next @ marketplace-web | ✅ Closed |
| #6 | Low | Race condition cache poisoning | next @ marketplace-web | ✅ Closed |
| #5, #4 | Medium | Middleware redirect / image injection | next @ marketplace-web | ✅ Closed |

## Remaining Open Alerts (out of scope)
- #19 [medium]: esbuild @ `packages/core/package-lock.json` — CLI dev-only dependency
- #18 [medium]: esbuild @ `packages/cli/package-lock.json` — CLI dev-only dependency

## Breaking Changes Handled
- **App Router fetch caching:** No custom fetch caching options used in any app — not impacted.
- **Route Handler GET caching:** Route handlers use dynamic server-side logic — no-cache by default is correct behavior.
- **React 19:** marketplace-web and mission-control use simple functional components — no React 18-specific patterns that conflict with React 19.
- **Nextra + React 18:** docs-site intentionally retains React 18 — Nextra v3 is not fully validated with React 19. This is safe.
- **Turbopack:** All apps still use standard `next build` (webpack) — Turbopack only activates with `next dev --turbo`.

## Deployment Note
Vercel auto-deploy requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` GitHub repo secrets — still pending Aaron's action. Manual Vercel deploy can be triggered from the Vercel dashboard.

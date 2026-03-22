# ONXZA Docs Site — Framework Decision

**Decision:** Nextra (v3)  
**Date:** 2026-03-20  
**Author:** DTP_ONXZA_Architect  
**Status:** APPROVED  
**Ticket:** TICKET-20260320-DTP-011-onxza-docs-framework

---

## Decision

The ONXZA documentation site at onxza.com/docs will be built with **Nextra v3** — a Next.js-based static docs framework.

## Alternatives Evaluated

| Criteria | Docusaurus | Nextra | Mintlify |
|---|---|---|---|
| Open source | ✅ MIT | ✅ MIT | ❌ Proprietary SaaS |
| Zero cost | ✅ | ✅ | ❌ Paid |
| Markdown/MDX | ✅ | ✅ | ✅ |
| Search | ✅ Algolia/local | ✅ FlexSearch built-in | ✅ |
| Versioned docs | ✅ First-class | ⚠️ Manual | ✅ |
| Stack alignment | ⚠️ Separate React app | ✅ Same Next.js as marketplace-web | ❌ N/A |
| Deploy (Vercel) | ✅ | ✅ Native | ❌ Hosted only |
| Config weight | ⚠️ Heavier | ✅ Minimal | ✅ Managed |
| Community | ✅ Large | ✅ Growing | ⚠️ Small |

## Rationale

1. **Stack alignment.** marketplace-web runs Next.js 14. Nextra keeps the entire ONXZA web surface on one framework — shared knowledge, shared tooling, reduced cognitive overhead for contributors.

2. **Speed to deploy.** NLNet deadline is April 1 (12 days). Nextra's minimal configuration gets us to a deployed site fastest. Docusaurus is more powerful but heavier to configure.

3. **Zero additional spend.** Mintlify eliminated — paid SaaS violates the zero-additional-spend constraint.

4. **FAAILS alignment.** Nextra is MIT-licensed, open-source, and self-hostable. Aligns with ONXZA's open-source protocol identity.

5. **Versioning is premature.** Docusaurus's first-class doc versioning is its strongest advantage, but we don't need multi-version docs at v0.1. When we do, we can implement versioning manually or migrate.

## Trade-offs Accepted

- No first-class doc versioning (acceptable for v0.1)
- Smaller plugin ecosystem than Docusaurus (acceptable — we need docs, not a CMS)
- Nextra v3 is newer, slightly less battle-tested at scale (acceptable for docs site)

## Deployment

- Host: Vercel (free tier)
- Path: onxza.com/docs (requires DNS config by Aaron)
- Build: `next build && next export` or Vercel auto-deploy
- CI: GitHub push → Vercel auto-deploy

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products.*

# ONXZA Docs Site — Deployment

## Staging

| Field | Value |
|-------|-------|
| **Vercel Project** | `docs-site` (marcus-bowers-projects) |
| **Staging URL** | https://docs-site-ebon.vercel.app |
| **Framework** | Nextra 3.x (Next.js 14.2) |
| **Output Mode** | Static export (`output: 'export'`) |
| **Base Path** | `/docs` |
| **Deploy Date** | 2026-03-20 |
| **Pages** | 20 (index, getting-started, architecture, cli-reference, faails index + 10 specs) |

## Accessing the Site

- **Homepage:** https://docs-site-ebon.vercel.app/docs
- **Getting Started:** https://docs-site-ebon.vercel.app/docs/getting-started
- **Architecture:** https://docs-site-ebon.vercel.app/docs/architecture
- **FAAILS Protocol:** https://docs-site-ebon.vercel.app/docs/faails
- **CLI Reference:** https://docs-site-ebon.vercel.app/docs/cli-reference

## DNS Instructions for Aaron

To point `onxza.com/docs` to this deployment:

### Option A — Subdirectory via Vercel (Recommended)
1. Add `onxza.com` as a custom domain in the Vercel project settings
2. Configure a CNAME record: `onxza.com` → `cname.vercel-dns.com`
3. The `basePath: '/docs'` in next.config.mjs means the site already serves under `/docs`

### Option B — Subdomain
1. Add `docs.onxza.com` as a custom domain in Vercel
2. CNAME: `docs.onxza.com` → `cname.vercel-dns.com`
3. Update `basePath` in next.config.mjs if switching to root path

### Vercel Dashboard
- Project settings: https://vercel.com/marcus-bowers-projects/docs-site/settings

## Redeployment

```bash
cd projects/onxza/docs-site
npx vercel --prod --token <VERCEL_TOKEN> --yes
```

---
*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products.*

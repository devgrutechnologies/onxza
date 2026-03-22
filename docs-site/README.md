# ONXZA Documentation Site

Public documentation for the ONXZA platform, built with [Nextra](https://nextra.site/) (Next.js).

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# → http://localhost:3000/docs
```

## Build

```bash
npm run build
```

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
npx vercel
```

### Option 2: GitHub Integration (Recommended)
1. Push this directory to GitHub (or as part of the onxza monorepo)
2. Connect the repo to Vercel
3. Set the root directory to `docs-site/`
4. Vercel auto-deploys on push to `main`

### DNS Configuration
To serve at `onxza.com/docs`:
- Configure Vercel project with custom domain `onxza.com`
- The `basePath: '/docs'` in `next.config.mjs` handles the path prefix
- Alternatively, deploy as a separate subdomain: `docs.onxza.com`

## Project Structure

```
docs-site/
├── next.config.mjs        # Nextra + Next.js config
├── theme.config.tsx        # ONXZA branding and theme
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── pages/
│   ├── _meta.json          # Top-level navigation
│   ├── index.mdx           # Homepage
│   └── docs/
│       ├── _meta.json      # Docs sidebar nav
│       ├── getting-started.mdx
│       ├── architecture.mdx
│       ├── cli-reference.mdx
│       └── faails/
│           ├── _meta.json  # FAAILS sidebar nav
│           ├── index.mdx   # FAAILS overview
│           ├── 001-agent-identity.mdx
│           ├── 002-inter-agent-communication.mdx
│           ├── ... (all 10 specs)
│           └── 010-knowledge-base.mdx
└── FRAMEWORK-DECISION.md   # Architecture decision record
```

## Content Authoring

All pages are `.mdx` files — Markdown with JSX support. To add a new page:

1. Create a `.mdx` file in the appropriate `pages/` subdirectory
2. Add an entry to the nearest `_meta.json` for sidebar ordering
3. Push to trigger auto-deploy

## License

MIT — Part of the ONXZA open-source project.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products.*

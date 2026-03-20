# ONXZA Skills Marketplace — Frontend

Next.js 14 (App Router) frontend for the ONXZA Skills Marketplace.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.onxza.com` |

## Deploy

Build for production:

```bash
npm run build
npm start
```

Deploy to Vercel:

```bash
npx vercel --prod
```

Set `NEXT_PUBLIC_API_URL` in your Vercel project environment variables.

## Structure

```
app/
  page.tsx            — Home (featured skills + search)
  search/page.tsx     — Search results with pagination
  skills/[name]/      — Skill detail page
  author/[username]/  — Author profile
  not-found.tsx       — 404 page
components/           — Reusable UI components
lib/api.ts            — Typed API client
```

---
title: ONXZA DNS Configuration
version: 1.0.0
status: pending-implementation
created: 2026-03-18
last_updated: 2026-03-18
tags: dns, infrastructure, domains, vercel, onxza, faails
summary: DNS configuration plan for onxza.com and faails.com. Both domains registered at GoDaddy. Requires Vercel project setup and DNS record updates to activate subdomains and route traffic correctly.
credit_line: present
---

# ONXZA DNS Configuration

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Status:** Domains registered. DNS pointing to GoDaddy parking. Configuration pending.  
**Registrar:** GoDaddy (both domains)  
**Target Platform:** Vercel

---

## Domain Status (Assessed 2026-03-18)

| Domain | Registered | Expiry | Current State |
|---|---|---|---|
| onxza.com | ✅ Yes (2026-01-03) | 2028-01-03 | Parked / GoDaddy lander redirect |
| faails.com | ✅ Yes (2026-02-26) | 2027-02-26 | Parked / GoDaddy parking page |

Both domains are owned. No purchase required.

---

## Target Architecture

```
onxza.com              → Main marketing/docs site (Vercel)
docs.onxza.com         → Documentation (Vercel or separate)
api.onxza.com          → API endpoint (future backend)
marketplace.onxza.com  → Skills marketplace (future)
get.onxza.com          → Install script CDN
faails.com             → FAAILS open protocol site (Vercel)
```

---

## Step 1: Vercel Project Setup

### Create Vercel Projects

Aaron will need to do this at vercel.com:

1. **onxza-site** — import from `github.com/aarongear/onxza` (or a separate frontend repo)
   - Set custom domain: `onxza.com` and `www.onxza.com`
2. **faails-site** — can be the `/faails` directory served as a static docs site
   - Set custom domain: `faails.com` and `www.faails.com`

### Vercel CLI (alternative)
```bash
# Install Vercel CLI if needed
npm i -g vercel

# From the mission-control/ directory (Next.js app)
cd ~/.openclaw/workspace/projects/onxza/mission-control
vercel --prod

# Add custom domain
vercel domains add onxza.com
```

---

## Step 2: DNS Records (GoDaddy)

Update at: https://dcc.godaddy.com/manage/onxza.com/dns

### onxza.com DNS Records

**Nameservers** (current, keep unless switching to Vercel NS):
- `ns55.domaincontrol.com`
- `ns56.domaincontrol.com`

**Option A: Keep GoDaddy NS, add Vercel A/CNAME records**

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | `76.76.21.21` | 600 |
| CNAME | www | `cname.vercel-dns.com` | 600 |
| CNAME | docs | `cname.vercel-dns.com` | 600 |
| CNAME | api | *(set when backend deployed)* | 600 |
| CNAME | marketplace | `cname.vercel-dns.com` | 600 |
| CNAME | get | `cname.vercel-dns.com` | 600 |

> **Note:** `76.76.21.21` is Vercel's static IP for root domain A records.

**Option B: Delegate to Vercel Nameservers (recommended for zero-config)**

Switch nameservers in GoDaddy to:
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

Vercel will then manage all DNS. Add domains in Vercel dashboard and it configures automatically.

---

### faails.com DNS Records

Update at: https://dcc.godaddy.com/manage/faails.com/dns

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | `76.76.21.21` | 600 |
| CNAME | www | `cname.vercel-dns.com` | 600 |
| CNAME | spec | `cname.vercel-dns.com` | 600 |

---

## Step 3: get.onxza.com — Install Script

The install script (`get.onxza.com`) should serve a shell script directly.

### Option A: Vercel Serverless (recommended)
Create a Vercel route at `/` for `get.onxza.com` that returns the install script with `Content-Type: text/plain`.

```bash
# User installs ONXZA with:
curl -fsSL https://get.onxza.com | sh
```

### Option B: GitHub Raw (temporary, pre-Vercel)
Point `get.onxza.com` CNAME to a GitHub Pages redirect, or use a Vercel redirect rule:

```json
// vercel.json
{
  "redirects": [
    {
      "source": "/",
      "destination": "https://raw.githubusercontent.com/aarongear/onxza/main/scripts/install.sh",
      "permanent": false
    }
  ]
}
```

> **Note:** `scripts/install.sh` does not yet exist. Needs to be created as part of v0.5.0 CLI work (see TICKET-20260318-DTP-034).

---

## Step 4: SSL/TLS

Vercel provisions SSL certificates automatically via Let's Encrypt when:
- Domain is added in Vercel dashboard
- DNS records point to Vercel

No manual SSL configuration required.

---

## Action Checklist for Aaron

- [ ] Log in to vercel.com
- [ ] Create project for onxza.com (connect to GitHub repo once pushed)
- [ ] Create project for faails.com (can be static export of faails/ dir)
- [ ] Add custom domains to each Vercel project
- [ ] Update DNS in GoDaddy per Step 2 above (or switch to Vercel NS)
- [ ] Verify onxza.com resolves to Vercel
- [ ] Verify faails.com resolves to Vercel
- [ ] Add subdomain CNAMEs: docs, marketplace, get (api when backend ready)
- [ ] Confirm get.onxza.com plan (Vercel serverless vs redirect for now)

---

## Dependencies

- **TICKET-20260318-DTP-011** — GitHub push must happen before Vercel can import the repo
- **TICKET-20260318-DTP-034** — Install script (`scripts/install.sh`) needed for get.onxza.com
- **Mission Control** — `mission-control/` Next.js app is the onxza.com frontend candidate

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

# ONXZA Install Script Infrastructure

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

Hosts the one-line installer at **https://get.onxza.com**.

---

## Files

| File | Purpose |
|---|---|
| `install.sh` | The installer. Served at `https://get.onxza.com` and `https://get.onxza.com/install.sh` |
| `checksums.txt` | SHA256 checksums for each npm release. Served at `https://get.onxza.com/checksums.txt` |
| `generate-checksums.sh` | Generates/updates checksums.txt after a new npm publish |
| `vercel.json` | Vercel hosting config for get.onxza.com |

---

## Usage

```bash
# Standard install
curl -fsSL https://get.onxza.com | bash

# Pin a specific version
curl -fsSL https://get.onxza.com | ONXZA_VERSION=0.1.0 bash

# Skip onxza init after install
curl -fsSL https://get.onxza.com | ONXZA_NO_INIT=1 bash

# Debug mode
curl -fsSL https://get.onxza.com | ONXZA_DEBUG=1 bash
```

---

## Hosting Setup (Vercel)

1. Create a Vercel project named `onxza-install`
2. Connect this directory (`install-script/`) as the root
3. Add custom domain: `get.onxza.com` → Vercel
4. Set DNS: `CNAME get.onxza.com → cname.vercel-dns.com`
5. Deploy — Vercel serves `install.sh` at the domain root

The `vercel.json` config ensures:
- `GET https://get.onxza.com` → serves `install.sh` (correct Content-Type)
- `GET https://get.onxza.com/checksums.txt` → serves checksums
- Short cache (5 min for installer, 60s for checksums) — fast updates post-release
- No redirects to `.html` — stays as raw shell

---

## Release Checklist

After every `npm publish onxza@X.Y.Z`:

```bash
# 1. Generate checksum
./generate-checksums.sh X.Y.Z

# 2. Commit checksums.txt
git add checksums.txt
git commit -m "chore: add checksum for onxza@X.Y.Z"
git push

# 3. Vercel auto-deploys on push
```

---

## Platform Support Matrix

| Platform | Method | Tested |
|---|---|---|
| macOS ARM64 (Apple Silicon) | npm install -g | Required |
| macOS x86_64 (Intel) | npm install -g | Required |
| Ubuntu 22.04 x64 | npm via NodeSource | Required |
| Ubuntu 22.04 ARM64 | npm via NodeSource | Required |
| Debian 12 x64 | npm via NodeSource | Required |
| Fedora / RHEL | npm via rpm NodeSource | Required |
| Alpine Linux | npm via apk | Best effort |
| WSL2 (Ubuntu) | npm install -g | Required |
| Windows (native) | npm install -g (manual) | Best effort |

---

## Security

- **SHA256 verification** — every install verifies the npm tarball checksum against `checksums.txt`
- **HTTPS only** — `curl -fsSL` enforces TLS; no plain HTTP fallback
- **No `sudo` by default** — falls back to `~/.npm-global` prefix before escalating
- **No eval** — the script is piped directly to `bash`, not stored and exec'd
- **Checksum source** — hosted on the same `get.onxza.com` domain (same TLS root); independent checksum hosting is a future hardening step

### Compromise response

If a checksum mismatch is detected, the script:
1. Prints a clear warning with both hashes
2. Instructs the user NOT to proceed
3. Points to `https://github.com/devgru-technology-products/onxza/security` to report

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ONXZA_VERSION` | `latest` | Pin a specific version |
| `ONXZA_NO_INIT` | `0` | Skip `onxza init` (set to `1`) |
| `ONXZA_NO_COLOR` | `0` | Disable color output |
| `ONXZA_DEBUG` | `0` | Enable verbose debug output |

---

## Timing Target

Under 2 minutes on a standard 50 Mbps connection:
- Node.js already installed: ~15–30 seconds (npm download + install)
- Node.js not installed (Homebrew): ~60–90 seconds
- `onxza init`: ~3 seconds
- **Total: well under 2 minutes in all tested scenarios**

# ONXZA CLI

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**ONXZA** — AI Company Operating System. Run agent fleets, manage tickets, enforce quality, and orchestrate AI companies from the terminal.

[![npm version](https://img.shields.io/npm/v/onxza)](https://www.npmjs.com/package/onxza)
[![License](https://img.shields.io/badge/license-MIT%20%2F%20Commercial-blue)](LICENSE.md)
[![Node.js](https://img.shields.io/node/v/onxza)](package.json)

---

## Install

```bash
# npm (recommended)
npm install -g onxza

# One-line installer
curl -fsSL https://get.onxza.com | bash
```

**Requirements:** Node.js >= 18.0.0

---

## Quick Start

```bash
onxza init                              # Initialize ONXZA in ~/.openclaw
onxza agent create DTP_Onxza_Router    # Create your first agent
onxza status                            # View system health
onxza dashboard                         # Launch interactive TUI
```

---

## Commands

| Command | Description |
|---------|-------------|
| `onxza init` | Initialize a new ONXZA installation |
| `onxza status` | System health: agents, tickets, health score |
| `onxza dashboard` | Interactive TUI Mission Control |
| `onxza agent create <Name>` | Scaffold a new agent workspace |
| `onxza agent list` | List all registered agents with live status |
| `onxza agent validate <id>` | Run TORI-QMD on all 6 agent workspace files |
| `onxza company add <name>` | Register a new company |
| `onxza company list` | List companies with agent counts |
| `onxza company switch <name>` | Set active company context |
| `onxza skill install <name>` | Install a skill from the marketplace |
| `onxza skill list` | List installed skills |
| `onxza skill update [name]` | Update skill(s) to latest version |
| `onxza skill publish <path>` | Submit a skill to the marketplace |
| `onxza tickets` | List tickets by status |
| `onxza tickets show <id>` | Show full ticket detail |
| `onxza tickets create` | Create a new ticket |
| `onxza tickets move <id> <status>` | Move ticket between lifecycle stages |

### Global flags

| Flag | Description |
|------|-------------|
| `--json` | Machine-readable JSON output on all commands |
| `--version` / `-v` | Print ONXZA CLI version |
| `--help` / `-h` | Show help for any command |

---

## Agent Naming Convention

```
[Company]_[Dept]_[Role]   →   WDC_Content_BlogWriter
                               DTP_Onxza_Router
                               MGA_Sales_Researcher
```

- **Company:** 2–10 uppercase alphanumeric (WDC, DTP, MGA, MG, MGP, ...)
- **Dept:** PascalCase department (Content, Onxza, Sales, ...)
- **Role:** PascalCase role (BlogWriter, Router, Researcher, ...)

---

## Architecture

ONXZA implements the [FAAILS Protocol](https://faails.dev) — Frameworks for Autonomous Artificial Intelligence Learning Systems.

```
LLMs (Claude, GPT-4o, Ollama)
  ↓ model API calls
OpenClaw — Agent runtime
  ↓ agent context, tools, heartbeats
ONXZA — AI Company Operating System   ← this CLI
  ↓ company context, vision, agent fleets
Companies → WDC · MGA · DTP · custom
  ↓ real-world output
```

**Single dependency:** `commander` ^12.0.0  
**TUI framework:** Raw ANSI + readline + `fs.watch` (zero extra deps)  
**Package size:** ~500KB installed (see `npm pack --dry-run`)

---

## Version Bump and Release

```bash
# 1. Bump version in package.json
npm run version:patch   # 0.1.0 → 0.1.1
npm run version:minor   # 0.1.0 → 0.2.0
npm run version:major   # 0.1.0 → 1.0.0

# 2. Update CHANGELOG.md with new section

# 3. Commit and tag
git add package.json CHANGELOG.md
git commit -m "chore: release v$(node -p 'require(\"./package.json\").version')"
git tag "v$(node -p 'require(\"./package.json\").version')"
git push && git push --tags

# GitHub Actions publishes to npm automatically on version tag push.
```

---

## Development

```bash
git clone https://github.com/devgru-technology-products/onxza.git
cd onxza/cli
npm install
node bin/onxza.js --version
node bin/onxza.js help
```

---

## License

Community (non-commercial): MIT  
Commercial: [Pro or Enterprise license required](https://onxza.com/pricing)

See [LICENSE.md](LICENSE.md) for full terms.

---

## Links

- Website: https://onxza.com
- Docs: https://docs.onxza.com
- npm: https://www.npmjs.com/package/onxza
- GitHub: https://github.com/devgru-technology-products/onxza
- Issues: https://github.com/devgru-technology-products/onxza/issues
- Discord: https://discord.gg/onxza

# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

### SSH Hosts

| Alias | Host | Port | User | Purpose |
|-------|------|------|------|---------|
| `forgejo-shell` | 100.78.158.46 | 22 | wardprice | Shell access (Tailscale SSH) |
| `forgejo` | 100.78.158.46 | 2222 | git | Git push/pull |
| `ci-runner` | 100.84.240.42 | 22 | wardprice | CI runner |

### Project Locations

| Project | Location | Notes |
|---------|----------|-------|
| upstate-fishing | `forgejo:/mnt/data/projects/upstate-fishing` | Main working dir on Forgejo data disk |
| upstate-fishing (local) | `~/.openclaw/workspace-coder/` | Local copy on clawpei (deprecated) |

### Tailscale Nodes

- **clawpei** (100.114.210.49) — OpenClaw agent host, tag:server
- **forgejo** (100.78.158.46) — Forgejo git server, tag:server
- **ci-runner** (100.84.240.42) — CI runner, tag:server

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

# GitHub issue creation fails from Claude Code on iOS

## Problem

When using Claude Code on iOS (mobile app), creating GitHub issues via `gh issue create` fails with:

```
To get started with GitHub CLI, please run:  gh auth login
Alternatively, populate the GH_TOKEN environment variable with a GitHub API authentication token.
```

This affects any workflow where Claude attempts to use `gh` for GitHub operations such as creating
issues, commenting on PRs, or viewing PR diffs.

## Diagnosis

### Current State (Feb 2026)

| Component                 | Status                                           |
| ------------------------- | ------------------------------------------------ |
| `gh` CLI installed        | Yes (`/usr/bin/gh` v2.45.0, via apt)             |
| `gh` authenticated        | **No** — no GitHub host configured               |
| `GITHUB_TOKEN` env var    | **Not set**                                      |
| `GH_TOKEN` env var        | **Not set**                                      |
| Git push/pull/fetch       | Works — via local proxy at `127.0.0.1:22998`     |
| `api.github.com` reachable| Yes — egress proxy allows it, returns HTTP 200   |
| Authenticated API calls   | **Fail with 401** — no credentials available     |

### Root Cause

The Claude Code iOS sandbox uses a **local git proxy** (`http://local_proxy@127.0.0.1:22998/git/...`)
for git operations. This proxy authenticates git push/pull/fetch using Basic auth with an empty
password, then forwards requests to GitHub with real credentials.

However, this proxy **only handles git smart HTTP protocol paths** (i.e., `/git/{owner}/{repo}/...`).
It does not proxy GitHub REST API calls. Attempting to use it for API requests returns
`Invalid path format`.

The `gh` CLI and GitHub REST API require a `GITHUB_TOKEN` or `GH_TOKEN` environment variable, or
an authenticated `gh auth login` session. **None of these are provisioned in the iOS sandbox.**

The result: git operations (commit, push, fetch) work perfectly, but GitHub API operations (create
issue, comment on PR, view PR checks) fail with authentication errors.

### SessionStart Hook (Partial Fix — Already Applied)

The repo already has a SessionStart hook in `.claude/settings.json` that installs `gh` if missing:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'if ! command -v gh &>/dev/null && command -v apt-get &>/dev/null; then apt-get update -qq && apt-get install -y -qq gh 2>/dev/null || true; fi'",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

This solves the `gh: command not found` error. **It does not solve the authentication problem.**

### Where `gh` is referenced in this repo

Two CI workflow files pre-approve `gh` commands for Claude Code:

1. **`.github/workflows/claude.yml`** (line 63) — the interactive `@claude` workflow:
   ```yaml
   claude_args: '--allowedTools "...Bash(gh issue create:*)"'
   ```

2. **`.github/workflows/ci.yml`** — the PR review workflow:
   ```yaml
   claude_args: |
     --allowedTools "...Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*),Bash(gh api:*),..."
   ```

These work in **GitHub Actions** (where `gh` is pre-installed and auto-authenticated via
`GITHUB_TOKEN` on `ubuntu-latest` runners) but fail in the **iOS sandbox** due to missing
credentials.

## Verified During Troubleshooting

1. **`gh` is installed and in PATH**: `which gh` → `/usr/bin/gh`
2. **`gh` is not authenticated**: `gh auth status` → "You are not logged into any GitHub hosts"
3. **No GitHub tokens in env**: `GITHUB_TOKEN` and `GH_TOKEN` are both unset
4. **Git proxy only handles git paths**: `curl http://local_proxy@127.0.0.1:22998/api/...` →
   `Invalid path format`
5. **GitHub API is reachable**: `curl https://api.github.com/repos/woink/upstate-fishing` → 200
6. **Unauthenticated API writes fail**: `POST /repos/.../issues` → 401 "Requires authentication"
7. **The repo has issues enabled**: `has_issues: true`
8. **Git proxy uses Basic auth with empty password**: Works for git protocol, not for API

## Impact

When Claude Code on iOS attempts GitHub operations (e.g., creating an issue, commenting on a PR), it
encounters a hard failure. There is no fallback mechanism — the operation simply fails and Claude
must inform the user it cannot complete the task.

Workaround: users must create issues manually through the GitHub web UI or native GitHub app, then
reference them in Claude Code sessions.

## Required Fix (Upstream — Anthropic)

The Claude Code iOS runtime needs to provision GitHub API credentials alongside the git proxy
credentials. Specifically:

1. **Provide `GH_TOKEN` environment variable** — scoped to the connected repository with
   permissions for issues, pull requests, and comments. This could use the same GitHub App
   installation token mechanism that GitHub Actions uses.

2. **Or authenticate `gh` at session start** — run `gh auth login --with-token` using the
   provisioned token before the user session begins.

Either approach would allow `gh issue create`, `gh pr comment`, and other GitHub API operations
to work in the iOS sandbox the same way they work in GitHub Actions.

This should be reported at https://github.com/anthropics/claude-code/issues.

## Environment Details

- **Platform**: Claude Code on iOS (mobile app), `CLAUDE_CODE_ENTRYPOINT=remote_mobile`
- **Runtime**: Linux-based sandbox container (Linux 4.4.0)
- **Claude Code version**: 2.1.42
- **Available**: git, gh (v2.45.0), deno, node, python, cargo, go, bun
- **Working**: git push/pull/fetch via local proxy (`127.0.0.1:22998`)
- **Broken**: `gh` auth, `GITHUB_TOKEN`, any GitHub API write operation
- **Egress**: HTTPS proxy allows `api.github.com`, `github.com`, and many other hosts

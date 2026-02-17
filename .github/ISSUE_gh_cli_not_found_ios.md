# gh CLI not found when using Claude Code on iOS

## Problem

When using Claude Code on iOS (mobile app), commands that invoke the GitHub CLI (`gh`) fail with
errors like:

```
gh: command not found
```

This affects any workflow where Claude attempts to use `gh` for GitHub operations such as creating
issues, commenting on PRs, or viewing PR diffs.

## Diagnosis

### Root Cause

The Claude Code iOS environment runs in a sandboxed container that does **not** have the GitHub CLI
(`gh`) pre-installed. The `gh` binary is not present in `$PATH`:

```
$ which gh
gh not found

$ echo $PATH
/root/.local/bin:/root/.cargo/bin:/usr/local/go/bin:/opt/node22/bin:...:/usr/bin:/sbin:/bin
```

Additionally, no `GITHUB_TOKEN` or equivalent environment variable is available, so even after
installing `gh`, authentication remains an issue.

### Where `gh` is referenced in this repo

Two CI workflow files pre-approve `gh` commands for Claude Code:

1. **`.github/workflows/claude.yml`** (line 63) — the interactive `@claude` workflow:
   ```yaml
   claude_args: '--allowedTools "...Bash(gh issue create:*)"'
   ```

2. **`.github/workflows/ci.yml`** (lines 88-89) — the PR review workflow:
   ```yaml
   claude_args: |
     --allowedTools "...Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*),Bash(gh api:*),..."
   ```

These work fine in **GitHub Actions** (where `gh` is pre-installed and auto-authenticated on
`ubuntu-latest` runners), but fail when Claude Code runs in the **iOS sandbox environment** because
that environment lacks both `gh` and GitHub API credentials.

### Impact

When Claude Code on iOS attempts GitHub operations (e.g., creating an issue, commenting on a PR), it
encounters a hard failure. There is no fallback mechanism — the operation simply fails and Claude
must inform the user it cannot complete the task.

## Proposed Fixes

### Option 1: Install `gh` in the Claude Code iOS sandbox (upstream fix)

The ideal fix is for the Claude Code iOS runtime environment to include `gh` in its base image
(pre-installed and pre-authenticated), similar to how GitHub Actions runners include it. This would
need to be addressed by the Claude Code team at Anthropic.

### Option 2: Add a SessionStart hook to install `gh` on demand

Add a Claude Code `SessionStart` hook that detects and installs `gh` if missing:

```json
// .claude/settings.json
{
  "hooks": {
    "SessionStart": {
      "command": "bash -c 'if ! command -v gh &> /dev/null; then apt-get update -qq && apt-get install -y -qq gh 2>/dev/null; fi'"
    }
  }
}
```

The `gh` package is available in the default apt repositories in the iOS sandbox environment
(confirmed: `apt-get install gh` works), so installation is straightforward. However, authentication
remains a separate problem — `gh auth login` still requires a token.

### Option 3: Use GitHub REST API as a fallback

Instead of depending on `gh`, Claude can fall back to using `curl` with the GitHub REST API. The iOS
sandbox proxy allows HTTPS access to `api.github.com`. For example:

```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/OWNER/REPO/issues \
  -d '{"title": "...", "body": "..."}'
```

This still requires a `GITHUB_TOKEN` to be provisioned in the environment.

### Option 4: Provide `GITHUB_TOKEN` in the iOS sandbox environment

The core issue is that the iOS sandbox has **no GitHub API credentials**. Even with `gh` installed,
it cannot authenticate. The Claude Code iOS runtime should provision a scoped GitHub token (e.g.,
via GitHub App installation token) that allows basic operations like creating issues and commenting
on PRs.

## Environment Details

- **Platform**: Claude Code on iOS (mobile app)
- **Runtime**: Linux-based sandbox container (Linux 4.4.0)
- **Available by default**: git, deno, node, python, cargo, go, bun
- **Missing by default**: `gh` (GitHub CLI) — installable via `apt-get install gh`
- **Also missing**: `GITHUB_TOKEN` or equivalent env var for GitHub API auth
- **Proxy**: HTTPS egress proxy with `api.github.com` in allowed hosts (connectivity works, auth
  does not)

## Recommended Path Forward

**Short-term (this repo):** Option 2 — add a SessionStart hook to install `gh` on demand.

**Long-term (upstream):** Options 1 + 4 — the Claude Code iOS runtime should include `gh`
pre-installed and provide a scoped GitHub token for the connected repository. This should be
reported to Anthropic.

#!/usr/bin/env bash
# Run this locally to create the GitHub issue:
#   bash .github/ISSUES/create-issue.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
gh issue create \
  --title "Flatten monorepo: move Fresh app to project root" \
  --label "refactor" \
  --body-file "$SCRIPT_DIR/flatten-monorepo.md"

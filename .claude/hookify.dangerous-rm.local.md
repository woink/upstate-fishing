---
hookify:
  version: 1
  event: bash
  action: block
  pattern: "rm\\s+-rf|rm\\s+-r\\s|rm\\s+--recursive"
  description: "Block dangerous recursive rm commands"
---

# Dangerous rm Blocked

Recursive `rm` commands (`rm -rf`, `rm -r`, `rm --recursive`) are blocked to prevent accidental data loss.

If you need to remove a directory, ask the user to confirm and they can approve the action manually.

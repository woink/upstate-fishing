---
hookify:
  version: 1
  event: file
  action: warn
  pattern: "console\\.log\\(|debugger;?"
  description: "Warn when adding console.log or debugger statements"
---

# Debug Code Warning

You are adding `console.log()` or `debugger` statements to the code.

Before proceeding:
- Is this temporary debugging code? Remove it before committing.
- Consider using a proper logging utility instead of `console.log`.
- `debugger` statements should never be committed to the codebase.

---
hookify:
  version: 1
  event: stop
  action: warn
  pattern: ".*"
  description: "Remind to verify quality checks before stopping"
---

# Completion Checklist

Before finishing, verify the following:

- [ ] **Tests pass**: `deno task test`
- [ ] **Type-check passes**: `deno task check`
- [ ] **Lint + format clean**: `deno task lint` and `deno task fmt --check`
- [ ] **Frontend build** (if changed): `cd frontend && deno task build`

Do not stop until all applicable checks have been verified.

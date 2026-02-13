---
hookify:
  version: 1
  event: file
  action: warn
  conditions:
    file_path: "\\.env"
  description: "Warn when editing .env or similar secret-containing files"
---

# Sensitive File Warning

You are editing a file that may contain secrets or environment variables (`.env`).

Before proceeding:
- Ensure no secrets are being hardcoded (use 1Password references instead)
- Verify the file is in `.gitignore`
- Consider if this change should go in `.env.example` instead

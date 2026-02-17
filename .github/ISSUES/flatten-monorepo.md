# Flatten monorepo: move Fresh app to project root

**Labels:** refactor

---

## Problem

The project uses a monorepo-style directory layout (`src/` + `frontend/`) that dates back to when
Hono served as a separate backend API layer. The Hono backend was removed in #76 / #85, and Fresh
API routes now handle all endpoints directly. But the directory structure was never flattened to
reflect this.

What remains is:

- A root `deno.json` that mostly proxies commands into `frontend/`
  (`"dev": "cd frontend && deno task dev"`)
- A `frontend/deno.json` with a `@shared/` alias pointing up a level (`"@shared/": "../src/"`)
- Two separate type-check steps in CI (`deno check src/**/*.ts` and `cd frontend && deno check ...`)
- Two separate test steps in CI (backend `tests/` vs `cd frontend && deno test tests/`)
- A deploy workflow that does `cd frontend && deno task build` and `working-directory: frontend`

There is no longer a separate backend server — this is just a Deno Fresh app with a shared library
directory. The nesting adds unnecessary indirection and makes onboarding, CI config, and deployments
more confusing than they need to be.

## Proposed structure

```
upstate-fishing/
├── deno.json              # Single, merged config
├── dev.ts                 # Fresh dev entry (was frontend/dev.ts)
├── main.ts                # Fresh prod entry (was frontend/main.ts)
├── fresh.config.ts        # (was frontend/fresh.config.ts)
├── fresh.gen.ts           # (was frontend/fresh.gen.ts)
├── tailwind.config.ts     # (was frontend/tailwind.config.ts)
├── routes/                # (was frontend/routes/)
├── islands/               # (was frontend/islands/)
├── components/            # (was frontend/components/)
├── static/                # (was frontend/static/)
├── types/                 # (was frontend/types/)
├── lib/                   # (was frontend/lib/)
├── utils/                 # (was frontend/utils/)
├── src/                   # Shared library — stays in place
│   ├── models/
│   ├── data/
│   ├── services/
│   └── utils/
├── tests/                 # All tests unified under one dir
│   ├── services/          # (was tests/*.ts — backend service tests)
│   ├── routes/            # (was frontend/tests/)
│   └── e2e/               # (was frontend/e2e/)
└── .github/workflows/
```

The `@shared/` import alias stays (`"@shared/": "./src/"`) so all 26 files that use it need zero
import path changes — only the `deno.json` alias target loses the `../`.

> **Note:** The `@std/assert` version specifier differs between configs — root uses `^1` (semver
> range) while frontend uses `1` (exact major). The merged config should normalize to `^1` for
> flexibility.

## Implementation guide

### 1. Merge `deno.json` configs

Combine root and `frontend/deno.json` into a single config at the root. The merged file needs:

**Imports** — union of both, with `@shared/` pointing to `./src/` instead of `../src/`:

```jsonc
{
  "imports": {
    // Fresh + Preact + Tailwind (from frontend/deno.json)
    "$fresh/": "https://deno.land/x/fresh@1.7.3/",
    "preact": "https://esm.sh/preact@10.24.3",
    "preact/": "https://esm.sh/preact@10.24.3/",
    "@preact/signals": "https://esm.sh/*@preact/signals@1.3.0",
    "@preact/signals-core": "https://esm.sh/*@preact/signals-core@1.8.0",
    "tailwindcss": "npm:tailwindcss@3.4.16",
    "tailwindcss/": "npm:/tailwindcss@3.4.16/",
    "tailwindcss/plugin": "npm:/tailwindcss@3.4.16/plugin.js",
    "$std/": "https://deno.land/std@0.224.0/",
    "leaflet": "https://esm.sh/leaflet@1.9.4",
    "@astral/astral": "jsr:@astral/astral@^0.5",
    // Shared (from root deno.json — path unchanged)
    "@shared/": "./src/",
    "@std/assert": "jsr:@std/assert@^1",
    "@std/datetime": "jsr:@std/datetime@^0.225",
    "@std/testing/bdd": "jsr:@std/testing@1/bdd",
    "zod": "npm:zod@^3.23"
  }
}
```

**Compiler options** — merge strictness flags + JSX config:

```jsonc
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["./types/global.d.ts"]
  }
}
```

**Tasks** — no more `cd frontend`:

```jsonc
{
  "tasks": {
    "dev": "deno run -A --unstable-kv --watch=static/,routes/ dev.ts",
    "build": "deno run -A --unstable-kv dev.ts build",
    "preview": "deno run -A --unstable-kv main.ts",
    "test": "deno test --allow-net --allow-env --allow-read --allow-write --unstable-kv tests/",
    "check": "deno check --unstable-kv **/*.ts **/*.tsx",
    "lint": "deno lint",
    "fmt": "deno fmt",
    "e2e": "deno test --allow-all --unstable-kv tests/e2e/"
  }
}
```

Keep `nodeModulesDir`, `exclude`, `deploy`, `fmt`, and `lint` sections from both configs (merged).

### 2. Move files out of `frontend/`

```bash
# Fresh entry points & config
mv frontend/dev.ts frontend/main.ts frontend/fresh.config.ts \
   frontend/fresh.gen.ts frontend/tailwind.config.ts .

# App directories
mv frontend/routes frontend/islands frontend/components \
   frontend/static frontend/types frontend/lib frontend/utils .

# Tests — reorganize
mkdir -p tests/routes tests/e2e
mv frontend/tests/* tests/routes/
mv frontend/e2e/* tests/e2e/

# Clean up — only after verifying deno task dev, test, and e2e all pass
git rm -r frontend/
```

### 3. Fix imports in moved test files

- **`tests/routes/*.ts`** — these used relative imports like `../../routes/api/...`. Update to
  reflect new relative paths (e.g., `../routes/api/...`).
- **`tests/e2e/helpers/mod.ts`** — update the Fresh dev server start path if it references
  `frontend/`.
- **Backend tests in `tests/`** — already use `../src/` relative imports. These become `./` or stay
  unchanged depending on whether you nest them under `tests/services/`.

### 4. Update `fresh.gen.ts`

Fresh auto-generates this file. After moving, run `deno task dev` once to let Fresh regenerate
routes and island discovery with the new paths. Or manually update the import paths.

### 5. Update CI workflows

**`.github/workflows/ci.yml`:**

- Remove the separate "Type check (shared)" step — single `deno check` covers everything now
- Remove `cd frontend &&` prefixes from all steps
- Update E2E `hashFiles` path from `frontend/e2e/**` to `tests/e2e/**`
- Update test commands to use the unified `tests/` directory

**`.github/workflows/deploy.yml`:**

- Remove `cd frontend &&` from the build step
- Remove `working-directory: frontend` from the deploy step

### 6. Update `CLAUDE.md`

Rewrite the Architecture section to reflect the flat structure. Remove references to `frontend/`
subdirectory, `cd frontend`, and the two-config setup. Update all command examples, test layer
table, and E2E coverage map paths.

### 7. Update `.env.example`, `README.md`, and any other docs

Search for `frontend/` references across all non-code files and update.

## Files affected

| Category           | Count    | Notes                                                                        |
| ------------------ | -------- | ---------------------------------------------------------------------------- |
| `@shared/` imports | 26 files | No changes needed — alias stays the same                                     |
| Backend tests      | 9 files  | Move to `tests/services/` or keep flat in `tests/`                           |
| Frontend tests     | 8 files  | Move to `tests/routes/`, fix relative imports                                |
| E2E tests          | 7 files  | Move to `tests/e2e/`, update helper paths                                    |
| Fresh entry points | 5 files  | `dev.ts`, `main.ts`, `fresh.config.ts`, `fresh.gen.ts`, `tailwind.config.ts` |
| CI/CD workflows    | 2 files  | `ci.yml`, `deploy.yml`                                                       |
| Config files       | 2 files  | Merge two `deno.json` into one, delete `frontend/deno.lock`                  |
| Lock files         | 2 files  | Delete `frontend/deno.lock`, regenerate root `deno.lock`                     |
| Docs               | 2 files  | `CLAUDE.md`, `README.md`                                                     |

## Risks

- **`fresh.gen.ts` regeneration** — Fresh discovers routes/islands by convention. Must regenerate
  after moving.
- **Deno Deploy config** — the `deploy` section in `deno.json` may need `entrypoint` updated since
  the working directory changes.
- **Lock file** — will need a fresh `deno.lock` regeneration after merging configs.
- **E2E helper** — `tests/e2e/helpers/mod.ts` likely starts the dev server from a specific path;
  verify it works from the new root.

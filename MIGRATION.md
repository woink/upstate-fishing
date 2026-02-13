# Migration History

This repository was migrated from a self-hosted Forgejo instance on **2026-02-13**.

## What Was Migrated

### ✅ Git History
- All commits preserved
- All branches pushed (main + feature branches)
- Full commit history intact

### ✅ Issues
- All 45 issues migrated
- Open/closed states preserved
- Original issue numbers noted in each issue body
- Issue bodies and descriptions preserved

### ⚠️ Pull Request History
PRs cannot be directly migrated (GitHub doesn't support importing merge records). The PR history is documented below for reference.

### ❌ Not Migrated
- PR review comments (preserved on Forgejo)
- CI/CD workflows (Forgejo Actions → GitHub Actions conversion pending)
- Webhooks and integrations

## Original Forgejo Instance

**URL:** `http://100.78.158.46:3000/ward/upstate-fishing`

The Forgejo instance remains available for historical reference.

---

## Pull Request History

| PR | Title | Branch | Status |
|----|-------|--------|--------|
| #10 | feat: Frontend + Caching Layer | master → main | closed |
| #11 | feat(frontend): Deno Fresh app scaffold | feature/frontend → epic/mvp-v1 | merged |
| #12 | feat(cache): Deno KV caching layer | feature/caching → epic/mvp-v1 | merged |
| #13 | ci: Add Forgejo Actions CI workflow | feature/ci → main | merged |
| #24 | feat(proxy): add header forwarding and timeout handling | feature/proxy-headers → epic/mvp-v1 | merged |
| #25 | feat(types): add proper TypeScript declarations for Leaflet | feature/leaflet-types → epic/mvp-v1 | merged |
| #26 | refactor: extract repeated colors to shared constants | feature/color-constants → epic/mvp-v1 | closed |
| #27 | feat: add ExternalLink component with security attributes | feature/external-links → epic/mvp-v1 | closed |
| #28 | feat(cors): configure CORS properly with env-based origins | feature/cors-config → epic/mvp-v1 | closed |
| #29 | feat(ui): add skeleton loading components | feature/skeleton-loaders → epic/mvp-v1 | closed |
| #30 | feat(ui): add error boundary components | feature/error-boundaries → epic/mvp-v1 | closed |
| #31 | feat(cache): add Cache-Control headers to API proxy | feature/cache-headers → epic/mvp-v1 | closed |
| #32 | epic: MVP v1 - Core API with Caching | epic/mvp-v1 → main | merged |
| #33 | test: Wei bot PR approval verification | test-branch → epic/mvp-v1 | closed |
| #41 | Epic: MVP v1 - Frontend Integration | epic/mvp-v1 → main | merged |
| #44 | Docs: Update README with CT waters and current status | issue/36-readme-ct-waters → main | merged |
| #45 | feat: Fix map rendering and add hatches page (#34, #35) | feature/34-35-hatches-map-fix → main | merged |

### Development Workflow

The project used an **epic branch workflow**:

1. **Epic branches** (`epic/mvp-v1`) collected related feature work
2. **Feature branches** (`feature/*`) were merged into epics
3. **Epics merged into main** when complete

Key milestones:
- **PR #32**: Core API with caching layer
- **PR #41**: Frontend integration (Deno Fresh + Islands)
- **PR #45**: Hatches page and map fixes

---

## Issue Number Mapping

GitHub issue numbers differ from Forgejo. Each migrated issue includes a header linking to the original.

**Note:** Cross-references in commit messages (e.g., `fixes #34`) refer to Forgejo issue numbers, not GitHub issue numbers.

---

*Migration performed by Wei (威) — OpenClaw agent*

# Docs CI and lint surface

GitHub Actions running on every PR touching `supabase/supabase`, plus
the deploy path. Confirm against the current `.github/workflows/` if
behavior surprises you.

Before adding a new lint job or CI check, **scan this list first** — see
[`adding-features.md`](./adding-features.md) "Reuse pipelines, don't fork them."

## PR flow

```
PR opened / updated
    │
    ├── docs_lint                  (MDX/content linting; required)
    ├── docs_lint_comment_external (posts results as PR comments for external PRs)
    ├── Docs Tests                 (pnpm test:docs on relevant docs code/spec changes)
    ├── TypeScript & Lint          (tsc + eslint)
    ├── Prettier                   (format check)
    ├── reviewdog                  (inline annotations)
    ├── Validate pull request      (PR metadata)
    └── Authorize Vercel Deploys → Vercel builds preview deploy → Preview on CDN

Merge to master
    └── Vercel → next build (with prebuild markdown generation) → deploy
```

## On every pull request

Workflows run in parallel against any PR touching the repo:

### 1. `docs_lint`

Primary docs-specific CI check. MDX/content linting for the docs. **Required
check before merging.** Backed by `supa-mdx-lint`.

### 2. Docs Tests (`docs-tests.yml`)

Triggered on relevant docs code/spec changes, including the generated scoped
PAT partials and their shared permission catalog. Runs on a Blacksmith 4-vCPU
Ubuntu runner with concurrency controls to cancel stale builds.

- Sparse checkout of `apps/docs`, `examples`, `packages`, `supabase`, and
  `patches`.
- Install pnpm (pinned hash).
- Set up Node.js from `.nvmrc`.
- `pnpm install --frozen-lockfile`.
- Regenerate the scoped PAT partials and fail if the committed output drifts.
- Run `pnpm run test:docs` (with dummy GitHub OAuth env vars to prevent local
  Supabase startup errors).

### 3. TypeScript & Lint (`typecheck.yml`)

TypeScript type checking and ESLint across the monorepo.

### 4. Prettier (`prettier.yml`)

Format checking across the whole repo including `apps/docs`.

### 5. `docs_lint_comment_external`

Companion to `docs_lint` that posts lint results as PR comments for external
contributors.

### 6. Authorize Vercel Deploys

Gates Vercel preview deployment on a GitHub-side check first. Prevents
arbitrary forks from triggering Vercel builds.

### 7. reviewdog

Inline code review annotations via reviewdog.

### 8. Validate pull request

PR metadata validation (title format, labels, etc.).

## Deployment (on merge to master)

Production deployment is handled by **Vercel**. Supabase employees branch the
repo directly rather than fork it, so CI checks auto-run and Vercel deploys
can be authorized without the external PR security gate.

Markdown for every guide is generated as a **prebuild task** so Vercel can
bundle it with middleware and functions — see
[`build-pipeline.md`](./build-pipeline.md) for the lifecycle.

The **Authorize Vercel Deploys** workflow is the glue between GitHub Actions
and Vercel: it runs first to approve the deploy, then Vercel picks it up and
builds/deploys the Next.js site to their CDN.

## Notable design choices

- **Sparse checkout** keeps CI fast by only pulling the relevant workspace
  packages.
- **Blacksmith runners** are used instead of standard GitHub-hosted runners
  for speed.
- All workflow steps use **pinned action hashes** rather than floating tags
  for supply chain security.

## Where to add a new check

Before adding a new GitHub Actions workflow:

1. **Can `docs_lint` absorb it?** — most MDX/content checks belong inside
   `supa-mdx-lint` configuration, not as a new workflow.
2. **Can `Docs Tests` absorb it?** — TypeScript / vitest checks for new
   functionality fit here.
3. **Is it cross-cutting?** — typecheck, prettier, and reviewdog already
   cover the cross-cutting cases.
4. **Last resort** — a new workflow file. Use a Blacksmith runner, sparse
   checkout, pinned action hashes, and a concurrency group. Add a clear
   trigger filter so it doesn't run on unrelated PRs.

## Vale and prose linting (future)

Chris Ward's wishlist (source: hiring conversations, not yet in the repo):

- Vale linting MCP server.
- Vale extension for VS Code.
- More async automation that doesn't block PR merges.

If adding prose linting, prefer async (commenting) checks over blocking ones
to keep merge cadence high.

## Related

- [`app-map.md`](./app-map.md) — what `pnpm test:docs` actually runs.
- [`build-pipeline.md`](./build-pipeline.md) — `prebuild` step that ships
  markdown to Vercel.
- [`adding-features.md`](./adding-features.md) — reuse existing pipelines
  before adding new ones.

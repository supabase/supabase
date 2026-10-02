# Bulk Redirects

Static redirects served by Vercel's edge layer via `vercel.json`'s `bulkRedirectsPath` configuration.

## Structure

- **blog.json** — Blog post redirects (`/blog/*`)
- **docs.json** — All documentation redirects:
  - Guides (`/docs/guides/*`)
  - References (`/docs/reference/*`)
  - Legacy paths (`/docs/library/*`, etc.)

## Adding Redirects

Add static redirects (simple `/old → /new` mappings with **no** `:path*`, `:match*`, or regex patterns) to the appropriate file. Vercel reads all `.json` files from this folder and serves them at the edge.

## Markdown Variants

**`docs-redirects-md-variants.json` is a generated file — do not hand-edit it.**

It's derived from any `/docs/guides/` redirects in `docs.json`. For example:

- `/docs/guides/api/api-keys` → generates `/docs/guides/api/api-keys.md`

Regenerate it after changing `docs.json`:

```bash
pnpm run generate:docs-redirects-md-variants
```

CI fails the build if this file is out of sync with `docs.json` (see `.github/workflows/www-tests.yml`).

## Dynamic Redirects

Redirects with path matching patterns (`:path*`, `:match*`, regex) stay in `lib/redirects.js` and are handled by Next.js's `redirects()` function.

## Deployment

Vercel reads all `.json` files from this folder (via `vercel.json`'s `bulkRedirectsPath`) and serves them at the edge. There's no build-time generation step — `docs-redirects-md-variants.json` is committed directly, like `docs.json` and `blog.json`.

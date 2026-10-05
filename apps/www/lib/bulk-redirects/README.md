# Bulk Redirects

Static redirects served by Vercel's edge layer via `vercel.json`'s `bulkRedirectsPath` configuration.

## Structure

- **blog.json** — Blog post redirects (`/blog/*`)
- **docs.json** — All documentation redirects:
  - Guides (`/docs/guides/*`)
  - References (`/docs/reference/*`)
  - Legacy paths (`/docs/library/*`, etc.)

## When to use bulk redirects vs. dynamic redirects

Choose **bulk redirects** for **static, 1-to-1 mapped redirects** — simple `/old → /new` mappings with no path matching logic.

Choose **dynamic redirects** (in `lib/redirects.js`) for **pattern-based or conditional redirects** — paths with variables, broader pattern matching, or conditional logic.

### Bulk redirects (this folder)

✅ **Use for:** Static, fixed-path-to-path mappings

- `/docs/guides/old-page` → `/docs/guides/new-page`
- `/blog/old-post` → `/blog/new-post`

❌ **Don't use for:**

- Path patterns with variables (`:path*`, `:match*`, etc.)
- Regex patterns
- Conditional redirects

### Dynamic redirects (`lib/redirects.js`)

✅ **Use for:** Pattern matching and conditional logic

- `/images/customers/logos/light/:path*` → `/images/customers/logos/on-dark/:path*`
- `/images/customers/logos/:slug(?)` → `/images/customers/logos/on-light/:slug.png`

## Adding static redirects

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

## Deployment

Vercel reads all `.json` files from this folder (via `vercel.json`'s `bulkRedirectsPath`) and serves them at the edge. There's no build-time generation step — `docs-redirects-md-variants.json` is committed directly, like `docs.json` and `blog.json`.

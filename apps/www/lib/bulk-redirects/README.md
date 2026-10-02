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

The build process automatically generates `.md` variants for any `/docs/guides/` redirects in `docs.json`. For example:

- `/docs/guides/api/api-keys` → generates `/docs/guides/api/api-keys.md`
- This is written to `docs-md-variants.json` which Vercel also reads

## Dynamic Redirects

Redirects with path matching patterns (`:path*`, `:match*`, regex) stay in `lib/redirects.js` and are handled by Next.js's `redirects()` function.

## Deployment

The `prebuild` hook runs `generate-docs-md-variants.mjs` before each build, creating `.md` variants. Vercel then reads all `.json` files from this folder and serves them at the edge.

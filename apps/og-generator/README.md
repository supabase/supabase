# OG Image Generator

Internal, self-serve tool to generate two on-brand images for every
`supabase.com/blog` post — without opening Figma:

- **OG image** — 1200×630, dark mode, abbreviated headline (≤2 lines). The social share preview.
- **Thumb image** — same canvas & illustration system, no headline text.

Both are drawn programmatically (SVG → PNG via `satori`/`resvg`, through Next's
`next/og`) so output is pixel-exact and on-brand by construction.

> Status: **Phase 1 — render pipeline**. Proving correct 1200×630 PNG export
> (Manrope, safe areas, sentence-case, 2-line auto-fit) before building the
> editor UI. See the project brief for the full phase plan.

## Running it locally

From the **repo root** (`supabase/`):

```bash
pnpm install            # once, to register this app in the workspace
pnpm dev --filter=og-generator
```

Then open <http://localhost:3030>.

The rendered image endpoint is at:

```
http://localhost:3030/api/og?headline=Your%20headline%20here
```

## Architecture notes

- **Design is data, not pixels.** A "post" is a structured recipe; the PNG is a
  derived artifact regenerated on demand (brief §6.5). All colors/fonts resolve
  from `lib/design/tokens.ts` (the future `design_tokens` DB row) — never
  hardcoded hex.
- **Dark mode only** for these images (brief §4).
- The app chrome uses the shared Supabase design system (`config` + `ui`); the
  generated image uses our own independent token module.

## Not built yet (later phases)

Asset library + Supabase backend, multi-template system, Thumb variant,
contrast checker, AI art-direction, team auth. Each is called out in the brief's
build-phase ordering.

# OG Image Generator

Internal, self-serve tool to generate two on-brand images for every
`supabase.com/blog` post — without opening Figma:

- **OG image** — 1200×630, dark mode, abbreviated headline (≤2 lines). The social share preview.
- **Thumb image** — same canvas & illustration system, no headline text.

Both are drawn programmatically (SVG → PNG via `satori`/`resvg`, through Next's
`next/og`) so output is pixel-exact and on-brand by construction.

> Status: **v1 editor**. Full sidebar editor at `/` — AI art direction, 4
> templates, an icon library, background patterns, OG + Thumb output, WCAG
> contrast checks, and 1×/2× export. Uploadable assets + team auth land with the
> Supabase backend.

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

## AI art direction (optional)

The **Describe this post → Generate** panel suggests an on-brand icon, template,
and background for a post.

- **With a Claude API key** it reasons over the icon/template library and the
  featured examples (`lib/ai/examples.ts`) and picks the strongest composition.
- **Without one** it still works — it falls back to a keyword match over the
  seed icons, so the app is never blocked on a key.

To turn on the Claude-backed suggestions:

1. Create a key at <https://console.anthropic.com> → **Settings → API keys →
   Create key** (it starts with `sk-ant-`).
2. `cp .env.local.example .env.local` and paste the key after
   `ANTHROPIC_API_KEY=`.
3. Restart `pnpm dev`. Good suggestions now show a **✨ AI suggestion** label.

`.env.local` is git-ignored — the key stays on your machine and is only read
server-side (in `app/api/suggest`), never shipped to the browser.

## Architecture notes

- **Design is data, not pixels.** A "post" is a structured recipe; the PNG is a
  derived artifact regenerated on demand (brief §6.5). All colors/fonts resolve
  from `lib/design/tokens.ts` (the future `design_tokens` DB row) — never
  hardcoded hex.
- **Dark mode only** for these images (brief §4).
- The app chrome uses the shared Supabase design system (`config` + `ui`); the
  generated image uses our own independent token module.

## Not built yet (later phases)

Uploadable/shared **asset library**, persistence, and **team auth** — these need
the dedicated Supabase project (brief §3). The featured-examples corpus in
`lib/ai/examples.ts` becomes the `featured_examples` table there, read by the
same Claude-backed suggester as Design-approved precedent.

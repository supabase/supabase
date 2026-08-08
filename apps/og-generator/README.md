# Supaimage

Internal, self-serve tool to generate on-brand social images — without opening
Figma — for Supabase **and** its sub-brands (Multigres so far), across
multiple formats:

- **OG image** — 1200×630, dark mode, abbreviated headline (≤2 lines). The social share preview.
- **Thumb image** — same canvas & illustration system, no headline text.
- **Twitter / X post** — 1200×675, same layout system, sized for X's link-card preview.

Both Brand and Format are explicit, code-defined dimensions (`lib/design/brands/`,
`lib/design/formats.ts`) — adding a new sub-brand or platform format doesn't
touch the render/layout logic.

Every image is drawn programmatically (SVG → PNG via `satori`/`resvg`, through
Next's `next/og`) so output is pixel-exact and on-brand by construction.

> Status: **v1 editor**. Full sidebar editor at `/` — Brand + Format selectors,
> AI art direction, 4 templates, an icon library, background patterns, OG +
> Thumb output, WCAG contrast checks, and 1×/2× export. Uploadable assets are
> scoped per brand.

## Running it locally

From the **repo root** (`supabase/`):

```bash
pnpm install            # once, to register this app in the workspace
pnpm dev --filter=supaimage
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
- **Self-hosted (no paid API):** run a local [Ollama](https://ollama.com) model
  (`ollama pull llama3.1`) and set `OLLAMA_URL` in `.env.local` — same reasoning,
  nothing leaves your infrastructure. Engine order is Claude → Ollama → keyword.
- **Neither configured:** it still works — a keyword match over the icon library,
  so the app is never blocked.

To turn on the Claude-backed suggestions:

1. Create a key at <https://console.anthropic.com> → **Settings → API keys →
   Create key** (it starts with `sk-ant-`).
2. `cp .env.local.example .env.local` and paste the key after
   `ANTHROPIC_API_KEY=`.
3. Restart `pnpm dev`. Good suggestions now show a **✨ AI suggestion** label.

`.env.local` is git-ignored — the key stays on your machine and is only read
server-side (in `app/api/suggest`), never shipped to the browser.

## Supabase (optional backend)

The shared asset library, saved posts, and the editable featured-examples corpus
live in a Supabase project (brief §3). The app runs fully without it — bundled
seed data + local rendering — so this is opt-in.

To connect a project:

1. In `.env.local` set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   and (for server-side writes) `SUPABASE_SECRET_KEY` — from the dashboard →
   **Project Settings → API**.
2. Apply the schema: dashboard → **SQL Editor**, paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and
   **Run**. It creates the `featured_examples`, `assets`, and `posts` tables
   (+ RLS), the `og-assets` Storage bucket, and seeds the featured examples.
3. Restart `pnpm dev`. The suggester now reads featured examples from the DB,
   falling back to the bundled corpus if the table is empty or unreachable.

Only the URL + publishable key are needed for reads; the secret key is for
server-side writes (uploads) and never reaches the browser.

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

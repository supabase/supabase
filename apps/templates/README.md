# Supabase Templates

A gallery of example applications built on Supabase. Each example has a live, embedded preview, links to its source and a deploy guide, and a "Start from this" prompt to hand to a coding agent.

TanStack Start + React 19, Tailwind v4, and the shared `ui` / `ui-patterns` packages.

The page shell (header, mobile menu, footer, theme handling) follows `apps/kb`, which follows `apps/docs`: it is built from `ui-patterns/TopNav` and `ui-patterns/MobileNav`, with the wordmark plus a "TEMPLATES" label. It lives in `src/components/site/` and the pathless `src/routes/_site.tsx` layout. Nav menus are in `src/lib/nav.ts`.

```bash
pnpm dev --filter=templates    # http://localhost:3009/templates
pnpm test --filter=templates
pnpm build --filter=templates
```

## Base path and deploys

The app is served under `/templates` (`BASE_PATH` in `src/lib/base-path.ts` and `vite.config.ts`), so it can sit behind a `supabase.com/templates` rewrite in `apps/www`, the same way `apps/kb` sits at `/kb`. Use `withBasePath()` for any app-relative URL that isn't a router `Link`.

It deploys to the `supabase-templates` Vercel project (Supabase team) as a prebuilt Nitro output:

```bash
VERCEL=1 pnpm exec vite build
vercel deploy --prebuilt --scope supabase
```

## Adding an example

Create `src/data/examples/<slug>.ts` and export `example`. Files in that folder are registered automatically.

```ts
import { defineExample } from '../types'

export const example = defineExample({
  slug: 'photo-wall',
  title: 'Photo Wall',
  tagline: 'A shared photo wall your whole family can add to.',
  description: ['First paragraph.', 'Second paragraph.'],
  category: 'social',
  features: ['storage', 'auth', 'database'],
  stack: ['Next.js', 'Tailwind'],
  author: { name: 'Maya Okafor', url: 'https://github.com/…' },
  updatedAt: '2026-11-24',
  repoUrl: 'https://github.com/…',
  demoUrl: 'https://my-example.vercel.app', // embedded and linked as "Live demo"
  deploy: { deployUrl: '…', steps: ['…'], env: [{ name: 'SUPABASE_URL', description: '…' }] },
  featured: true,
})
```

Feature and category ids live in `src/data/types.ts`; add a new feature there and an icon in `src/components/FeatureBadge.tsx`.

## Screenshots and demos

Each example's `demoUrl` is its live deployment, embedded on the example page and linked as the live demo. The embedded app must allow framing (no `X-Frame-Options: DENY`, and a `frame-ancestors` policy that includes this site). Cards show screenshots of the live demo from `public/screenshots/<slug>-light.jpg` and `-dark.jpg`, swapped with the theme. After adding an example or changing its demo, run `pnpm --filter templates screenshots <slug>` to capture them (it uses your installed Google Chrome).

## Routes

| Route    | Purpose                                                             |
| -------- | ------------------------------------------------------------------- |
| `/`      | Gallery. Filters live in the URL: `?q=`, `?features=`, `?category=` |
| `/$slug` | Example page: preview, links, prompt, deploy steps, related         |

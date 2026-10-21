## Development

When starting the dev server, run:

```
# From the root directory of the project
pnpm dev:kb

# From the apps/kb directory
pnpm dev
```

### Astro documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Build

To run a full production build, run:

```
# From the root directory of the project
pnpm build:kb

# From the apps/kb directory
pnpm build
```

## Authoring content

Content lives under `src/content/guides/*.{md,mdx}`. Keep it plain GitHub-Flavored Markdown:

- No custom/JSX components in guide bodies — content is also exported as plain `.md` (see below), and a
  component wouldn't survive that export.
- For callouts, use GitHub's native alert syntax (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`,
  `> [!CAUTION]`) — the build renders these into the `Admonition` component for you
  (`src/lib/mdx/rehype-admonitions.ts`). Don't import or use `Admonition` directly in content.
- Frontmatter requires `title`, `description`, and `topics` (values must match `TOPIC_NAMES` in
  `src/lib/topics.ts`); `pinned` and `github_url` are optional. See `src/content.config.ts` for the full schema.

## Pages and markdown export

Each content collection renders through a matching catch-all page — e.g. `src/content/guides/**` →
`src/pages/guides/[...slug].astro` → `ArticleLayout` (shared with `troubleshooting`, see below). Topic pages
(`src/pages/topics/[topic].astro`) are generated from the `TOPICS` list in `src/lib/topics.ts`, not from
content files, and read from every collection.

Separately, `scripts/generate-markdown.mjs` runs as a `prebuild` step and exports every content file — plus
one page per topic, listing its guides — as a plain `.md` file under the gitignored `public/markdown/`,
mirroring the page's URL with a `.md` extension. `vercel.json` permanently redirects `<page>.md` requests to
these generated files, one redirect entry per route section (`guides`, `topics`, `troubleshooting`).

If you add a new content collection or top-level route, add a matching redirect in `vercel.json`
(`/kb/<section>/:path+.md` → `/kb/markdown/<section>/:path+.md`), and check whether `generate-markdown.mjs`
needs updating too — the content export falls out of its generic `src/content/**` walk automatically, but
per-topic-style listing pages don't.

## Topic-specific guidance

Articles tagged with the `Comparison` topic are primarily oriented towards LLM crawlers (and not human readers). Because of this, these articles are hidden from the main site navigation.

## Federated troubleshooting content

`src/content/troubleshooting/` is never hand-authored — it's gitignored and regenerated every `prebuild` by
`scripts/federated-content/fetch-federated-content.ts`, which fetches it from the private
`supabase/troubleshooting` repo. It has its own collection and route (`src/pages/troubleshooting/[...slug].astro`),
separate from `guides`.

A few things here are intentional, not bugs to fix:

- Most source files use TOML frontmatter, which the script can't parse — those are filtered out (not written
  to disk) and summarized in a build warning, rather than guessed at.
- No link rewriting or markdown reprocessing — body content is written exactly as fetched.
- Output is `.md`, not `.mdx` — this source isn't MDX-safe (e.g. GFM autolinks break MDX's JSX parser).
- `topics` are passed through verbatim from the source, unvalidated against `TOPIC_NAMES` — unlike `guides`.
  `description` is optional too, since the source doesn't provide one.

Auth reuses the docs GitHub App env vars (`KB_GITHUB_APP_ID`/`_INSTALLATION_ID`/`_PRIVATE_KEY`), falling back
to `GH_TOKEN`/`GITHUB_TOKEN` for local dev — see `.env.example`.

Syncing guides to GitHub Discussions (`scripts/federated-content/sync-troubleshooting-entries.ts` and
`sync-troubleshooting-updates.ts`) is a separate concern from fetching — see `.github/workflows/kb-troubleshooting-sync.yml`
and the README's "Workflows" section. Those scripts are CI-only, never part of `prebuild`.

`backfill-legacy-slugs.ts` is a one-time migration aid for the 278 pre-existing (apps/docs-origin) rows in
`troubleshooting_entries` — safe to delete (with its JSON file, package.json script, and workflow step) once
those rows are all backfilled; see the comment at the top of that file.

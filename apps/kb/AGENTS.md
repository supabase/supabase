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
`src/pages/guides/[...slug].astro` → `GuideLayout`. Topic pages (`src/pages/topics/[topic].astro`) are
generated from the `TOPICS` list in `src/lib/topics.ts`, not from content files.

Separately, `scripts/generate-markdown.mjs` runs as a `prebuild` step and exports every content file — plus
one page per topic, listing its guides — as a plain `.md` file under the gitignored `public/markdown/`,
mirroring the page's URL with a `.md` extension. `vercel.json` permanently redirects `<page>.md` requests to
these generated files, one redirect entry per route section (`guides`, `topics`).

If you add a new content collection or top-level route, add a matching redirect in `vercel.json`
(`/kb/<section>/:path+.md` → `/kb/markdown/<section>/:path+.md`), and check whether `generate-markdown.mjs`
needs updating too — the content export falls out of its generic `src/content/**` walk automatically, but
per-topic-style listing pages don't.

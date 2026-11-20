# Supabase Knowledge Base

This directory contains the [Astro](https://astro.build) app for the Supabase Knowledge Base, served at [supabase.com/kb](https://supabase.com/kb).

Content is organized into 4 collections:

- `src/content/guides/`: hand-written guides in Markdown or MDX, grouped by topic.
- `src/content/faqs/`: short answers to common questions.
- `src/data/community-guides.json`: Highlights other valuable, written resources from our Supabase community. Includes metadata on other written resources (URLs, titles, descriptions, and topics) so we can list these on `topics` pages.
- `src/content/troubleshooting/`: troubleshooting guides fetched from a private repo at build time (see below).

At build time, every page is also exported as a plain `.md` file, so the content can be read by LLM crawlers and other tools. Requests that send `Accept: text/markdown` receive these files directly.

Search is served by an API route in `api/search/`, backed by content indexed with `pnpm search:ingest`.

## Development

Run the dev server from the repository root or from `apps/kb`. It starts at http://localhost:3008/kb.

```sh
pnpm dev:kb   # from the root
pnpm dev      # from apps/kb
```

Other commands, run from `apps/kb`:

| Command        | Action                    |
| :------------- | :------------------------ |
| `pnpm build`   | Build the production site |
| `pnpm preview` | Preview the build locally |
| `pnpm test`    | Run unit tests (vitest)   |

To write or edit guides, and for details on the Markdown export and routing, see [`AGENTS.md`](./AGENTS.md).

## Federated troubleshooting content

`src/content/troubleshooting/` isn't hand-written — it's fetched from a private repo by
`scripts/federated-content/fetch-federated-content.ts` as part of the build (the `fetch:federated-content` task in `turbo.jsonc`)
and is gitignored. See `AGENTS.md` for how it works and what's intentionally left out for now.

### Contributing to troubleshooting articles

Troubleshooting articles (`/kb/troubleshooting/...`) aren't open for direct contributions. They go through an internal
review process before they're published.

> [!NOTE]
> You can still suggest a fix, comment on the article's GitHub Discussion (linked at the bottom of each article as
> "Go to the GitHub discussion"), or [open an issue](https://github.com/supabase/supabase/issues/new/choose) that
> links the article and describes the change. Pull requests for other `/kb` content, such as `src/content/guides/`,
> are welcome.

## Style guide

In general, follow all the existing guidelines in the [Docs Style Guide](https://github.com/supabase/supabase/blob/master/apps/docs/style-guide/README.md).

Additionally, stick to plain GitHub-Flavored Markdown:

- No custom/JSX components in guide bodies — content is also exported as plain `.md` (see below), and a
  component wouldn't survive that export.
- For callouts, use GitHub's native alert syntax (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`,
  `> [!CAUTION]`) — the build renders these into the `Admonition` component for you
  (`src/lib/mdx/rehype-admonitions.ts`). Don't import or use `Admonition` directly in content.
- Frontmatter requires `title`, but see `src/content.config.ts` for the full schema.

## Workflows

`.github/workflows/kb-troubleshooting-sync.yml` runs on pushes to `master` that touch `apps/kb/**` (or can be
triggered manually): it fetches troubleshooting content, creates a GitHub Discussion for any guide that doesn't have one yet
(`sync:troubleshooting-entries`), and pushes title/content updates to discussions whose guide has since
changed (`sync:troubleshooting-updates`). This is separate from kb's own build — it has real side effects
(creating/updating Discussions, writing DB rows), so it never runs as part of `pnpm build`.

## Tests

Unit tests (vitest) live next to the code they cover, including the search API (`api/search/_search.test.ts`;
the `_` prefix keeps Vercel from deploying it as a function). Run them from `apps/kb`:

```sh
pnpm test
```

`.github/workflows/kb-tests.yml` runs them on pull requests that touch `apps/kb`.

Functional smoke tests (Playwright) live in `e2e/kb` and cover the key `/kb` journeys: home → topic → guide,
troubleshooting articles, the markdown export (`.md` and `Accept: text/markdown`), and the search API
(production only, since previews don't have search configured). They run against
production by default. Install the browser once, then run from the repository root:

```sh
pnpm -C e2e/kb exec playwright install chromium
pnpm e2e:kb

# Against a preview or local build
PLAYWRIGHT_BASE_URL=https://<preview-url> pnpm e2e:kb
```

`.github/workflows/kb-e2e.yml` runs the smoke tests on pull requests against the PR's Vercel kb preview (or
production, when only `e2e/kb` changed), and daily against production. Run it manually with a `base_url` to test any other deployment.

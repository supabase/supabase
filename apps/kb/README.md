# Supabase Knowledgebase (human guidelines)

Welcome to the [Supabase Knowledgebase](https://supabase.com/kb), which serves as a home for troubleshooting, migration, and other types of content that don't quite fit in the [Supabase Docs](https://supabase.com/docs).

## Content

There are 3 buckets of content that live within the repo itself:

- **Guides**: Walkthroughs, migrations, comparison content, etc. Lives in `src/content/guides/**.mdx`.
- **FAQs**: Short, specific questions with direct answers. Lives in `src/content/faqs/**/**.mdx`.
- **Community resources**: Community-produced guides or tutorials on other websites. Lives at `src/data/community-guides.json`.

Additionally, the KB has **troubleshooting** topics (`src/content/troubleshooting/`), but this content lives in a private repo. See `AGENTS.md` for how it works and what's intentionally left out for now.

### Style guide

In general, follow all the existing guidelines in the [Docs Style Guide](https://github.com/supabase/supabase/blob/master/apps/docs/style-guide/README.md).

Additionally, stick to plain GitHub-Flavored Markdown:

- No custom/JSX components in guide bodies — content is also exported as plain `.md` (see below), and a
  component wouldn't survive that export.
- For callouts, use GitHub's native alert syntax (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`,
  `> [!CAUTION]`) — the build renders these into the `Admonition` component for you
  (`src/lib/mdx/rehype-admonitions.ts`). Don't import or use `Admonition` directly in content.
- Frontmatter requires `title`, but see `src/content.config.ts` for the full schema.

## Development

Requires Node >=22.23.4 and pnpm. Install dependencies from the repository root with `pnpm install`, then start the dev server at [http://localhost:3008](http://localhost:3008):

```sh
# From the root directory of the repository
pnpm dev:kb

# From the apps/kb directory
pnpm dev
```

Troubleshooting content is fetched from a private repo, so it's only available locally if you have access and credentials set. Copy `.env.example` to `.env.local`, then set `GH_TOKEN` to a literal token value (`.env.local` does not run shell commands). Alternatively, run `export GH_TOKEN=$(gh auth token)` in your shell before `pnpm fetch:federated-content`. Guides, FAQs, and community guides work without any extra setup.

To check a production build locally, you need the same private repo access and `GH_TOKEN` described above. The build runs `fetch:federated-content` first, so it fails without credentials:

```sh
# From the root directory of the repository
pnpm build:kb

# From the apps/kb directory
pnpm build
pnpm preview
```

### Tests

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

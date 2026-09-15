# Supabase Library

The library is the documentation and shadcn registry app for Supabase blocks and starter apps. Its workspace package name is `library`.

## Development and checks

Run these commands from the repository root with the repository's Node and pnpm versions:

```bash
pnpm --filter library dev
pnpm --filter library test
pnpm --filter library typecheck
pnpm --filter library lint
pnpm --filter library build
```

The development server runs at [localhost:3004/library](http://localhost:3004/library). `build:prepare` builds the registry first, then generates the HTML content, Markdown guides, and `llms.txt`. Markdown generation reads the completed registry, so these steps must retain that order. Type checking generates Next.js types before running TypeScript and works without a previous development build.

Registry JSON in `public/r` and the preview index in `__registry__` are generated and committed. Regenerate them with `pnpm --filter library build:registry`; do not edit them by hand. `.velite`, `public/markdown`, and `public/llms.txt` are generated build artifacts. Library CI runs the test suite, checks for registry drift, and builds the app.

## Authoring guides

Write documentation in `content/docs/<framework>/<slug>.mdx`, or `content/docs/starters/<slug>.mdx` for starter apps. Keep frontmatter for page metadata. Installation headings, prerequisites, commands, and follow-up instructions belong in the MDX body, in the order readers should follow them.

Use `BlockItem` for a registry installation command. Its name is the published registry item ID. React is the default; Vue and Nuxt pages must select the Vue CLI explicitly:

```mdx
## Installation

<BlockItem name="password-based-auth-nextjs" />

<BlockItem name="infinite-query-composable" framework="vue" />
```

The shared command helper supplies both the page and its Markdown export. Vue commands use an absolute registry URL so a fresh project does not need an `@supabase` alias. Put other commands in ordinary fenced shell blocks. Keep notes next to the command they explain. Use `showOpenInV0` on `BlockItem` when a block supports that action. For Vue and Nuxt blocks that need an existing Supabase client, link the client guide and include a conditional client-install command; let readers reuse an existing client.

The primary Copy prompt action points agents to the canonical `/library/docs/<framework>/<slug>.md` guide. It does not repeat installation commands. Starter prompts describe creating a new application; block prompts describe integrating into the existing project. The page also exposes a Markdown link.

The Markdown exporter reads the same MDX body, expands registry commands and file trees, and preserves resource summaries. Instruction-bearing MDX components need an explicit Markdown handler and a fixture in `scripts/library-mdx-to-markdown.test.ts`. Missing registry files, document references, or unsupported components fail generation.

Register discoverable blocks and starter apps in `config/library.ts` and the existing navigation definitions in `config/docs.ts`. The catalog test compares these routes with the actual content directory. Keep intentional omissions explicit in that test.

## Supabase types

From this directory, regenerate local database types with:

```bash
supabase gen types --local > registry/default/fixtures/database.types.ts
```

## What’s added

The overview shows four types of resources: tables, Edge Functions, API routes, and pages. It is generated from source files with the reusable `analyzeProjectResources` utility in `packages/common/project-resources`. The utility accepts root-relative paths and contents, performs no file or network access, and returns detected resources plus diagnostics. It has no React or registry dependency.

Registry generation finishes by building `__registry__/resources.json`. The analysis combines each block's files with its Supabase registry dependencies. The HTML diagram and Markdown export both read this generated inventory. No per-block resource declarations or relationship maps are needed. Blocks that only add components or helpers have an empty resource overview; their source files remain available in the Files tab.

Edge Function entrypoints identify one function regardless of its implementation file count. Postgres parsing identifies table creation statements in supplied migrations and schemas. Framework conventions identify pages and API routes. Detection covers the supplied setup files; it does not compare them with a user's live project or deploy resources. Diagnostics mark input that could not be analyzed completely.

Starter inputs are generated source snapshots in `registry/starter-sources/`, with source revisions recorded in each snapshot. Refresh them explicitly when updating a template:

```bash
pnpm --filter library update:starter-sources
pnpm --filter library build:registry
```

Pass a starter name to refresh only that source, for example `pnpm --filter library update:starter-sources flutter-starter`. The refresh reads public template repositories and the committed local Flutter example; ordinary builds work from the checked-in snapshots without network access. The overview links to the analyzed revision. Do not edit snapshots or `__registry__/resources.json` by hand.

Run `pnpm --filter common test:project-resources` for the standalone utility tests, or `pnpm --filter library test:architecture` for both utility and integration coverage.

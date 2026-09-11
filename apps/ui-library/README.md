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

The Markdown exporter reads the same MDX body, expands registry commands and file trees, and preserves architecture summaries. Instruction-bearing MDX components need an explicit Markdown handler and a fixture in `scripts/library-mdx-to-markdown.test.ts`. Missing registry files, document references, or unsupported components fail generation.

Register discoverable blocks and starter apps in `config/library.ts` and the existing navigation definitions in `config/docs.ts`. The catalog test compares these routes with the actual content directory. Keep intentional omissions explicit in that test.

## Supabase types

From this directory, regenerate local database types with:

```bash
supabase gen types --local > registry/default/fixtures/database.types.ts
```

## Block architecture

Add `showFiles` to `BlockOverview` to display the registry's folder tree and source code in a Files tab. Keep installation notes in the page body; the folder tree is rendered once in the overview. Markdown exports retain the tree and registry source link.

Wrap a block's preview in `<BlockOverview name="registry-item-name">`, or use a self-closing element for blocks without a preview. The shared overview reads the resolved registry definition, including its client files. Installed paths determine pages, routes, middleware, components, and helpers. Files under `supabase/functions/<name>` become one Edge Function.

The displayed overview summarizes application structure: pages, components, server routes, Edge Functions, and data resources. Client helpers, hooks, configuration, and other implementation files remain in the file tree. Use descriptive labels and explain each resource's purpose. Use `kind: "capability"` for a meaningful feature implemented across helper files, such as billing operations. Blocks that only supply helpers are summarized as one capability.

Declare resources that cannot be derived from file paths in the registry item's `meta.architecture.resources`, such as tables created by setup instructions, Storage buckets, or existing services. Each resource has an `id`, `kind`, and `label`; optional `description`, `files`, and `status` fields describe its provenance. Use `status: "existing"` for resources the block uses without creating them. Declared `files` can group or override resources inferred from those installed paths. SQL migration filenames do not imply that a table is created.

Use `meta.architecture.relationships` to connect resource IDs with `source`, `target`, and an optional `label`. Connections describe declared relationships; filenames alone do not imply runtime connections. See the [MCP definition](registry/default/blocks/mcp-server/registry-item.json) for an Edge Function connected to existing Auth, and [starter definitions](config/starter-architecture.ts) for tables and buckets supplied by templates. Run `pnpm test:architecture` to validate generation and documentation coverage.

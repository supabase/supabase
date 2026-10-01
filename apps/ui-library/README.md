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

The development server runs at [localhost:3004/library](http://localhost:3004/library). `build` and `dev` build the registry first, then generate the HTML content, Markdown guides, and `llms.txt`. Markdown generation reads the completed registry, so these steps must retain that order. Type checking generates Next.js types before running TypeScript and works without a previous development build.

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

The primary Copy prompt action points agents to the canonical `/library/docs/<framework>/<slug>.md` guide and asks them to prefer the guide's shadcn install command over copying files from registry JSON. It does not repeat installation commands. Starter prompts describe creating a new application; block prompts describe integrating into the existing project. The page also exposes a Markdown link.

The Markdown exporter reads the same MDX body, expands registry commands and file trees, and links each block's registry JSON as its source. Instruction-bearing MDX components need an explicit Markdown handler and a fixture in `lib/library-mdx-to-markdown.test.ts`. Missing registry files, document references, or unsupported components fail generation.

Register discoverable blocks and starter apps in `config/library.ts` and the existing navigation definitions in `config/docs.ts`. The catalog test compares these routes with the actual content directory. Keep intentional omissions explicit in that test.

## Supabase types

From this directory, regenerate local database types with:

```bash
supabase gen types --local > registry/default/fixtures/database.types.ts
```

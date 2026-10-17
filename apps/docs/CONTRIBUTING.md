# Contributing to Supabase docs

Our docs help developers to get started and keep succeeding with Supabase. We welcome contributions from everyone.

If you'd like to contribute, see our list of [recommended issues](https://github.com/supabase/supabase/issues?q=is%3Aopen+is%3Aissue+label%3Adocumentation+label%3A%22help+wanted%22). We also welcome you to open a PR or a new issue with your question.

How to write a docs page is covered by the [style guide](./style-guide/README.md). This file covers repo mechanics. If you write with an AI coding agent, these skills apply the style guide for you:

- `/write-the-docs` to draft a new page.
- `/edit-the-docs` to revise an existing page.
- `/test-the-docs` to run the snippets you wrote.
- `/review-the-docs` to check your work before you open a pull request.

See [AI agent skills for docs authoring](#ai-agent-skills-for-docs-authoring) for the full set, including the skills that help you frame a page and place it in the information architecture.

## Style guide

The [style guide](./style-guide/README.md) covers how to write a docs page: voice,
page structure, which components to use, and terminology. Start at its
[README](./style-guide/README.md) for what the guide covers and how the files are ordered.

| File                                                                     | Covers                                             |
| ------------------------------------------------------------------------ | -------------------------------------------------- |
| [`style-guide/WORD_LIST.md`](./style-guide/WORD_LIST.md)                 | Terminology, spelling, capitalization              |
| [`style-guide/01-voice-and-tone.md`](./style-guide/01-voice-and-tone.md) | Person, tense, sentence length, brevity            |
| [`style-guide/02-elements.md`](./style-guide/02-elements.md)             | Admonitions, code blocks, procedures, tabs, images |
| [`style-guide/03-page-structure.md`](./style-guide/03-page-structure.md) | Document type, section grouping, chunking          |

The rest of this file covers repo mechanics: where content lives, how to add a page,
and how the reference docs are generated.

## AI agent skills for docs authoring

Use these skills for every docs change you make with an AI coding agent: `/write-the-docs` to draft, and `/edit-the-docs` to revise an existing page. They apply the [style guide](./style-guide/README.md), so you don't have to hold it in your head.

Skills work in any agent that reads `.agents/skills/`, such as Claude Code, Cursor, or Codex. Invoke a skill with `/name`, for example `/write-the-docs`. The canonical files live in `.agents/skills/` (`.claude/skills` is a symlink).

### Write the docs skills

Use the [Write the docs](../../.agents/skills/pm-the-docs/reference/write-the-docs-checklist.md) checklist when product intent and code drive the change: net-new pages, or revising/restructuring existing ones.

| Skill                                                              | Checklist stage         | Use for                                                                                                          |
| ------------------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`pm-the-docs`](../../.agents/skills/pm-the-docs/SKILL.md)         | Frame / shape           | Audience, stage, why, content type, cross-repo scope (universe when you have Supabase org access, else OSS path) |
| [`ask-the-docs`](../../.agents/skills/ask-the-docs/SKILL.md)       | Frame / shape           | Docs-app architecture, IA placement, where content lives                                                         |
| [`write-the-docs`](../../.agents/skills/write-the-docs/SKILL.md)   | Draft                   | Draft or revise content grounded in intent and code                                                              |
| [`test-the-docs`](../../.agents/skills/test-the-docs/SKILL.md)     | Draft / self-review     | Run snippets in a Docker-isolated stack; verification report                                                     |
| [`review-the-docs`](../../.agents/skills/review-the-docs/SKILL.md) | Self-review / PR review | Checking a draft; verify a PR                                                                                    |

### Edit existing pages

Use [`edit-the-docs`](../../.agents/skills/edit-the-docs/SKILL.md) for style, structure, or brevity on an existing page when you are not changing the product story.

## Repo organization

Most docs pages are contained in the `apps/docs/content` directory. Some docs sections are federated from other repositories, for example [`pg_graphql`](https://github.com/supabase/pg_graphql/tree/master/docs). Reference docs are generated from spec files in the `spec` directory.

You can usually identify a federated or reference doc because it uses a Next.js dynamic route. For example, it might use `[[...slug]].tsx`. Look for the spec file import or the repo definition to find the content location.

Example spec file import:

```js
import specFile from '~/spec/transforms/analytics_v0_openapi_deparsed.json' with { type: 'json' }
```

Example repo definition:

```js
const org = 'supabase'
const repo = 'pg_graphql'
const branch = 'master'
const docsDir = 'docs'
const externalSite = 'https://supabase.github.io/pg_graphql'
```

Check the sections for [guide structure](#guide-structure) and [reference structure](#reference-structure) to learn more about the file structures.

## Guide structure

The Supabase docs use [MDX](https://mdxjs.com/). Guides are MDX documents that combine concise prose with structured procedures.

Adding a new guide requires:

- YAML frontmatter
- A navigation entry in a separate file

Frontmatter looks like this. `title` is mandatory. There are also optional properties that you can use to control the page display, including `subtitle`, `tocVideo`, and `hideToc`.

```yaml
---
title: How to connect to Supabase
hideToc: true
---
```

The navigation is defined in [`NavigationMenu.constants.ts`](https://github.com/supabase/supabase/blob/master/apps/docs/components/Navigation/NavigationMenu/NavigationMenu.constants.ts).

Add an entry with the `name`, `url`, and optional `icon` for your page.

## Reference structure

Reference docs are produced from the reference specs and library source code. A common spec file contains shared function and endpoint definitions, and library-specific spec files contain further details.

### Common spec file

Each type of library, such as a language SDK or CLI, has a common spec file. For example, see the [spec file for the language SDKs](https://github.com/supabase/supabase/blob/master/apps/docs/spec/common-client-libs-sections.json). This file contains definitions for the common SDK functions:

- `id`: Identifies the function
- `title`: Provides the human-readable title
- `slug`: Provides the URL slug
- `product`: Identifies the Supabase product that owns the function. For example, database operations are owned by `database`, and Auth operations are owned by `auth`.
- `type`: Uses `function` for a structured function definition or `markdown` for a prose explainer section

To add a new function, manually add an entry to this common file.

### Specific spec file

Each library also has its own spec file containing library-specific details. For example, see the [JavaScript SDK spec file](https://github.com/supabase/supabase/blob/master/apps/docs/spec/supabase_js_v2.yml).

The functions listed in this file match the ones defined in the common spec file.

Each function contains a description, code examples, and optional notes. The parameters are pulled from the source code via the `$ref` property, which references a function definition in the source code repo. These references are pulled down and transformed using commands in the spec [Makefile](https://github.com/supabase/supabase/blob/master/apps/docs/spec/Makefile). Unless you're a library maintainer, you don't need to worry about this.

If you're a library maintainer, follow these steps when updating function parameters or return values:

1. Merge your changes into the library's `master` branch.
2. Wait for the action to update the specification in the `gh-pages` branch.
3. Run `make` from `apps/docs/spec` in the `supabase/supabase` repository.
4. Verify the changes on your local documentation site.

## Content reuse

If you copy the same content multiple times across different files, create a **partial** for content reuse instead. Partials are MDX files contained in [`apps/docs/content/_partials`](https://github.com/supabase/supabase/tree/master/apps/docs/content/_partials). They contain reusable snippets that can be inserted in multiple pages. For example, you can create a partial to define a common setup step for a group of tutorials.

To use a partial, import it into your MDX file. You can also set up a partial to automatically import by including it in the `components` within [`apps/docs/features/docs/MdxBase.shared.tsx`](https://github.com/supabase/supabase/blob/master/apps/docs/features/docs/MdxBase.shared.tsx).

## Content listings

Overview and index pages use a single `<ContentListings id="..." />` component for curated link sections. For when to use one, see [the style guide](./style-guide/02-elements.md#content-listings). Refer to [`storage.data.ts`](data/content-listings/storage.data.ts) and [`storage.mdx`](content/guides/storage.mdx) for a full example.

**Prompt to add content listings:**

```text
Add a content listing block for [TOPIC] / [SECTION]. For example, use Storage / Examples.
Follow CONTRIBUTING § Content listings in apps/docs.
Copy structure from `storageGetStarted` in apps/docs/data/content-listings/storage.data.ts.
Pick a globally-unique kebab-case id like `[topic]-[section]`.
Run `pnpm test:local lib/content-listings.test.ts` from apps/docs.
```

**Manually add content listings:**

1. Add or update a `ContentListingGroup` export in [`data/content-listings/[topic].data.ts`](data/content-listings/). The `id` field must be globally unique across all listing groups. For example, use `storage-get-started` rather than `get-started`. The ID is both the lookup key and the telemetry `listingId`.
2. Place the component inline in guide MDX, for example `<ContentListings id="storage-get-started" />`. Use a partial only when the block is reused or gated with `$Show` at the partial level. For individual items that depend on a feature flag (for example `sdk:dart`), set `feature` on the item instead of wrapping the whole listing.
3. Run `pnpm test:local lib/content-listings.test.ts` from `apps/docs`.

Code snippets for manually adding content listings are available in [`.vscode/content-listing.code-snippets`](../../.vscode/content-listing.code-snippets). Use `cl-data` for a data export with a namespaced ID. Use `cl-inline` for an MDX component.

## Search

Search uses a Supabase instance. During CI, [a script](https://github.com/supabase/supabase/blob/master/apps/docs/scripts/search/generate-embeddings.ts) collects guides, reference documentation, and other content. The script creates OpenAI embeddings and stores the search index in a Supabase database.

Search combines native Postgres full-text search (FTS) with embedding similarity search based on [`pgvector`](https://github.com/pgvector/pgvector). At runtime, a PostgREST call invokes the weighted FTS RPC. An [Edge Function](https://github.com/supabase/supabase/tree/master/supabase/functions) runs the embedding search.

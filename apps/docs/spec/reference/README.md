# Reference content pipeline

This directory feeds the **new** reference-docs pipeline driven by
[`scripts/build-reference-content.ts`](../../scripts/build-reference-content.ts).
The setup lets you drop TypeDoc dumps, layer hand-authored content via
partials, and tweak ordering through `config.json`. Currently it only consumes
[TypeDoc](https://typedoc.org/) JSON output, but other formats can be adapted
to the same shape as a pre-step.

The legacy pipeline (the `spec/supabase_*_v*.yml` files plus
`spec/common-client-libs-sections.json` driven by
`features/docs/Reference.generated.script.ts`) still exists for SDKs that
haven't migrated yet — see "Routing to the new pipeline" below for how a lib
opts in.

## Pipeline at a glance

```
Upstream supabase-js packages publish TypeDoc JSON at
   https://supabase.github.io/<pkg>/v2/spec.json
                │
                │  (1)  cd apps/docs/spec && make download.tsdoc.v2
                ▼
   spec/reference/<lib>/<ver>/                              ← gitignored *.json
     ├── *.json            ← downloaded TypeDoc dumps         (committed: config.json
     ├── config.json       ← hand-authored                                 + partials/)
     └── partials/         ← hand-authored
                │
                │  (2)  pnpm codegen:references:new
                │       (= ensure dumps + build-reference-content.ts)
                ▼
   content/reference/<lib>/<ver>/                            ← gitignored (all 5 files)
     ├── bySlug.json
     ├── flat.json
     ├── sections.json
     ├── functions.json
     └── typeSpec.json
                │
                │  (3)  Next.js render
                ▼
   /docs/reference/<lib>/<ver>/<slug>
```

Both `spec/reference/<lib>/<ver>/*.json` (the source dumps) and the entire
`content/reference/` tree (the build output) are gitignored — only
hand-authored files inside `spec/reference/<lib>/<ver>/` (`config.json` and
`partials/`) are committed. Everything regenerates on `pnpm dev` / `pnpm build`
via `predev` / `prebuild`, so a clean checkout just works.

## Directory layout

```
spec/reference/
└── <library>/                  e.g. javascript
    └── <version>/              e.g. v2
        ├── *.json              TypeDoc spec files                       (GITIGNORED — downloaded)
        ├── config.json         Optional. Filters and ordering — see below   (committed)
        └── partials/           Optional. Per-section content                (committed)
            ├── *.mdx | *.md    Markdown partials (with frontmatter)
            └── *.json          Rich function-type partials (description, examples, …)
```

Library and version names come straight from the folder names. Anything you drop
under `spec/reference/<lib>/<ver>/` is picked up automatically by the build
script — there is no separate manifest to update inside this directory.

The output will be sent to the `content/reference/<lib>/<ver>/` directory
(also gitignored — see "Outputs" below).

## Source: TypeDoc JSON specs

Each top-level `.json` file (except `config.json`) is a TypeDoc dump of one
package. These files are **gitignored** — they're downloaded build artifacts,
not source. Only hand-authored files (`config.json` and `partials/`) are
tracked. To refresh the dumps locally:

```bash
cd apps/docs/spec && make download.tsdoc.v2
```

`pnpm dev` / `pnpm build` runs `codegen:references:ensure` automatically as
part of `predev` / `prebuild`. That script checks for
`spec/reference/javascript/v2/supabase.json` and, if missing, invokes
`make download.tsdoc.v2`. So a clean checkout just works — the dumps land on
first build and are reused on subsequent runs. To force a refresh after
supabase-js ships a release, run the make target by hand (or delete one of
the `.json` files and let the next build re-fetch).

CI runs the same path: `.github/workflows/docs-tests.yml` calls
`make download.tsdoc.v2` before tests, and `docs-js-libs-update.yml` opens a
PR with regenerated snapshots when supabase-js publishes a new version.

The build walks every declaration in those dumps and harvests anything tagged
with `@category` (and optionally `@subcategory`):

```jsonc
// spec/reference/javascript/v2/gotrue.json (excerpt)
{
  "name": "@supabase/auth-js", // ← package name, becomes the $ref prefix
  "variant": "project",
  "kind": 1,
  "children": [
    {
      "kind": 128,
      "name": "GoTrueClient",
      "children": [
        {
          "kind": 2048,
          "name": "linkIdentity",
          "comment": {
            "blockTags": [
              { "tag": "@category", "content": [{ "kind": "text", "text": "Auth" }] },
              { "tag": "@subcategory", "content": [{ "kind": "text", "text": "Auth MFA" }] },
            ],
          },
          "signatures": [
            {
              /* params + return type */
            },
          ],
        },
      ],
    },
  ],
}
```

Key tags the walker reads:

- `@category` — required for a declaration to appear in the listing. Becomes
  the `product` and groups items in `sections.json`.
- `@subcategory` — optional. Nests the declaration under a sub-grouping inside
  the category, with its own header.

Anything without `@category` is collected into `typeSpec.json` (for cross-reference
by `$ref`) but does **not** appear in the navigation/section list.

`$ref` values are constructed as `<package>.<module…>.<class…>.<member>`,
following TypeDoc's module (kind 2), namespace (kind 4), class (kind 128) and
interface (kind 256) nesting. The `index` module segment is stripped via
`normalizeRefPath` (so `@supabase/storage-js.index.StorageClient.foo` becomes
`@supabase/storage-js.StorageClient.foo`).

## Partials

Partials enrich the rendered output with content TypeDoc can't supply
(intro paragraphs, code examples, etc.). The filename (without extension) is
the routing key:

- Matches a **subcategory title slug** (e.g. `using-filters.json` for the
  "Using filters" subcategory) → attached to that subcategory.
- Matches a **category title slug** (e.g. `auth.json` for the "Auth" category)
  → attached to that category.
- Anything else → emitted at the **top of the page**, before any category
  (this is how `introduction.mdx` / `installing.mdx` work).

The slug check is `title.toLowerCase().replace(/\s+/g, '-')`, so
`"Auth Admin"` → `auth-admin`, `"File Buckets"` → `file-buckets`, etc.

### `.mdx` / `.md` partials (markdown)

Frontmatter is parsed via `gray-matter`. Only `title` and `ref` are read:

```mdx
---
title: Initializing
ref: '@supabase/supabase-js.SupabaseClient.constructor' # optional — see below
---

Body content goes here.
```

- **Without `ref`**: emits a `type: 'markdown'` entry. Its body is also written
  to `apps/docs/content/reference/<library>/<version>/<name>.mdx` so the
  renderer's routed loader (`getRefMarkdownForLib`) can serve it.
- **With `ref`**: emits a `type: 'function'` entry plus a `functions.json` entry
  `{id: <name>, $ref: <ref>}`. The renderer pairs that with `typeSpec.json` to
  show the method signature. This is how `initializing.mdx` links to the
  `SupabaseClient` constructor.

If the filename matches a category/subcategory, the markdown entry is added as
a **separate** sub-section at the top of that section's items (the subcategory
header itself is untouched).

### `.json` partials (function-type)

JSON partials carry rich content (description, notes, examples) that gets
rendered into the page. The full body is poured into `functions.json`:

````json
// spec/reference/javascript/v2/partials/using-filters.json
{
  "id": "using-filters",
  "title": "Using Filters",
  "description": "Filters allow you to only return rows that match …",
  "examples": [{ "id": "applying-filters", "name": "Applying Filters", "code": "```ts\n…\n```" }]
}
````

Routing semantics differ from markdown partials:

- **Matches a category/subcategory** → **enriches** that section's header.
  No separate sub-section is emitted. The entry is keyed in `functions.json`
  under the matched section's slug (e.g. `auth-admin`, `using-filters` —
  whichever slug the header resolves to, after `navigationPrefixes`), so the
  renderer's `fns.find(f => f.id === section.id)` resolves to the partial
  body and the subcategory header renders with the description/examples in
  place.
- **Top-level (no match)** → emitted as its own `type: 'function'` section.

This is why `auth-admin.json` (matching the `auth-admin` subcategory slug)
shows up as the _Auth Admin_ heading with notes and examples, instead of as a
sibling "Overview" block.

## `config.json`

Every option is optional. Default behavior: include everything, in spec order,
alphabetical-within-section.

```jsonc
{
  // Categories (matched on the literal @category text, case-sensitive) to
  // drop entirely. Functions in these categories are filtered out before
  // grouping, so they disappear from bySlug / flat / sections / functions.json
  // (but stay in typeSpec.json — partials may still reference them via $ref).
  "excludeCategories": ["Initializing"],

  // Declaration names (matched on the source identifier, case-sensitive) to
  // drop. Useful for hiding noise like `constructor` while still allowing
  // partials to link to the constructor's $ref.
  "excludeDefinitions": ["constructor"],

  // Order categories should appear in `sections.json` / `flat.json`. Anything
  // not listed here keeps its discovery order at the end.
  "categoryOrder": ["Database", "Auth", "Edge Functions", "Realtime", "Storage"],

  // Order top-level partials. Anything not listed here falls back to
  // alphabetical order at the end.
  "partialsOrder": ["introduction", "installing", "typescript-support"],

  // Customize the navigation slug used as a prefix for a category or
  // subcategory. Keys are the literal @category / @subcategory text
  // (case-sensitive). Values:
  //   string  → use this in place of the default slugified title.
  //             e.g. "Edge Functions": "functions" turns the function slug
  //             "edge-functions-invoke" into "functions-invoke".
  //   false   → drop the prefix entirely from child function slugs.
  //             e.g. "Using modifiers": false turns "using-modifiers-explain"
  //             into "explain". The category/subcategory header itself still
  //             needs a navigable slug, so its entry slug falls back to the
  //             slugified title ("using-modifiers").
  //   absent  → use the slugified title (default behavior).
  "navigationPrefixes": {
    "Database": false,
    "Using filters": false,
    "Using modifiers": false,
    "Edge Functions": "functions",
  },
}
```

### Slug shape

A function's slug is `${prefix}-${name}` where `prefix` is its nearest container
— its `@subcategory` if it has one, otherwise its `@category`. For example a
PostgREST `eq` method tagged `@category Database @subcategory Using filters`:

- without config: `using-filters-eq`
- with `"Using filters": false`: `eq`
- with `"Using filters": "filters"`: `filters-eq`

The category and subcategory header entries (the rows that show up in
navigation) get the resolved prefix too — `"Edge Functions": "functions"`
makes the Edge Functions category render at `/functions`, not `/edge-functions`.
`false` falls back to the title slug for the header (a header needs a stable,
navigable slug).

Within each category, the script always:

1. Emits the category header.
2. Emits direct functions (no `@subcategory`) alphabetically by name.
3. Emits each subcategory (alphabetical), each followed by its functions
   (alphabetical).

So `categoryOrder` lets you sort _across_ categories; within a category, order
is fixed.

## Outputs

`pnpm tsx scripts/build-reference-content.ts` writes five files per
`<library>/<version>` to `apps/docs/content/reference/<library>/<version>/`:

| File             | Shape                                  | Used for                                           |
| ---------------- | -------------------------------------- | -------------------------------------------------- |
| `bySlug.json`    | `Record<slug, Entry>`                  | Slug → section lookup                              |
| `flat.json`      | `Entry[]` (`Object.values(bySlug)`)    | Linear iteration in the renderer                   |
| `sections.json`  | `Entry[]` with nested `items[]`        | Sidebar navigation tree                            |
| `functions.json` | `Array<{id, $ref?, …}>`                | Rendered description / examples / signature lookup |
| `typeSpec.json`  | `{methods, variables}` keyed by `$ref` | Parameter and return-type display                  |

The build also writes `<partial-name>.mdx` files for each markdown partial into
the same per-version output directory — the page renderer's routed loader
(`getRefMarkdownForLib`) reads those bodies directly, no manual copy needed.

The whole `apps/docs/content/reference/` tree is gitignored — outputs are
regenerated by `prebuild` (`pnpm codegen:references:new`, which also runs as
part of `predev`).

## Regenerating the snapshot test

CI gates this pipeline through a single snapshot test at
[`scripts/build-reference-content.test.ts`](../../scripts/build-reference-content.test.ts).
It runs `collectReferenceContent('javascript', 'v2')` and snapshots all five
derived artifacts (`bySlug`, `flat`, `sections`, `functionsList`, `typeSpec`)
into `__snapshots__/build-reference-content.test.ts.snap`. Any change in the
output — new methods, slug shape, type signatures, section ordering — surfaces
as a snapshot diff in the PR, which is the **human-reviewable preview** of what
the renderer will see.

The snapshot is the only committable artifact this pipeline produces (the
TypeDoc dumps and `content/reference/` outputs are gitignored), so it doubles as
the change log for upstream and pipeline-logic changes.

Re-run with `--update` whenever you:

- Edit [`scripts/build-reference-content.ts`](../../scripts/build-reference-content.ts)
  (extraction or grouping logic).
- Change a lib's `config.json` (`excludeCategories`, `excludeDefinitions`,
  `categoryOrder`, `partialsOrder`, `navigationPrefixes`).
- Add, remove, or edit files under `partials/`.
- Pull a refreshed TypeDoc dump (`make download.tsdoc.v2`) — typically because
  supabase-js shipped a release. The `docs-js-libs-update.yml` workflow does
  this automatically and opens a PR with the refreshed snapshot.

```bash
cd apps/docs && npx vitest run --update scripts/build-reference-content.test.ts
```

Inspect the resulting diff before committing — a clean, additive diff (new
methods, new entries) is the expected shape; large renames or removals are
worth a second look.

> **Local failures in other tests are expected — don't panic.** Vitest picks up
> every `*.test.ts` in `apps/docs`, even when you target one file. Tests that
> hit the Supabase backend (`app/api/graphql/tests/errors*.test.ts`, the
> `errors.collection.test.ts` suite) will fail with `fetch failed` / timeouts
> unless you've run `pnpm supabase start` first, and any `*.smoke.test.ts` file
> will hit live `supabase.com/docs` URLs that depend on the current prod
> deploy. The only result that matters here is the `build-reference-content`
> line — if that's green and the `.snap` file updated, you're done. CI runs
> with the local Supabase stack up and excludes smoke tests, so those failures
> won't follow your PR.

## Routing to the new pipeline

By default, the runtime in
[`features/docs/Reference.generated.singleton.ts`](../../features/docs/Reference.generated.singleton.ts)
keeps reading the legacy `features/docs/generated/<sdk>.<version>.*.json`
files. To route a lib through the new outputs, add its `${sdk}-${version}` key
to the constant in
[`features/docs/Reference.constants.ts`](../../features/docs/Reference.constants.ts):

```ts
export const SUPPORTS_NEW_REFERENCE_PROCESS = new Set([
  'javascript-v2',
  // 'dart-v2',         ← uncomment when ready
])
```

The same set drives every runtime read that depends on the new layout:

- The four lib-version-keyed JSON getters in
  [`Reference.generated.singleton.ts`](../../features/docs/Reference.generated.singleton.ts)
  (`getFunctionsList`, `getReferenceSections`, `getFlattenedSections`,
  `getSectionsBySlug`) pick between
  `features/docs/generated/<sdk>.<version>.*.json` and
  `content/reference/<sdk>/<version>/*.json`.
- The MDX loader in [`Reference.mdx.tsx`](../../features/docs/Reference.mdx.tsx)
  (`getRefMarkdownForLib`) picks between
  `docs/ref/<libPath>/[<version>/]<id>.mdx` and
  `content/reference/<libPath>/<version>/<id>.mdx`.
- The legacy section-generation script
  [`Reference.generated.script.ts`](../../features/docs/Reference.generated.script.ts)
  filters out libs in the set, so no `supabase_<lib>_v<ver>.yml` is read for
  them. Migrated libs therefore drop their `specFile` field from
  [`content/navigation.references.ts`](../../content/navigation.references.ts)
  (see the JS v2 entry for an example).
- Search/embeddings ingest in
  [`scripts/search/sources/index.ts`](../../scripts/search/sources/index.ts):
  `fetchJsLibReferenceSource()` calls `loadClientLibReferenceFromNewPipeline()`
  which reads `content/reference/javascript/v2/{sections,functions,typeSpec}.json`
  directly. Other libs still go through `ClientLibReferenceLoader` against
  their YAML. To migrate another lib, swap the same way once it's in
  `SUPPORTS_NEW_REFERENCE_PROCESS`.

No other call sites in the render path need to change.

> ⚠️ Don't move the constant. `Reference.utils.ts` transitively pulls in
> `next/navigation`, which crashes `tsx --conditions=react-server` (used by
> `pnpm build:llms`). The constant lives in its own no-dep file
> (`Reference.constants.ts`) so server-only scripts can import it without
> dragging the Next runtime in.

## Adding a new lib/version (checklist)

1. **Wire up the TypeDoc download** in [`spec/Makefile`](../Makefile). Copy the
   `download.tsdoc.v2` target, adapt the URLs and output paths to
   `spec/reference/<lib>/<ver>/`. Make sure every public method in the upstream
   source has an `@category` tag. One JSON per package is fine — the walker
   handles multiple files. The dumps themselves are gitignored; only
   `config.json` and `partials/` get tracked.
2. **(Optional) add `config.json`** with `excludeCategories`,
   `excludeDefinitions`, `categoryOrder`, `partialsOrder`.
3. **(Optional) add `partials/`** with intro markdown and per-section rich
   content (see "Partials" above).
4. **Register the lib/version** in
   [`features/docs/Reference.constants.ts`](../../features/docs/Reference.constants.ts)'s
   `SUPPORTS_NEW_REFERENCE_PROCESS` so the runtime reads the new outputs.
5. **Run the build**:
   ```bash
   cd apps/docs && pnpm codegen:references:new
   ```
   This auto-downloads missing dumps via `codegen:references:ensure` and then
   runs `build-reference-content.ts`. Inspect the five files under
   `content/reference/<lib>/<ver>/`. The log line prints declaration /
   function / subcategory / category counts.
6. **Verify the rendered page** at `/docs/reference/<lib>/<ver>` in dev. If
   subcategory bodies are empty, check that the partial filename matches the
   subcategory title slug exactly (`title.toLowerCase().replace(/\s+/g, '-')`).

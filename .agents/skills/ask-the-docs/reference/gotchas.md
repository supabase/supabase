# `apps/docs` gotchas

Specific traps to watch for. One-liner per item.

## Markdown pipeline

- **JSX with no schema handler is unwrapped, not dropped.** Children pass
  through as plain markdown. If a component should disappear entirely from
  `.md` output, its handler must return `''`.
- **Handlers run bottom-up.** Children are already-serialized markdown
  strings by the time the parent handler sees them. Don't try to inspect
  child JSX from a parent handler — use `node.children` only for structure
  decisions.
- **`mdxFlowExpression` / `mdxTextExpression` / `mdxjsEsm` are skipped.**
  Anything wrapped in `{...}` won't appear in markdown output.
- **`<AiPrompt id="…" />` carries only an ID.** Prompt text lives in
  `data/ai-prompts.data.ts`; don't inline prompt strings in MDX. Markdown
  export handles the `PromptPanel` parts via
  `internals/markdown-schema/PromptPanel.ts` (drops `PromptCopy`).
- **`<$Partial>` recursion is silent.** A missing or unreadable partial is
  dropped without error. Check `partials/` paths when content seems missing
  from generated `.md`.
- **`$Partial` `variables` are runtime-only unless wired in markdown export.**
  `partialsRemark` substitutes `{{ .key }}` placeholders; `inlinePartials`
  in `generate-guides-markdown.ts` must do the same or nested partials like
  `path="{{ .prompt }}"` fail silently (file not found).
- **`GlassPanel` / `IconPanel` markdown handlers must include children.**
  A handler that returns only `props.title` drops nested content. See
  `internals/markdown-schema/Panel.ts`.

## Markdown handler authoring

- Handler files in `internals/markdown-schema/` must be named after the
  component (`ContentListings.ts`, not `Listings.ts`). The registry key in
  `generate-guides-markdown.ts` is the JSX element name.
- Use the existing `withDocsBasePath` / `addBaseUrlPrefix` from
  `internal-links.ts` for URL prefixing — don't roll your own.
- If a handler needs data, the **JSX prop carries an `id`** and the handler
  looks the data up from the same registry the runtime component uses. Don't
  serialize data into JSX props.
- Push a blank line right after each exported block (heading, description,
  list). Keeps handler logic linear and avoids redundant trailing-empty-line
  branches.

## React / MDX components

- `not-prose` is the canonical opt-out from the surrounding `.prose`
  typography. Wrap structural layout in `not-prose`; keep headings outside so
  they inherit prose styles.
- `<Heading>` from `MdxBase.shared.tsx` is the canonical heading. Don't roll
  your own `<h2>` / `<h3>` markup in MDX components — typography drifts.
- `<Link>` from `next/link` works with `target="_blank"` for external
  destinations. Don't construct `<a>` directly.
- A `useSendTelemetryEvent()` call inside a render path returns a function;
  don't invoke it directly inside the JSX, build a callback first.

## Data modules

- Shared zod schemas for MDX components should use HTML heading levels
  (`'h2'|'h3'|'h4'`), not markdown marker strings (`'##'`). Markdown markers
  belong only in `internals/markdown-schema/` handlers (via a `Record`/`Map`
  lookup).
- `getXById(id)` lookups belong in `*.utils.ts`, not in the data file or the
  schema file. Schema files hold schemas; data files hold data; utils hold
  functions.
- Each `.data.ts` exports named groups; the topic `index.ts` aggregates them
  into a `Record<id, group>` map. The aggregation file is the single source
  of truth for "all valid IDs."

## URL handling

- External-link detection is **not** just `/^https?:\/\//`. Protocol-relative
  (`//host`), `mailto:`, `tel:`, custom schemes — all external. Prefer
  `new URL(href, base)` or a broader regex.
- `withDocsBasePath('/guides/foo')` → `/docs/guides/foo`. Already-prefixed
  URLs are passed through. Use it consistently in markdown output to avoid
  broken links.

## Troubleshooting subtree

- `Troubleshooting.utils.common.mjs` is `.mjs` because the troubleshooting
  sync script can't resolve `.ts` imports cleanly. Don't convert it.
- Rebasing can resurrect a **stale** version of this file when you reset
  unrelated changes — verify against current `master` after
  `git checkout master -- <path>`.
- The `topics` enum in `TroubleshootingSchema` is hand-maintained. Adding a
  new product means updating that enum.

## Build / CI

- `pnpm build --filter=docs` runs markdown generation. A failure in
  `generate-guides-markdown.ts` blocks the build — read its console output
  rather than the cryptic CI error.
- `pnpm format` from the repo root catches most prettier drift. Run it
  before opening a PR; CI is unforgiving.
- Auto-import sorting can silently shuffle imports across files you didn't
  touch. Reset those files (`git checkout master -- <path>`) before pushing.

## Federated docs

See [`federated-docs.md`](./federated-docs.md) for the full surface — the
short version:

- **No GitHub App credentials in dev** = `$CodeSample` shows a warning, not
  real content. Don't assume the page is broken.
- **`pageMap` is manual.** Upstream renames break links until a maintainer
  updates the route file.
- **Wrappers pin to release tags** (`docs_v*.*.*`). If tagging breaks
  upstream, build fails.
- **Search and federated content interact poorly** — search infrastructure
  is currently decoupled from the markdown generation. See
  [`docs-app-direction.md`](./docs-app-direction.md).

## Reference pages

- SDK and CLI reference pages **don't go through the standard MDX path** —
  they're too long for the AST parser in preview environments. Generated
  from `spec/` instead, output to `features/docs/generated/**`.
- Reference page length is a known UX/LLM problem. Long-term plan: split
  into smaller modular pages. Management API is already one endpoint per
  page (DOCS-1268); see [`management-api-reference.md`](./management-api-reference.md).
- Management API Redocly bundle **omits `--dereferenced`** because of a
  circular `$ref`. Don't "fix" that by adding `--dereferenced` without
  checking codegen's cycle-safe `resolveRefs`.
- Don't propose Scalar/Redoc/Elements as the Management API page UI
  without covering markdown export, search, and `x-*` extension fields.

## PR hygiene

- No incidental import reorders or whitespace edits in a feature PR. Reset
  files that are conceptually unchanged.
- When resetting unrelated files (`git checkout master -- <path>`), verify the
  result matches current `master` — rebases can resurrect stale file versions.
- File names must match the primary export. Rename rather than aliasing on
  import.
- Single-use helpers stay in the consuming file. Don't add new files in
  unrelated folders for one-shot utilities.
- Two components with the same JSX shape and different classes → collapse
  with a discriminator prop. Don't ship near-duplicates.

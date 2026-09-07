# `apps/docs` known issues

What's currently broken, fragile, or intentionally being avoided. Read
this before depending on a piece of infrastructure for new work — if it's
listed here, expect it to change or fail in surprising ways.

Living document — update when a new fragility shows up in a PR or
incident.

## Federated documentation pipeline

**Severity:** load-bearing fragility. Affects daily builds.

The docs site fetches markdown from external repos at build/request time
(pg_graphql, vecs, wrappers, terraform-provider, setup-cli, splinter,
agent-skills). Treat as a liability:

- **Lack of oversight.** Quality control, linting, and formatting can't
  be enforced because the source code isn't owned.
- **Quality drift.** Inconsistent formatting, missing semicolons,
  structural differences between federated and in-house content.
- **Build brittleness.** Upstream fetches fail intermittently — retry
  logic (up to 5x) is in place to mitigate. Builds can still degrade or
  partially succeed.
- **Manual `pageMap`.** Upstream rename/remove → broken links until a
  maintainer updates the route file in `supabase/supabase`.
- **Wrappers pins to release tags** (`docs_v*.*.*`). If tagging breaks
  upstream, federated wrapper pages throw at build time.
- **Dev mode gaps.** Some federated routes return empty
  `generateStaticParams` in dev — pages may 404 locally unless hit via
  production build.

See [`federated-docs.md`](./federated-docs.md) for the full mechanics and
failure modes. Implication: **don't add new federated sources** without
strong justification; **don't extend federated patterns** to new content
types.

## Troubleshooting guides currently live in an external repo

**Severity:** ongoing sync issues.

This causes synchronization problems between the docs site and the source
of truth. Proposed direction: bring them in-house and require support
teams to contribute directly to `supabase/supabase` to ensure accuracy.

## Reference pages can't go through standard MDX

**Severity:** architectural constraint.

SDK & CLI reference pages (e.g. JavaScript SDK, CLI) use a different
rendering path than guides. Attempts to migrate them to MDX **failed
because their length exceeded memory limits for the AST parser in
preview environments.** They are generated from `spec/` instead, output
to `features/docs/generated/**`.

Implication: don't propose "unify everything under MDX" for reference
pages without addressing the memory ceiling first.

## Reference page length

**Severity:** UX and LLM usability issue.

Current reference pages are far too long, making them difficult for
human users to navigate and inefficient for LLMs to process. Long-term
goal: break them into specialized, modular pages for better readability
and performance.

Implication: new reference content should default to smaller, modular
pages.

## Search infrastructure is decoupled and considered broken

**Severity:** functional, but not trustworthy for new features.

Search relies on separate scripts and embeddings rather than the
consolidated markdown files (`build:guides-markdown` output). It is
decoupled from the main markdown-generation pipeline.

Implication: **don't build new features against the current search
infrastructure** assuming it's stable. Expect it to be reworked as part
of the refactoring direction.

## Error tracking and Sentry signal quality

**Severity:** noise-to-signal issue.

Sentry errors for slugs / 404s are often caused by:

- Bots scanning paths.
- Legacy URLs that no longer exist.
- Broken inbound links from external sites.

Error tracking and instrumentation are relatively new and
underdeveloped. Implication: **don't trust noisy Sentry signals as proof
of a real bug** without corroboration (reproduce locally, check the
referrer, etc.).

## Component dispersion

**Severity:** tech debt — accumulating cost, not a runtime failure.

React components for the docs app are inconsistently scattered across
multiple folders (`components/`, `features/docs/`, `features/ui/`,
`layouts/`, etc.). No canonical place for "this is a docs component."

Implication:

- Don't try to refactor the scatter as a side-quest in a feature PR.
- Place new components by following the closest existing analogue, not
  by inventing a new location.
- Prioritize understanding the immediate task over mastering the whole
  codebase.

## "One-to-one" markdown fidelity is aspirational, not enforced

**Severity:** ongoing improvement target.

The stated direction is one-to-one fidelity between rendered guides and
the markdown export produced by `generate-guides-markdown`. In practice,
gaps exist:

- Any MDX component without a `markdown-schema` handler is unwrapped to
  its children, which may not match the rendered output.
- `$Partial` recursion is silent — missing partials are dropped.
- Some components (interactive, JSX-expression-heavy) inherently can't
  serialize to markdown faithfully.

Implication: when adding a component that should appear in markdown
output, **always add a handler** in `internals/markdown-schema/` and
register it in `generate-guides-markdown.ts`. See
[`app-map.md`](./app-map.md) "The two pipelines."

## Related

- [`docs-app-direction.md`](./docs-app-direction.md) — where the
  refactoring is headed; what these issues are being driven toward.
- [`federated-docs.md`](./federated-docs.md) — full mechanics of the
  federation pipeline.
- [`gotchas.md`](./gotchas.md) — smaller per-change traps; this file
  is for load-bearing systemic issues.

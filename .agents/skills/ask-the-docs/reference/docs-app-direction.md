# `apps/docs` direction and vision

Where the docs app is heading and what new work should align with. For
the _current_ state of broken or fragile systems, see
[`known-issues.md`](./known-issues.md). For feature-design best
practices, see [`adding-features.md`](./adding-features.md).

## Refactoring vision

- **Docs-only project.** The long-term goal is for the documentation
  project to handle _only_ documentation. Other functionalities (specific
  APIs, etc.) should migrate to sub-projects.
- **Ongoing surface reduction.** A substantial portion of legacy
  critical code has already been refactored, and remaining work
  continues to reduce surface area rather than add to it.
- **One-to-one markdown fidelity.** Improvements to
  `generate-guides-markdown` aim for exact correspondence between the
  rendered guide and the LLM-oriented markdown export. New components
  that render in MDX should serialize to markdown with the same
  semantics.

## Working norms

- **Work inside `apps/docs/`, not the repo root.** Simpler terminal
  commands, clearer debugging scope. Most docs commands assume you've
  `cd`'d into the app.
- **AI use is encouraged** for explaining complex or legacy sections of
  the codebase. Considered effective for mechanical, non-creative tasks.
- **Historical context.** For decisions older than the current
  refactoring wave, check with longer-tenured maintainers — most
  current code has clearer provenance.

## What this means for new work

When proposing changes that touch `apps/docs`:

1. **Reuse existing seams before adding new ones.** Markdown export, MDX
   pipeline, lint, codegen, and federated fetch are all places where
   new surface area gets challenged. See
   [`adding-features.md`](./adding-features.md) "Inventory before you
   write."
2. **Keep markdown fidelity in mind.** Anything that changes how a
   guide renders should also change how it serializes to markdown — or
   have a clear reason it doesn't.
3. **Don't build against the broken parts.** See
   [`known-issues.md`](./known-issues.md). Search, Sentry
   instrumentation, and federated link handling are all in flux. New
   features should not depend on their current shape.
4. **Don't extend tech debt.** Component scatter, parallel pipelines,
   and bespoke render paths are existing problems — don't add to them.
5. **Refactor only what the feature requires.** Bundling unrelated
   cleanup into a feature PR muddies review and gets cut anyway. Open a
   separate refactor PR if the cleanup matters.

## Related

- [`adding-features.md`](./adding-features.md) — feature-design best
  practices.
- [`known-issues.md`](./known-issues.md) — what's currently broken or
  fragile.
- [`app-map.md`](./app-map.md) — where the existing seams are now.
- [`federated-docs.md`](./federated-docs.md) — mechanics of one of the
  known liabilities.

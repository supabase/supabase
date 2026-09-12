---
name: ask-the-docs
description: >-
  Answer questions about the Supabase docs app (apps/docs) using
  documented architecture, build pipeline, and review-pattern notes, and
  apply feature-design principles (codebase reuse, coding minimalism)
  when proposing or critiquing changes. Use when the user asks "how does
  X work in the docs app?", "where does Y live?", "is this approach OK
  for the docs app?", or before writing non-trivial changes under
  apps/docs/ — especially anything touching the MDX pipeline, markdown
  generation, content components, federated docs, or contributor-facing
  authoring patterns. Can answer architecture questions with Mermaid
  diagrams when helpful.
---

# Ask the docs-app librarian

A reference for `apps/docs` knowledge — architecture, build pipeline,
federated docs, known fragilities — plus the feature-design principles
the codebase rewards: **understand and reuse the existing code before
writing new code**, and **practice coding minimalism** to keep the
surface area small.

Two jobs:

1. **Look up what's already documented** about the docs app —
   architecture, tradeoffs, gotchas, prior decisions — instead of
   re-deriving from cold reads.
2. **Pre-empt review feedback** by applying the codebase-reuse /
   minimalism principles before opening a PR. Catches the "fix it in the
   next round" comments early.

## When to invoke

- User asks about `apps/docs` architecture, conventions, or behavior
  ("how does the markdown pipeline work?", "where do listings data files
  go?", "why does Troubleshooting have a `.mjs` utils file?").
- User asks about LLM/agent consumption (`llms.txt`, markdown negotiation,
  `searchDocs`, bulk exports, agent onboarding guides, humans vs agents vs
  crawlers, AI prompt blocks in quickstarts).
- About to write code under `apps/docs/` that touches: MDX components,
  `internals/markdown-schema/`, `generate-guides-markdown.ts`, content
  data modules, the lint pipeline, telemetry events, contributor-facing
  snippets, federated routes, reference codegen, or Management API /
  OpenAPI reference pages.
- Reviewing a docs-app PR and want a sanity check against the documented
  principles.

**Not for:** general Supabase docs _content_ questions (use
`work-linear-issue`, `audit-quickstarts`, etc.), or app-level work outside
`apps/docs/`.

## Answering with diagrams

Architecture and pipeline questions are often clearer with a diagram
than with prose. Default to including a **Mermaid diagram** in answers
about:

- The MDX runtime vs markdown-export pipeline split.
- Build flow (Turbo → pnpm `prebuild` / `build` / `postbuild` → Vercel).
- LLM/agent consumption surface (`llms.txt`, negotiation, bulk exports).
- Federated docs fetch flow.
- CI / PR flow.
- Component / data-registry relationships.
- Management API OpenAPI → codegen → reference page flow.

Mermaid fences (`` ```mermaid `````) render natively on GitHub and
most Markdown previewers. Several reference files already embed
Mermaid; reuse or adapt them rather than re-deriving.

Keep diagrams **small and one-topic**. If a diagram needs more than a
dozen nodes, split it.

## Reference files

Short, focused docs under `reference/`. Read whichever apply to the task
at hand — they cite each other where context matters.

| File                                                                               | What's inside                                                                                                                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`reference/adding-features.md`](./reference/adding-features.md)                   | Best-practices guidance for adding features to `apps/docs`. Inventory existing code first, pick the smallest viable shape, reuse pipelines.                              |
| [`reference/docs-app-direction.md`](./reference/docs-app-direction.md)             | Refactoring vision and working norms — what new work should align with.                                                                                                  |
| [`reference/known-issues.md`](./reference/known-issues.md)                         | Living list of broken, fragile, or in-flux systems. Check before depending on anything (federated docs, search, Sentry, reference-page architecture).                    |
| [`reference/app-map.md`](./reference/app-map.md)                                   | Architecture cheat sheet — directories, the two-pipeline (MDX runtime + markdown export) model, heading/typography contract, telemetry, lint entries.                    |
| [`reference/build-pipeline.md`](./reference/build-pipeline.md)                     | Turborepo + pnpm lifecycle steps for building `apps/docs` — codegen, prebuild, postbuild, Vercel deploy. Mermaid diagram included.                                       |
| [`reference/llm-agent-surface.md`](./reference/llm-agent-surface.md)               | Audience routing, `llms.txt`, content negotiation, bulk exports.                                                                                                         |
| [`reference/llm-agent-parity.md`](./reference/llm-agent-parity.md)                 | HTML↔markdown fidelity (e.g. AI prompts), search caveat, agent onboarding guides, in-flux wiring.                                                                        |
| [`reference/federated-docs.md`](./reference/federated-docs.md)                     | How docs pulls markdown from external repos at build time. Routes, `pageMap`, remark/rehype plugins, link transforms, known failure modes.                               |
| [`reference/ci-and-lint.md`](./reference/ci-and-lint.md)                           | GitHub Actions on every PR — `docs_lint`, `Docs Tests`, typecheck, prettier, Vercel preview gate. Where to add a check before creating a new one.                        |
| [`reference/management-api-reference.md`](./reference/management-api-reference.md) | Management API OpenAPI → reference generation, including scoped PAT permission tables; why not to swap in Scalar/Redoc.                                                  |
| [`reference/graphql-endpoint.md`](./reference/graphql-endpoint.md)                 | The `/api/graphql` endpoint under `apps/docs/resources/` — per-query folder layout, `rootSchema.ts`, connection/field utils, and the steps to add a new top-level query. |
| [`reference/search-embeddings.md`](./reference/search-embeddings.md)               | The `scripts/search/` embeddings pipeline behind `searchDocs` — content sources, processing flow, change detection, and the `page` / `page_section` tables.              |
| [`reference/gotchas.md`](./reference/gotchas.md)                                   | Specific traps to watch for. One-liner per item.                                                                                                                         |

## How to use during a chat

1. **Start by reading** `adding-features.md` and `app-map.md` if the
   question touches design choices or unfamiliar code paths. They're
   small on purpose — read both, don't skim.
2. **Verify before recommending.** Reference content may lag behind the
   live code. Confirm with the actual files (`apps/docs/...`) before
   acting on remembered claims about file paths, function names, or
   behavior.
3. **Cite the principle**, not just the rule. "Per `adding-features.md`
   § 'Reuse pipelines, don't fork them', this routes through the
   existing markdown-schema handler rather than introducing a side
   path."
4. **Reach for Mermaid** when explaining architecture, flows, or
   relationships — see [Answering with diagrams](#answering-with-diagrams).

## Updating the librarian

This skill lives in `.agents/skills/ask-the-docs/` in `supabase/supabase`.
When something in `apps/docs` changes in a way that makes a reference
file inaccurate, or a generally-applicable lesson emerges from a PR
review, open a pull request against this repo to update the relevant
file, same as any other in-repo change.

Keep each canonical file under ~250 lines; split before they bloat.
Capture only what a future contributor would benefit from knowing — if
a fact is already obvious from a quick read of the live code, don't
write it down.

## Related skills

- [`pm-the-docs`](../pm-the-docs/SKILL.md) — audience, stage, and
  cross-cutting scope calls (Frame stage of the "Write the docs" checklist,
  mirrored in `pm-the-docs`'s reference file). Cross-repo **product** lookup
  (universe) lives there, not in this skill.
- [`test-the-docs`](../test-the-docs/SKILL.md) — execute docs snippets against a
  Docker-isolated local stack; verification report.
- [`work-linear-issue`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/work-linear-issue/SKILL.md) — implementing
  assigned DOCS-\* tickets.
- [`review-the-docs`](../review-the-docs/SKILL.md) — reviewing open docs
  PRs with type-specific verification.
- [`audit-content-listings`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/audit-content-listings/SKILL.md) — batch
  conversion of overview pages to content listings.
- [`create-pull-request`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/create-pull-request/SKILL.md) — opening or
  updating a docs PR.

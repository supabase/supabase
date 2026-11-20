# Content-type gate

Before drafting anything, classify the request against `apps/docs`'s real content types. This is grounded in `ask-the-docs`'s `app-map.md` "Content types" table — re-check that table if this note and the live app-map ever disagree, since the app-map is the source of truth.

| Type | Location | Hand-authored by this skill? |
|---|---|---|
| **Guide / tutorial** | `content/guides/` | Yes — hand-written MDX, goal-oriented. This is the default case. |
| **Troubleshooting** | `content/troubleshooting/` | Yes, though some entries sync from GitHub issues — check before assuming a fresh page is needed. |
| **Reference** | Generated from `spec/` (OpenAPI, SDK YAML, CLI config) → `features/docs/generated/**` | **No.** Reference pages do not use the standard MDX path — see `ask-the-docs`'s `docs-app-direction.md` for why, and `management-api-reference.md` for the OpenAPI-specific spec → codegen → reference-page flow. |
| **Federated** | External repos, pulled at build time | No — out of scope for this skill; see `ask-the-docs`'s `federated-docs.md`. |

## What to do when the ask is actually Reference-type

A common trap: a ticket says "document the new `X` config option" or "add docs for the new API endpoint," which sounds like a normal doc-writing ask but is actually a spec change. If so:

1. Don't hand-draft an MDX reference page — it will diverge from or get silently overwritten by the next `generate-reference-markdown.ts` run.
2. Identify the correct spec source (`apps/docs/spec/` — OpenAPI, SDKSpec, ConfigSpec, or CLISpec depending on the surface).
3. Say explicitly in the handoff that the real fix is a spec/codegen change, not a docs PR from this skill, and point to `ask-the-docs` for the specific spec-editing workflow.

## When it's genuinely ambiguous

Some features span both — e.g. a new API endpoint (Reference) that also needs a task-oriented guide showing how to use it (Guide). In that case, split the work: flag the Reference-type piece per above, and draft only the Guide-type piece here.

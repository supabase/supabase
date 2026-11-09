---
name: pm-the-docs
description: >-
  Docs-PM decision support for the "Write the docs" authoring process —
  makes audience, stage, and cross-cutting scope calls during the Frame
  and Shape stages (including cross-repo product lookup via universe when
  accessible, else the public OSS path), and helps decide when a docs
  question needs to self-serve vs. escalate to a docs PM. Use when framing
  a new docs page or launch, deciding what product stage or audience a
  feature targets, judging whether a docs question needs PM sign-off, or
  confirming which product repos a launch spans.
---

# PM the docs

Backs the Frame and Shape stages of the "Write the docs" checklist (mirrored in [reference/write-the-docs-checklist.md](reference/write-the-docs-checklist.md)) — the audience, product-stage, and cross-cutting scope calls a docs PM would normally make before drafting starts.

## When to invoke

- Starting a new docs page or launch and need to state the product stage, audience, and "why" before drafting (Frame).
- Deciding content type, IA placement, or prerequisites for a page (Shape).
- Judging whether a launch spans multiple product repos (CLI, Auth, migrations, platform, …) — see [reference/universe-lookup.md](reference/universe-lookup.md).
- Unsure whether a docs question is self-serve or needs a docs PM's sign-off.
- Deciding whether a docs change should ship behind a feature flag or A/B test.

**Not for** drafting content itself (see [`write-the-docs`](../write-the-docs/SKILL.md)), restructuring existing pages (see [`edit-the-docs`](../edit-the-docs/SKILL.md)), running snippets (see [`test-the-docs`](../test-the-docs/SKILL.md)), or docs-app architecture/IA placement mechanics (see [`ask-the-docs`](../ask-the-docs/SKILL.md)).

## Reference files

| File                                                                           | What's inside                                                              |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| [reference/write-the-docs-checklist.md](reference/write-the-docs-checklist.md) | Six-stage authoring checklist mirror                                       |
| [reference/universe-lookup.md](reference/universe-lookup.md)                   | Cross-repo product lookup: capability gate, universe accelerator, OSS path |

## Answering a scope/stage/audience question

1. Read the relevant stage in [reference/write-the-docs-checklist.md](reference/write-the-docs-checklist.md) — its checkboxes state exactly what needs deciding.
2. Read whatever context exists for the feature: the linked issue/project, the PRD, the shipped code or PR. When code and PRD disagree, the code wins for behavior claims.
3. When scope may span services (CLI, Auth, migrations, Dashboard, platform, …), follow [reference/universe-lookup.md](reference/universe-lookup.md) **capability gate** before settling Frame/Shape; use universe only if accessible, otherwise the OSS path. Record which repos you searched.
4. Answer the checklist's questions directly: product stage, audience and job-to-be-done, the one-line "why," content type, IA placement, prerequisites.
5. Distinguish **confirmed fact** (stated in the ticket/PRD/code) from **inference** (your best read) — flag inference explicitly rather than presenting it as settled.
6. If a decision is genuinely open at the org level (not a docs authoring call), say so and name who should decide instead of inventing an answer to look complete.

## Self-serve vs. escalate

Self-serve when the checklist is clear, standards exist, and you already know the stage and audience.

Escalate to your docs team's PM when scope or stage is unclear, you need a review path, the bar is ambiguous, or the launch touches cross-cutting surfaces (quickstarts, API keys, tutorials, onboarding, platform concepts) — see the full "Ask the Docs PM" section in the checklist mirror.

A static `enabled-features` flag (show or hide content at build time) needs no PostHog flag and no A/B test. Add it in your PR by following the [enabled-features README](../../../packages/common/enabled-features/README.md). The flag file is shared with Studio and www, so keep changes to docs keys.

Experiment requests (a PostHog flag with A/B testing) depend on Supabase access. Run the [capability gate](reference/universe-lookup.md#capability-gate) first. Use the same `gh api repos/supabase/universe` probe.

- **Supabase org access:** Send the request to Docs Engineering through a DOCS issue in Linear. Docs Engineering creates and wires the PostHog flag, and you work with them to start A/B user testing. Read [Feature flag a docs change](https://app.notion.com/p/4105004b775f81bf810ddd5682284d23) (internal, staff only) for the process.
- **No access (OSS):** Do not tell the user to file a Linear issue or open the Notion page. Suggest the experiment in the PR description or a GitHub issue, and say why the change may need an A/B test. A Supabase team member decides and files the request. To preview a variant of a live experiment locally, add `?<flag>=<variant>` to the URL. Record `feature flags: staff-only (OSS)` in the Frame/Shape summary. This is a valid outcome, not a blocker.

For the code view, see [`ask-the-docs` `reference/feature-flags.md`](../ask-the-docs/reference/feature-flags.md).

## Related skills

- [`ask-the-docs`](../ask-the-docs/SKILL.md) — IA placement and docs-app architecture (Shape stage). Cross-repo **product** lookup lives here in `universe-lookup.md`, not in `ask-the-docs`.
- [`write-the-docs`](../write-the-docs/SKILL.md) — drafting once Frame/Shape are settled
- [`test-the-docs`](../test-the-docs/SKILL.md) — run snippets against a Docker-isolated local stack; verification report
- [`edit-the-docs`](../edit-the-docs/SKILL.md) — restructure and improve existing pages
- [`review-the-docs`](../review-the-docs/SKILL.md) — self-review and PR review stages

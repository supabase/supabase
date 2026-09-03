---
name: write-the-docs
description: >-
  Draft new or updated Supabase docs content for a feature or launch,
  grounded in product intent (Linear when available), a read of the actual
  code, and the docs style guide once one exists. Use when asked to write
  docs for a new feature, a product launch, or a Linear ticket that needs
  net-new content rather than a bug fix. Not for implementing existing docs
  bug reports — use work-linear-issue for that. Not for restructuring
  existing pages — use edit-the-docs for that.
---

# Write the docs

Drafts net-new Supabase docs content (or product-grounded rewrites) for a feature or launch. Distinct from [`work-linear-issue`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/work-linear-issue/SKILL.md), which implements and fixes existing docs tickets, and from [`edit-the-docs`](../edit-the-docs/SKILL.md), which restructures and tightens pages that already exist without gathering net-new product intent. This skill is for the case where the content doesn't exist yet (or must be rewritten from intent + code), grounded in four inputs rather than guessed.

## Core rules

1. **Gather before drafting.** Never draft from a ticket title alone. Pull all four inputs below first; a thin gather phase produces a draft that's wrong about how the feature actually works.
2. **Separate confirmed behavior from product intent from inference.** Code tells you what the feature does today. Linear/PRD/PRFAQ (or prior Frame/Shape output) tells you what it's meant to do and how it should be positioned. Anything you had to guess, flag explicitly rather than stating it as fact.
3. **Follow CONTRIBUTING.md and WORD_LIST.md for voice, terminology, and formatting only, never for content accuracy.** These are a style reference, not a source of truth: rule 2's Linear+code read is what governs what the page actually says. Don't silently invent voice/structure rules either; name the nearest existing-page precedent you followed instead (see [reference/style-fallback.md](reference/style-fallback.md)).
4. **Reuse, don't duplicate.** For docs-app architecture/placement questions, use [`ask-the-docs`](../ask-the-docs/SKILL.md) and [`audit-docs-ia`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/audit-docs-ia/SKILL.md) rather than re-deriving that knowledge here.
5. **Know what you're actually drafting.** Not everything that looks like "docs for a feature" is a hand-written page — see the content-type gate below before you start writing. If the ask is restructure, reorder, connective text, or clarity on an existing page (no new product story), use [`edit-the-docs`](../edit-the-docs/SKILL.md) instead.

## Phase 1 — Gather (read-only)

Four inputs, read in this sequence (sequence, not priority; Linear remains the product-intent source and code remains the behavior source per rule 2 and Phase 1 step 3):

1. **Style guide — voice/terminology reference.** Start with [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) and [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md) for voice, structure, and terminology. If those don't cover the case, fall back to the nearest comparable existing page under `apps/docs/content/` and say explicitly: _"no dedicated style guide yet — following the precedent of `<page>`."_ See [reference/style-fallback.md](reference/style-fallback.md).
2. **Linear — the ticket and its product context.** Linear is an internal Supabase tool: preferred when available, not required for open-source contributors. When a Linear issue is available, pull it, then its parent project/initiative description too (PRD, PRFAQ, RFC, or initiative narrative) and any PM comments. Product framing/positioning language usually lives one level up from the ticket, in the parent project or initiative description rather than the ticket body. Distinguish scope the ticket actually commits to from aspirational language in the PRD. If there is no Linear issue and no prior Frame/Shape product-intent output, stop drafting: ask internal authors for a Linear URL, otherwise hand off to [`pm-the-docs`](../pm-the-docs/SKILL.md) (Frame) and [`ask-the-docs`](../ask-the-docs/SKILL.md) when Shape/IA is unsettled. Resume only after product intent exists — never invent positioning, and never run Frame/Shape inside this Draft skill.
3. **Code.** Read the actual implementation before writing a single behavior claim — the PRD describes intent, the code describes what shipped. Check the Linear issue/project first for a linked `supabase/supabase` PR — its diff and description are the most precise "what actually shipped" source, more precise than a general codebase read. If no PR is linked, locate the feature directly in `supabase/supabase` (or the product's own repo), and apply [`ask-the-docs`](../ask-the-docs/SKILL.md)'s reuse/minimalism lens: understand what exists before describing it. When behavior spans services (CLI, Auth, migrations, platform, …), follow [`pm-the-docs`](../pm-the-docs/SKILL.md) → [universe-lookup](../pm-the-docs/reference/universe-lookup.md) **capability gate** (universe when accessible, else OSS public search / linked repos — not `ask-the-docs`). If code and PRD disagree, the code wins for behavior claims — flag the mismatch rather than silently picking one.
4. **Whatever else the author supplies.** Screenshots, example projects, related pages, Slack threads, a specific voice sample. Screenshots are for more than general context — use them to verify the _exact_ button/menu/field labels before writing instructional steps that reference them; a mismatched UI label is one of the easiest, most avoidable errors in a draft. Ask for these when the feature's user-facing shape is still unclear after 1–3, rather than guessing.

Summarize all four back to the requester before drafting: what's confirmed, what's product intent vs. shipped behavior, what's still a gap. Stop and ask if a real gap would change the draft's structure or scope.

## Phase 1.5 — Content-type gate

Before drafting, classify what's actually being asked for against `apps/docs`'s real content types (see [`ask-the-docs`](../ask-the-docs/SKILL.md)'s `app-map.md` "Content types" table, and [reference/content-type-gate.md](reference/content-type-gate.md) here):

- **Guide / tutorial** — hand-written MDX under `content/guides/`. This is what this skill drafts.
- **Troubleshooting** — hand-written MDX under `content/troubleshooting/`, sometimes synced from GitHub issues. Also in scope.
- **Reference** — generated from `spec/` (OpenAPI, SDK YAML, CLI config) → `features/docs/generated/**`. **Not hand-authored via the standard MDX path.** If the ask is actually reference-type content (a new API endpoint, config option, or SDK method that needs a reference entry), stop drafting MDX — it would diverge from or get silently overwritten by the generator. Instead point to the spec/codegen pipeline (`apps/docs/spec/`, `apps/docs/generator/`; see `ask-the-docs`'s `management-api-reference.md` for the OpenAPI-specific flow) and say so explicitly rather than producing a page that looks done but isn't the real fix.

When in doubt, ask `ask-the-docs` rather than guessing — this classification is the one call in this skill most likely to be wrong if made from outside knowledge of the app.

## Phase 2 — Draft

- Follow `apps/docs` MDX conventions (component usage, frontmatter, code sample wiring) — see [`ask-the-docs`](../ask-the-docs/SKILL.md) for the pipeline details rather than re-deriving them.
- Place the page using existing IA precedent; for a placement call that isn't obvious, consult [`audit-docs-ia`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/audit-docs-ia/SKILL.md)'s nav/IA knowledge rather than guessing a nav slot.
- **Wire it into navigation, not just onto disk.** Placement (which section) and nav enablement (whether it actually shows up) are separate — confirm the current nav-registration mechanism via `ask-the-docs`/`audit-docs-ia` rather than assuming a page is discoverable just because the file exists in the right folder.
- Ground every behavior claim in Phase 1's code read (the linked PR when there is one); ground every "why this matters" framing in Linear/PM context or prior Frame/Shape output; mark inferred material inline (e.g. an HTML comment or a flagged line in the handoff summary) so a reviewer can find it fast.
- **Write for timelessness.** Prefer documenting what exists now over promising future features. See [reference/common-pitfalls.md](reference/common-pitfalls.md#2-timeless-documentation).
- **Keep it concise and avoid redundancy.** See [reference/common-pitfalls.md](reference/common-pitfalls.md#4-redundancy-and-over-explanation).
- **Prefer paragraphs over single-item lists.** See [reference/common-pitfalls.md](reference/common-pitfalls.md#5-single-item-lists).
- **Strip internal business context before the final draft.** HTML comments flagging PRD intent, roadmap speculation, internal ticket discussions, or "gap-fill" notes must be removed from MDX before handoff. Open-source docs shouldn't expose internal planning. Flag assumptions and open questions for reviewers in the PR description instead, not in the shipped content.
- Search [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md) when introducing or reviewing technical terms, UI actions, abbreviations, and potentially ambiguous language during drafting. This targeted search supplements, but does not replace, the full-file compliance check in Phase 2.5.
- Reuse repeated content through `apps/docs/content/_partials/` instead of copying it. For nav wiring, partials, and file placement, see [`ask-the-docs`](../ask-the-docs/SKILL.md)'s `app-map.md` and `federated-docs.md`.

## Phase 2.5 — Review checklist

Before handing off, confirm:

- [ ] CONTRIBUTING.md / WORD_LIST.md followed, or precedent page named explicitly
- [ ] Every behavior claim traces to the code read (ideally the linked PR), not just the PRD
- [ ] Every "why it matters" / positioning line traces to Linear/PM context or prior Frame/Shape output, not invented
- [ ] Inferred or assumed material is flagged, not stated as fact
- [ ] Content type confirmed as Guide/Troubleshooting (not something that belongs in generated Reference instead)
- [ ] Nav placement and nav enablement both wired, not just the placement
- [ ] Internal links resolve; first-use of new terms/acronyms is defined
- [ ] If the draft has procedural snippets (CLI, SQL, client code, or example apps), **offered** to run [`test-the-docs`](../test-the-docs/SKILL.md) (optional; Docker Compose sandbox — stack profile for DB/API, examples profile for `example-app`)
- [ ] Future promises minimized where possible (timeless documentation principle)
- [ ] No unnecessary redundancy (same point restated multiple ways)
- [ ] Single-item lists avoided unless there's a specific reason
- [ ] Internal gap-fill and business context comments removed from MDX (keep only in PR description if needed for review)

### Compliance checklist

Re-read [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) and [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md) in full before handoff, not just the sections searched during drafting. When a dedicated style guide lands in the repo, extend this checklist to cover it too.

- [ ] Parentheses used only for acronyms or `(Optional)`, not prose asides
- [ ] Bold, italics, and code used only for their distinct purposes (UI labels, must-not-miss terms), not for visual emphasis alone
- [ ] No dash-based asides where a direct sentence reads better
- [ ] Terminology matches `WORD_LIST.md` (including any terms flagged as imprecise, not just spelling/capitalization)
- [ ] Headings, admonitions, and links follow CONTRIBUTING.md's "Styling, formatting, and grammar" and "Components and elements" sections

## Phase 3 — Handoff

This skill stops at a reviewable draft. It does not open worktrees or PRs itself:

- **Offer** [`test-the-docs`](../test-the-docs/SKILL.md) when the draft includes runnable procedural snippets. Ask before starting verification. Gate prerequisites **per artifact class** (Docker Compose stack profile for DB/API artifacts; examples profile / Node in-runner for `example-app`). If declined, or a required prerequisite for that class is missing, record `deferred` for those artifacts only and continue. When accepted, attach the Verification table to the PR body / self-review note.
- Then run [`review-the-docs`](../review-the-docs/SKILL.md) local self-review (lint/build/classify).
- Hand off to [`create-pull-request`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/create-pull-request/SKILL.md) (and [`work-linear-issue`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/work-linear-issue/SKILL.md) if the ticket needs a full worktree+PR flow) for the actual PR mechanics. Carry the Phase 1/2 flagged-assumptions list forward explicitly into that handoff — it belongs in the PR description (e.g. a "needs review" section) so a reviewer sees it, not just as an inline comment buried in the draft.
- If the feature is UI-driven and the PR will need screenshots/GIFs, flag [`proof-it-works`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/proof-it-works/SKILL.md) as the next step rather than capturing evidence here.
- Before opening the PR, run [`review-the-docs`](../review-the-docs/SKILL.md) local self-review: `pnpm lint:mdx`, `pnpm build:guides-markdown` where applicable, and anchor checks per [reference/drafting-mechanics.md](reference/drafting-mechanics.md).

## Additional resources

- Style / terminology: [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md), [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md), [reference/style-fallback.md](reference/style-fallback.md)
- Common pitfalls to avoid: [reference/common-pitfalls.md](reference/common-pitfalls.md)
- Drafting mechanics: [reference/drafting-mechanics.md](reference/drafting-mechanics.md)
- Content-type gate detail: [reference/content-type-gate.md](reference/content-type-gate.md)
- Existing-page restructure/clarity: [`edit-the-docs`](../edit-the-docs/SKILL.md)
- "Write the docs" checklist (Draft stage): [`pm-the-docs`](../pm-the-docs/SKILL.md)'s [reference/write-the-docs-checklist.md](../pm-the-docs/reference/write-the-docs-checklist.md)
- Cross-repo product lookup: [`pm-the-docs`](../pm-the-docs/SKILL.md) → [universe-lookup](../pm-the-docs/reference/universe-lookup.md)
- Runnable verification: [`test-the-docs`](../test-the-docs/SKILL.md)
- Docs-app architecture/placement: [`ask-the-docs`](../ask-the-docs/SKILL.md), [`audit-docs-ia`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/audit-docs-ia/SKILL.md)
- PR mechanics: [`create-pull-request`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/create-pull-request/SKILL.md), [`work-linear-issue`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/work-linear-issue/SKILL.md)
- Screenshots/proof: [`proof-it-works`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/proof-it-works/SKILL.md)

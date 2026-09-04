---
name: edit-the-docs
description: >-
  Restructure, reorder, and improve existing Supabase docs pages under
  apps/docs — clarity, connective text, section grouping, and brevity.
  Use when asked to edit, reorganize, restructure, tighten prose, add glue
  between sections, or split a page edit into stacked PRs. Not for net-new
  feature drafts (use write-the-docs) or PR triage/verification (use
  review-the-docs).
---

# Edit the docs

Improves **existing** Supabase docs pages: structure, order, connective text,
and clarity. Distinct from [`write-the-docs`](../write-the-docs/SKILL.md)
(draft net-new or product-grounded rewrites from intent + code) and
[`review-the-docs`](../review-the-docs/SKILL.md) (lint, build, PR triage).

A substantial page edit ships as a stack of pull requests, one change type per
PR, so a reviewer reads a style diff, a structure diff, and a technical diff
separately instead of one mixed blob. Phase 0 sizes the edit and decides how
many PRs it needs. Mechanics live in [reference/stacked-prs.md](reference/stacked-prs.md).

## Core rules

1. **Read before you rewrite.** Open the target page and nearby pages of the same type. Name the reader's goal and the page type (explainer, guide, tutorial, troubleshooting) before moving sections.
2. **Don't invent product truth — verify it, in its own PR.** Style and structure work preserves behavior claims, UI labels, and positioning as written. Correcting or adding claims is PR 3 and PR 4 work, and those PRs follow [`write-the-docs`](../write-the-docs/SKILL.md) grounding rules: read the code, separate shipped behavior from product intent, flag what you inferred.
3. **Follow CONTRIBUTING.md and WORD_LIST.md** for voice, terminology, and formatting. See [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) and [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md).
4. **Prefer brevity.** Prefer broad strokes when mechanical detail doesn't help the reader's task. Cut redundancy; don't over-explain.
5. **Reuse sibling skills.** IA/architecture via [`ask-the-docs`](../ask-the-docs/SKILL.md); validation and self-review via [`review-the-docs`](../review-the-docs/SKILL.md). Shared pitfalls live in [`write-the-docs/reference/common-pitfalls.md`](../write-the-docs/reference/common-pitfalls.md) — apply them, don't duplicate them.
6. **One change type per PR.** A branch that mixes reworded prose with moved sections is unreviewable: the reader can't tell a move from a rewrite. Size the split in Phase 0 and keep each branch to its own kind of change.

## Phase 0 — Size and split

1. Identify the document type per CONTRIBUTING.md (explainer, tutorial, guide, reference, or troubleshooting).
2. State the reader's goal and prerequisites in one or two lines.
3. Note structural problems: mixed information types interrupting a procedure, missing intro navigation on a long page, weak transitions, redundancy, or over-explained mechanics.
4. Sort the diagnosis into the PR buckets below. **Drop any bucket that comes back empty, and say so.** Four PRs is the maximum, not the target. A style edit plus a structural edit is the common shape: most pages that need restructuring are already technically correct, and PR 4 exists only when the author asks for it. A stack of two is a complete result, not a truncated one.
5. Know where the edit ends. **The edit is exactly the buckets that have content.** Any bucket you drop is beyond the edit, and a request for that change type afterward is a new request — including one you raise yourself. Name it, keep the open branches clean, and ask whether it belongs in this stack, in a separate ticket, or nowhere. Absorbing it into an open branch is what turns an edit into a rewrite.
6. Apply the split gate. Skip the stack and open a single PR only when all three hold:
   - The full edit is under roughly 150 changed lines.
   - No sections move.
   - No technical claim changes.

   Otherwise stack. When in doubt, stack. A reviewer can merge a stack quickly, but can't unmix a mixed diff.

7. Summarize the diagnosis and the proposed stack to the requester before starting, naming which buckets are empty and why.

## PR 1 — Style

Inline changes only: nothing in this PR moves a line from one place to another.

- Use second person, present tense, short paragraphs, and ordered steps for sequential actions.
- Put procedures in procedure format per CONTRIBUTING.md's **Procedures** section: an imperative verb to start each step, one action or a closely related set per step, 7 ± 2 steps per chunk, and named phases or smaller procedures for anything over nine steps.
- Crawl [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md) for the terms already on the page, not only the ones you introduce. An existing page is where nonconforming terminology accumulates.
- Apply the inline rules in CONTRIBUTING.md: admonitions, emphasis, links, lists, and the "Styling, formatting, and grammar" section.
- Cut restated points and mechanical over-explanation.
- Apply [`write-the-docs/reference/common-pitfalls.md`](../write-the-docs/reference/common-pitfalls.md): timelessness, no internal planning context in shipped MDX, redundancy, single-item lists, admonition restatement.
- Keep code samples executable in their stated context; mark intentionally omitted code. Prefer partials under `apps/docs/content/_partials/` over copied blocks.

## PR 2 — Structure

Apply the **Mixed information types**, **Navigation**, and **Cross-references and glue** guidance in [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) (Guides section), summarized here:

1. Classify substantial sections as contextual, procedural, or reference content. In a mixed page, group sections by information type so that context doesn't interrupt the procedural path.
2. Put sections covering the same topic under a shared heading.
3. For a long or mixed page, add a short introduction that links to its major section groups and tells readers when to use each one. Skip this navigation when a short page is already easy to scan.
4. Connect contextual sections to their corresponding procedures when useful. Add introductions to section groups, transitions between information types, and outcomes after procedures. Don't link every adjacent section.
5. When a topic outgrows one page — gauged by its navigation overflowing the sidebar — split it into multiple pages by information type. Update the navigation and cross-reference the new pages. Confirm the nav-registration mechanism through [`ask-the-docs`](../ask-the-docs/SKILL.md) rather than assuming it.
6. Move and regroup first; preserve meaning. Don't silently rewrite facts while restructuring. A pure set of moves is what makes this PR reviewable.

If nothing needs to move, PR 2 doesn't exist. A page can be well organized and still need a style pass. Drop the branch and say the structure held up.

## PR 3 — Technical revision

Validate the truth of the content and correct what's wrong.

**Change a claim only when leaving it would produce a wrong outcome.** A reader following the page would hit an error, get a different result than the page promises, or decide on a fact that isn't true. That's the test.

Leave it alone otherwise. Don't open PR 3 for imprecise but harmless phrasing, a claim you'd have worded differently, an accurate detail that isn't the newest way to do it, or a stale-looking value you can't verify against code. The last one is a note to the author, not an edit.

When a claim does fail the test, verify before you change it, per [`write-the-docs`](../write-the-docs/SKILL.md) Phase 1:

- Read the implementation. Prefer the diff of a linked `supabase/supabase` PR over a general codebase read.
- Where code and product intent disagree, code wins for behavior claims. Flag the mismatch.
- Flag anything you inferred in the PR description, not in the MDX.

If every finding fails the test, PR 3 is empty. Say what you checked and what you're deliberately leaving, then drop the branch from the stack. An empty PR 3 means verified and fine, not skipped.

Once you've dropped it, a technical concern raised later in the stack is a new request, per Phase 0 step 5. A page verified correct doesn't get reopened for a rewording.

## PR 4 — Additions (on request only)

This is the one bucket that's empty by default. The other three you scope from the diagnosis; this one exists only when the author asks for it.

**PR 4 is where additions go, so they stay out of the edit.** New content is a different job from editing what's already there. Keeping it on its own branch is what stops an edit from turning into a rewrite halfway through.

Never scope this PR yourself. Don't propose it from the diagnosis, and don't add it because the page looks thin.

When the author asks for new content mid-edit, or when you notice a real gap while working the earlier branches, say plainly that it's PR 4 material and keep the current branch clean. Then ask whether they want it in this stack, in a separate ticket, or not at all. Naming it as PR 4 is how you keep the conversation from reopening PR 1.

Once the author has asked for it:

- Crawl reader feedback for candidate gaps. Linear is an internal Supabase tool: preferred when available, not required for open-source contributors.
- Ground additions the same way as PR 3: read the code before making a behavior claim, and flag what you inferred.
- Strip internal business context — PRD intent, roadmap speculation, ticket discussion — before the draft ships. It belongs in the PR description, not in the MDX.

## Validate each PR

Run this before submitting each branch, not once at the end of the stack:

- [ ] The diff contains only this PR's change type
- [ ] Section groups follow information type; procedures aren't interrupted by long context
- [ ] Intro navigation present only when the page needs it; links resolve
- [ ] Connective text is selective, not link spam
- [ ] Voice matches CONTRIBUTING.md / WORD_LIST.md
- [ ] No invented behavior or positioning
- [ ] Shared pitfalls checklist considered

Mechanics (anchors, lint, format): follow [`write-the-docs/reference/drafting-mechanics.md`](../write-the-docs/reference/drafting-mechanics.md). Before renaming or rewording headings, grep for `#<old-anchor-slug>` under `apps/docs/content` and update matches. This is a PR 2 gate specifically, since that's the branch where headings move.

Then run [`review-the-docs`](../review-the-docs/SKILL.md) local self-review (`pnpm lint:mdx`, and `pnpm build:guides-markdown` when guides/explainers/tutorials changed).

## Additional resources

- Stacking mechanics: [reference/stacked-prs.md](reference/stacked-prs.md)
- Structure SoT: [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) (mixed types, navigation, glue)
- Structure ops: [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) — Guides: Mixed information types, Navigation, Cross-references and glue
- Procedure format: [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) — Procedures
- Pitfalls: [`write-the-docs/reference/common-pitfalls.md`](../write-the-docs/reference/common-pitfalls.md)
- Mechanics: [`write-the-docs/reference/drafting-mechanics.md`](../write-the-docs/reference/drafting-mechanics.md)
- Architecture/IA: [`ask-the-docs`](../ask-the-docs/SKILL.md)
- Net-new drafts: [`write-the-docs`](../write-the-docs/SKILL.md)
- Review, including bottom-up stack review: [`review-the-docs`](../review-the-docs/SKILL.md)

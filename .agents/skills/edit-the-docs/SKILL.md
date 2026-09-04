---
name: edit-the-docs
description: >-
  Restructure, reorder, and improve existing Supabase docs pages under
  apps/docs: clarity, connective text, section grouping, and brevity.
  Use when asked to edit, reorganize, restructure, tighten prose, add glue
  between sections, or split a page edit into stacked PRs. Not for net-new
  feature drafts, which belong to write-the-docs, and not for PR triage or
  verification, which belong to review-the-docs.
---

# Edit the docs

Improves **existing** Supabase docs pages: structure, order, connective text, and clarity.

**Not this skill:** [`write-the-docs`](../write-the-docs/SKILL.md) drafts net-new content or product-grounded rewrites from intent and code. [`review-the-docs`](../review-the-docs/SKILL.md) covers lint, build, and PR triage.

**Output is a stack of pull requests, one change type per PR.** A reviewer reads a style diff, a structure diff, and a technical diff separately instead of one mixed blob. Phase 0 sizes the edit and decides how many PRs it needs. Mechanics live in [reference/stacked-prs.md](reference/stacked-prs.md).

## Core rules

1. **Read before you rewrite.** Open the target page and nearby pages of the same type. Name the reader's goal and the page type before moving sections.
2. **Don't invent product truth. Verify it, in its own PR.** Style and structure work preserves behavior claims, UI labels, and positioning as written. Correcting or adding a claim is PR 3 and PR 4 work. Those PRs follow [`write-the-docs`](../write-the-docs/SKILL.md) grounding rules: read the code, separate shipped behavior from product intent, and flag what you inferred.
3. **Follow CONTRIBUTING.md and WORD_LIST.md** for voice, terminology, and formatting. See [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) and [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md).
4. **Prefer brevity.** Use broad strokes when mechanical detail doesn't help the reader's task. Cut redundancy. Don't over-explain.
5. **Reuse sibling skills.** Get IA and architecture from [`ask-the-docs`](../ask-the-docs/SKILL.md). Get validation and self-review from [`review-the-docs`](../review-the-docs/SKILL.md). Apply the shared pitfalls in [`write-the-docs/reference/common-pitfalls.md`](../write-the-docs/reference/common-pitfalls.md) rather than duplicating them here.
6. **One change type per PR.** A branch that mixes reworded prose with moved sections is unreviewable, because the reader can't tell a move from a rewrite.

## Phase 0: Size and split

1. Identify the document type per CONTRIBUTING.md. The types are explainer, tutorial, guide, reference, and troubleshooting.
2. State the reader's goal and prerequisites in one or two lines.
3. Note structural problems: mixed information types interrupting a procedure, missing intro navigation on a long page, weak transitions, redundancy, or over-explained mechanics.
4. Sort the diagnosis into the PR buckets below. **Drop any bucket that comes back empty, and say so.** Four PRs is the maximum, not the target. A style edit plus a structural edit is the common shape, because most pages that need restructuring are already correct. A stack of two is a complete result, not a truncated one.
5. Know where the edit ends. **The edit is only the buckets that have content.** Any bucket you drop is beyond the edit, and a later request for that change type is a new request. That includes one you raise yourself. Name it, keep the open branches clean, and ask whether it belongs in this stack, in a separate ticket, or nowhere. Absorbing it into an open branch is what turns an edit into a rewrite.
6. Apply the split gate. Skip the stack and open a single PR only when all three hold:
   - The full edit is under roughly 150 changed lines.
   - No sections move.
   - No technical claim changes.

   Otherwise stack. When in doubt, stack. A reviewer can merge a stack quickly, but can't unmix a mixed diff.

7. Summarize the diagnosis and the proposed stack to the requester before starting. Name which buckets are empty and why.

## PR 1: Style

Inline changes only. Nothing in this PR moves a line from one place to another.

**Rewrite:**

- Use second person, present tense, short paragraphs, and ordered steps for sequential actions.
- Put procedures in procedure format, per the Procedures section of CONTRIBUTING.md. Start each step with an imperative verb, keep one action or a closely related set per step, present 7 ± 2 steps per chunk, and group anything longer into named phases or smaller procedures.
- Apply the inline rules in CONTRIBUTING.md for admonitions, emphasis, links, lists, and the "Styling, formatting, and grammar" section.
- Keep code samples executable in their stated context, and mark intentionally omitted code. Prefer partials under `apps/docs/content/_partials/` over copied blocks.

**Cut:**

- Restated points and mechanical over-explanation.
- The shared pitfalls in [`common-pitfalls.md`](../write-the-docs/reference/common-pitfalls.md): timelessness, internal planning context in shipped MDX, redundancy, single-item lists, and admonition restatement.
- Terminology that doesn't match [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md). Crawl the list for terms already on the page, not only the ones you introduce. An existing page is where nonconforming terminology accumulates.

## PR 2: Structure

Apply the **Mixed information types**, **Navigation**, and **Cross-references and glue** guidance in the Guides section of [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md), summarized here:

1. Classify substantial sections as contextual, procedural, or reference content. In a mixed page, group sections by information type so that context doesn't interrupt the procedural path.
2. Put sections covering the same topic under a shared heading.
3. For a long or mixed page, add a short introduction that links to its major section groups and tells readers when to use each one. Skip this navigation when a short page is already easy to scan.
4. Connect contextual sections to their corresponding procedures when useful. Add introductions to section groups, transitions between information types, and outcomes after procedures. Don't link every adjacent section.
5. When a topic outgrows one page, split it into multiple pages by information type. Navigation that overflows the sidebar is the signal. Update the navigation and cross-reference the new pages. Confirm the nav-registration mechanism through [`ask-the-docs`](../ask-the-docs/SKILL.md) rather than assuming it.
6. Move and regroup first, and preserve meaning. Don't silently rewrite facts while restructuring. A pure set of moves is what makes this PR reviewable.

If nothing needs to move, PR 2 doesn't exist. A page can be well organized and still need a style pass. Drop the branch and say the structure held up.

## PR 3: Technical revision

Validate the truth of the content and correct what's wrong.

**Change a claim only when leaving it would produce a wrong outcome.** A reader following the page would hit an error, get a different result than the page promises, or decide on a fact that isn't true. That's the test.

**Leave it alone otherwise.** Don't open PR 3 for imprecise but harmless phrasing, a claim you'd have worded differently, an accurate detail that isn't the newest way to do it, or a stale-looking value you can't verify against code. The last one is a note to the author, not an edit.

When a claim does fail the test, verify before you change it, per Phase 1 of [`write-the-docs`](../write-the-docs/SKILL.md):

- Read the implementation. Prefer the diff of a linked `supabase/supabase` PR over a general codebase read.
- Where code and product intent disagree, code wins for behavior claims. Flag the mismatch.
- Flag anything you inferred in the PR description, not in the MDX.

**Run the snippets when the page has them.** Offer [`test-the-docs`](../test-the-docs/SKILL.md) before you start, and don't run it unasked. A snippet that fails in the sandbox is the most direct evidence a claim fails the wrong-outcome test, because the reader hits the same error. Attach the verification report to the PR body. If the author declines, record the artifacts as deferred and carry on with the code read.

Testing covers procedural content only. Claims that nothing executes, such as limits, defaults, and positioning, still need the code read above.

**If every finding fails the test, PR 3 is empty.** Say what you checked and what you're deliberately leaving, then drop the branch. An empty PR 3 means verified and fine, not skipped. A technical concern raised later in the stack is then a new request, per the boundary rule in Phase 0.

## PR 4: Additions, on request only

**PR 4 is where additions go, so they stay out of the edit.** New content is a different job from editing what's already there. Keeping it on its own branch is what stops an edit from turning into a rewrite halfway through.

**Never scope this PR yourself.** It's the one bucket that's empty by default. Don't propose it from the diagnosis, and don't add it because the page looks thin.

**Route requests into it instead.** When the author asks for new content mid-edit, or when you notice a gap while working the earlier branches, say that it's PR 4 material and keep the current branch clean. Then ask whether they want it in this stack, in a separate ticket, or not at all. Naming it as PR 4 is how you keep the conversation from reopening PR 1.

Once the author has asked for it:

- Crawl reader feedback for candidate gaps. Linear is an internal Supabase tool, preferred when available and not required for open-source contributors.
- Ground additions the same way as PR 3. Read the code before making a behavior claim, and flag what you inferred.
- Strip internal business context before the draft ships: PRD intent, roadmap speculation, and ticket discussion. It belongs in the PR description, not in the MDX.

## Validate each PR

Run this before submitting each branch, not once at the end of the stack:

- [ ] The diff contains only this PR's change type
- [ ] Section groups follow information type, and procedures aren't interrupted by long context
- [ ] Intro navigation is present only when the page needs it, and links resolve
- [ ] Connective text is selective, not link spam
- [ ] Voice matches CONTRIBUTING.md and WORD_LIST.md
- [ ] No invented behavior or positioning
- [ ] Shared pitfalls checklist considered

**Anchors.** Before renaming or rewording a heading, grep for `#<old-anchor-slug>` under `apps/docs/content` and update the matches. This is a PR 2 gate, since that's the branch where headings move.

**Lint and format.** Follow [`write-the-docs/reference/drafting-mechanics.md`](../write-the-docs/reference/drafting-mechanics.md). Then run the [`review-the-docs`](../review-the-docs/SKILL.md) local self-review: `pnpm lint:mdx`, plus `pnpm build:guides-markdown` when a guide, explainer, or tutorial changed.

## Additional resources

**Stacking:**

- Mechanics and `gh stack` commands: [reference/stacked-prs.md](reference/stacked-prs.md)
- Bottom-up stack review: [`review-the-docs`](../review-the-docs/SKILL.md)

**Style and structure:**

- Mixed information types, navigation, and glue: the Guides section of [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md)
- Procedure format: the Procedures section of [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md)
- Terminology: [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md)

**Sibling skills:**

- Pitfalls and drafting mechanics: [`common-pitfalls.md`](../write-the-docs/reference/common-pitfalls.md), [`drafting-mechanics.md`](../write-the-docs/reference/drafting-mechanics.md)
- Runnable verification: [`test-the-docs`](../test-the-docs/SKILL.md)
- Architecture and IA: [`ask-the-docs`](../ask-the-docs/SKILL.md)
- Net-new drafts: [`write-the-docs`](../write-the-docs/SKILL.md)

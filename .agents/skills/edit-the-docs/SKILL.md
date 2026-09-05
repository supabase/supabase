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
2. **Don't invent product truth. Verify it, in its own PR.** Style and structure work preserves behavior claims, UI labels, and positioning as written. Correcting a claim is PR 3 work, and adding one belongs to the additions branches above it. Those PRs follow [`write-the-docs`](../write-the-docs/SKILL.md) grounding rules: read the code, separate shipped behavior from product intent, and flag what you inferred.
3. **Follow CONTRIBUTING.md and WORD_LIST.md** for voice, terminology, and formatting. See [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) and [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md).
4. **Prefer brevity.** Use broad strokes when mechanical detail doesn't help the reader's task. Cut redundancy. Don't over-explain.
5. **Reuse sibling skills.** Get IA and architecture from [`ask-the-docs`](../ask-the-docs/SKILL.md). Get validation and self-review from [`review-the-docs`](../review-the-docs/SKILL.md). Apply the shared pitfalls in [`write-the-docs/reference/common-pitfalls.md`](../write-the-docs/reference/common-pitfalls.md) rather than duplicating them here.
6. **One change type per PR.** A branch that mixes reworded prose with moved sections is unreviewable, because the reader can't tell a move from a rewrite.

## Phase 0: Size and split

1. Identify the document type per CONTRIBUTING.md. The types are explainer, tutorial, guide, reference, and troubleshooting.
2. State the reader's goal and prerequisites in one or two lines.
3. Note structural problems: mixed information types interrupting a procedure, missing intro navigation on a long page, weak transitions, redundancy, or over-explained mechanics.
4. Sort the diagnosis into the PR buckets below. **Drop any bucket that comes back empty, and say so.** Style, structure, and technical revision take at most one branch each. Additions take as many as the content needs, so the stack has no fixed height. A style edit plus a structural edit is the common shape, because most pages that need restructuring are already correct. A stack of two is a complete result, not a truncated one.
5. Know where the edit ends. **The edit is only the buckets that have content.** Any bucket you drop is beyond the edit, and a later request for that change type is a new request. That includes one you raise yourself. Name it, keep the open branches clean, and ask whether it belongs in this stack, in a separate ticket, or nowhere. Absorbing it into an open branch is what turns an edit into a rewrite.
6. Apply the split gate. Skip the stack and open a single PR only when all three hold:
   - The full edit is under roughly 150 changed lines.
   - No sections move.
   - No technical claim changes.

   Otherwise stack. When in doubt, stack. A reviewer can merge a stack quickly, but can't unmix a mixed diff.

7. Summarize the diagnosis and the proposed stack to the requester, and **wait for confirmation before creating any branch.** Name which buckets are empty and why. When nobody is available to confirm, record the diagnosis in the bottom PR's body and carry on.

## PR 1: Style

Inline changes only. Nothing in this PR moves a line from one place to another.

**Rewrite:**

- Use second person, present tense, short paragraphs, and ordered steps for sequential actions.
- Put procedures in procedure format, per the Procedures section of CONTRIBUTING.md. Start each step with an imperative verb, keep one action or a closely related set per step, present 7 ± 2 steps per chunk, and group anything longer into named phases or smaller procedures.
- Apply the inline rules in CONTRIBUTING.md for admonitions, emphasis, links, lists, and the "Styling, formatting, and grammar" section.
- Keep code samples executable in their stated context, and mark intentionally omitted code. Prefer partials under `apps/docs/content/_partials/` over copied blocks.
- **Check the alt text on every image, and open the image to do it.** Alt text on an existing page usually names the topic rather than describing the picture, and a topic name is what the nearby heading already says. Describe what a reader who can't see it would need: the labeled parts, the relationships between them, and any values the diagram carries. This is a rewrite of existing text, so it belongs in this PR.

**Cut:**

- Restated points and mechanical over-explanation.
- The shared pitfalls in [`common-pitfalls.md`](../write-the-docs/reference/common-pitfalls.md): timelessness, internal planning context in shipped MDX, redundancy, single-item lists, and admonition restatement.
- Terminology that doesn't match [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md). Crawl the list for terms already on the page, not only the ones you introduce. An existing page is where nonconforming terminology accumulates.

## PR 2: Structure

Apply the **Mixed information types**, **Navigation**, and **Cross-references and glue** guidance in the Guides section of [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md).

**Work in this order, and settle the outline before you move a line.** A restructure invalidates every branch above it in the stack, so each revision costs a full restack, and a restack is where content gets dropped in conflict resolution. Reworking the shape twice costs far more than getting it right once.

### 1. Lock the headings other code links to

Grep the whole repo for `#<slug>` against every heading on the page, not just `apps/docs/content`. Studio renders Docs buttons that deep-link into guide anchors, and `apps/www` links into them too. Those are the matches that break a button in the product rather than a link between two pages.

Write the matched heading texts down. For the rest of this PR they are immutable. **Moving a section preserves its slug, and so does changing its level. Only renaming breaks it.** That is what makes an aggressive regroup safe.

### 2. Classify every substantial section

Each one is **procedural** (the reader performs actions), **contextual** (the reader needs to understand something before acting), or **reference** (the reader looks something up).

**Classify by what the reader is doing, not by what the section is about.** Subject matter is the trap: on a page about tables every section is "about tables", so grouping by topic produces one task-named bucket that quietly collects the background as well. A reader opens a section on schemas to understand something, not to do something, so it is context no matter how much it is about tables.

**A section serving two classes gets split, not filed under the larger half.** Give the new half a heading, keep the heading text of the half that stays, and cross-reference the two. One cross-reference costs less than a reader hunting for the half they need.

### 3. Write the target outline before touching the file

Produce the whole heading tree, with levels, and check it against the locked list from step 1. Put it in front of the requester along with the Phase 0 diagnosis. The outline is the artifact that gets revised, not the page.

Order the groups: a short conceptual opener when the page serves newcomers, then procedures, then context, then reference. The action path runs uninterrupted and the background sits after it.

A guide about database tables settled here:

```
## What is a table?                    <- short conceptual opener
## Creating and managing tables        <- procedures
### Creating tables
### Securing your tables
### Loading data
### Joining tables with foreign keys
## How tables are organized            <- context
### Primary keys
### Relationships between tables
### Schemas
## Reference
### Data types
```

"Joining tables with foreign keys" held both classes. The steps kept the heading and stayed in the procedures group; the idea of a relational database moved to "Relationships between tables" in the context group.

### 4. Move, then add the glue the new shape needs

Move and regroup, and preserve meaning. Don't silently rewrite facts while restructuring. A pure set of moves is what makes this PR reviewable, so call out in the PR body any deletion that isn't a move.

Then:

- Add a short introduction linking each major group and saying when to use it. Skip it when a short page is already easy to scan.
- Add a group introduction, a transition where the information type changes, and an outcome after a procedure. Don't link every adjacent section.
- Put sections covering the same topic under a shared heading.

### 5. When the page itself should split

When a topic outgrows the page, give it its own page rather than its own group. Navigation that overflows the sidebar is one signal. A section carrying its own subsections several levels deep, sharing nothing with the rest of the page but a single word, is another.

Update every navigation entry, repoint every inbound anchor, and cross-reference the new page. Confirm the nav-registration mechanism through [`ask-the-docs`](../ask-the-docs/SKILL.md) rather than assuming it.

### 6. Before you submit

Re-run the step 1 grep. Every locked heading text is still present, at whatever level it ended up.

**A move that only reads correctly once new content exists isn't a PR 2 move.** It belongs to the branch that adds the content. Leave the section where it is, and say in the PR body which move you deferred and what it is waiting on. Otherwise PR 2 stops standing on its own, and a stack merged partway leaves the page reading worse than before.

If nothing needs to move, PR 2 doesn't exist. A page can be well organized and still need a style pass. Drop the branch and say the structure held up.

## PR 3: Technical revision

Validate the truth of the content and correct what's wrong.

**Change a claim only when leaving it would produce a wrong outcome.** A reader following the page would hit an error, get a different result than the page promises, or decide on a fact that isn't true. That's the test.

**Leave it alone otherwise.** Don't open PR 3 for imprecise but harmless phrasing, a claim you'd have worded differently, an accurate detail that isn't the newest way to do it, or a stale-looking value you can't verify against code. The last one is a note to the author, not an edit.

**An external rule isn't a wrong outcome by itself.** A best-practices rule that a reader would never hit as a failure doesn't clear the gate, however high the rule's stated impact. Weigh what the reader experiences against the page, not how the rule is ranked.

**PR 3 corrects what's on the page. A missing safeguard is an absence, and absences are additions.** When the fix is to add something the page never had, it belongs above this branch, not in it. This is the line that keeps a verification pass from quietly becoming a rewrite.

When a claim does fail the test, verify before you change it, per Phase 1 of [`write-the-docs`](../write-the-docs/SKILL.md):

- Read the implementation. Prefer the diff of a linked `supabase/supabase` PR over a general codebase read.
- Where code and product intent disagree, code wins for behavior claims. Flag the mismatch.
- Flag anything you inferred in the PR description, not in the MDX.

**Run the snippets when the page has them.** Offer [`test-the-docs`](../test-the-docs/SKILL.md) before you start, and don't run it unasked. A snippet that fails in the sandbox is the most direct evidence a claim fails the wrong-outcome test, because the reader hits the same error. Attach the verification report to the PR body. If the author declines, record the artifacts as deferred and carry on with the code read. If the sandbox fails for an environmental reason, that's a deferral rather than a result — retry it before the branch merges.

**Run every fence in document order, not only one path.** The reader pastes top to bottom, so that order is the claim. Snippets that each work alone can still fail as a sequence, by re-creating an object an earlier one made or by depending on one no fence ever creates. Nothing in a code read surfaces that, and it's the failure a reader hits first.

Testing covers procedural content only. Claims that nothing executes, such as limits, defaults, and positioning, still need the code read above.

**A branch above can change the answer.** The test is applied to the page as it stands, so a claim that passes inspection here can become wrong once an additions branch contradicts it. That correction belongs to the branch that creates the conflict, not back down here. Say so when you leave the claim, so the later change reads as intended rather than as a missed finding.

**If every finding fails the test, PR 3 is empty.** Say what you checked and what you're deliberately leaving, then drop the branch. An empty PR 3 means verified and fine, not skipped. A technical concern raised later in the stack is then a new request, per the boundary rule in Phase 0.

## PR 4+: Additions, on request only

**Additions sit on top of the stack, so they stay out of the edit.** New content is a different job from editing what's already there. Keeping it on its own branches is what stops an edit from turning into a rewrite halfway through.

**Additions take as many branches as the content needs.** Split them by diff size so each branch stays reviewable, and name each branch for what it adds rather than for its position in the stack. One branch is right when the additions are one topic and a small diff.

**Don't scope these branches from the diagnosis.** Additions are empty by default. Don't propose them because the page looks thin.

**A tracked request is the request.** An assigned ticket or issue that asks for new content has already made the ask, so treat it as scoped and get on with it. The rule forbids inventing additions yourself. It doesn't ask you to wait for someone to repeat a request that's already written down.

**Route mid-edit requests up here instead.** When the author asks for new content while you're on an earlier branch, or when you spot a gap yourself, say it's additions material and keep the current branch clean. Then ask whether they want it in this stack, in a separate ticket, or not at all. Naming it is how you keep the conversation from reopening PR 1.

Once it's scoped:

- Crawl reader feedback for candidate gaps. Linear is an internal Supabase tool, preferred when available and not required for open-source contributors.
- Ground additions the same way as PR 3. Read the code before making a behavior claim, and flag what you inferred.
- **Run every new runnable snippet through [`test-the-docs`](../test-the-docs/SKILL.md) before it ships.** New content is where an untested snippet is likeliest to be wrong, because nothing has ever executed it.
- Strip internal business context before the draft ships: PRD intent, roadmap speculation, and ticket discussion. It belongs in the PR description, not in the MDX.

## Validate each PR

Run this before submitting each branch, not once at the end of the stack:

- [ ] The diff contains only this PR's change type
- [ ] Section groups follow information type, and procedures aren't interrupted by long context
- [ ] Intro navigation is present only when the page needs it, and links resolve
- [ ] Connective text is selective, not link spam
- [ ] Voice matches CONTRIBUTING.md and WORD_LIST.md
- [ ] Every image has alt text that describes the image, checked against the image itself
- [ ] No invented behavior or positioning
- [ ] Shared pitfalls checklist considered

**Anchors.** PR 2 step 1 builds the locked-heading list and step 6 re-checks it. Any branch that renames or rewords a heading clears the same gate.

**Frontmatter `title`.** It follows the same sentence-case rule as a heading. Renaming it moves a navigation label and a search entry, not just a line of prose, so it clears this same gate and lands in PR 2 rather than PR 1.

**Lint and format.** Follow [`write-the-docs/reference/drafting-mechanics.md`](../write-the-docs/reference/drafting-mechanics.md). Then run the [`review-the-docs`](../review-the-docs/SKILL.md) local self-review: `pnpm lint:mdx`, plus `pnpm build:guides-markdown` when a guide, explainer, or tutorial changed.

`build:guides-markdown` writes `apps/docs/public/markdown/manifest.json`, which the repo tracks and commits as `[]`. Discard that file before committing. It's a build artifact, not part of the edit.

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

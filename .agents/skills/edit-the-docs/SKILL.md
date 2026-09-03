---
name: edit-the-docs
description: >-
  Restructure, reorder, and improve existing Supabase docs pages under
  apps/docs — clarity, connective text, section grouping, and brevity.
  Use when asked to edit, reorganize, restructure, tighten prose, or add
  glue between sections on a page that already exists. Not for net-new
  feature drafts (use write-the-docs) or PR triage/verification (use
  review-the-docs).
---

# Edit the docs

Improves **existing** Supabase docs pages: structure, order, connective text,
and clarity. Distinct from [`write-the-docs`](../write-the-docs/SKILL.md)
(draft net-new or product-grounded rewrites from intent + code) and
[`review-the-docs`](../review-the-docs/SKILL.md) (lint, build, PR triage).

## Core rules

1. **Read before you rewrite.** Open the target page and nearby pages of the same type. Name the reader's goal and the page type (explainer, guide, tutorial, troubleshooting) before moving sections.
2. **Improve structure and clarity; don't invent product truth.** Preserve behavior claims, UI labels, and positioning unless you verify a change against code or product intent. Accuracy gaps or missing net-new content belong with [`write-the-docs`](../write-the-docs/SKILL.md) / [`pm-the-docs`](../pm-the-docs/SKILL.md), not silent invention here.
3. **Follow CONTRIBUTING.md and WORD_LIST.md** for voice, terminology, and formatting. See [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) and [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md).
4. **Prefer brevity.** Prefer broad strokes when mechanical detail doesn't help the reader's task. Cut redundancy; don't over-explain.
5. **Reuse sibling skills.** IA/architecture via [`ask-the-docs`](../ask-the-docs/SKILL.md); validation and self-review via [`review-the-docs`](../review-the-docs/SKILL.md). Shared pitfalls live in [`write-the-docs/reference/common-pitfalls.md`](../write-the-docs/reference/common-pitfalls.md) — apply them, don't duplicate them.

## Phase 1 — Diagnose

1. Identify the document type per CONTRIBUTING.md (explainer, tutorial, guide, reference, or troubleshooting).
2. State the reader's goal and prerequisites in one or two lines.
3. Note structural problems: mixed information types interrupting a procedure, missing intro navigation on a long page, weak transitions, redundancy, or over-explained mechanics.
4. Summarize the diagnosis to the requester before large moves when the restructure would change how the page is read.

## Phase 2 — Restructure

Apply the **Mixed information types**, **Navigation**, and **Cross-references and glue** guidance in [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) (Guides section), summarized here:

1. Classify substantial sections as contextual, procedural, or reference content. In a mixed page, group sections by information type so that context doesn't interrupt the procedural path.
2. For a long or mixed page, add a short introduction that links to its major section groups and tells readers when to use each one. Skip this navigation when a short page is already easy to scan.
3. Connect contextual sections to their corresponding procedures when useful. Add introductions to section groups, transitions between information types, and outcomes after procedures. Don't link every adjacent section.
4. Move and regroup first; preserve meaning. Don't silently rewrite facts while restructuring.

## Phase 3 — Edit for clarity

- Use second person, present tense, short paragraphs, and ordered steps for sequential actions.
- Cut restated points and mechanical over-explanation.
- Apply [`write-the-docs/reference/common-pitfalls.md`](../write-the-docs/reference/common-pitfalls.md): timelessness, no internal planning context in shipped MDX, redundancy, single-item lists, admonition restatement.
- Search [`apps/docs/WORD_LIST.md`](../../../apps/docs/WORD_LIST.md) when introducing or revising technical terms and UI actions.
- Keep code samples executable in their stated context; mark intentionally omitted code. Prefer partials under `apps/docs/content/_partials/` over copied blocks.

## Phase 4 — Validate

Before handoff:

- [ ] Section groups follow information type; procedures aren't interrupted by long context
- [ ] Intro navigation present only when the page needs it; links resolve
- [ ] Connective text is selective, not link spam
- [ ] Voice matches CONTRIBUTING.md / WORD_LIST.md
- [ ] No invented behavior or positioning
- [ ] Shared pitfalls checklist considered

Mechanics (anchors, lint, format): follow [`write-the-docs/reference/drafting-mechanics.md`](../write-the-docs/reference/drafting-mechanics.md). Before renaming or rewording headings, grep for `#<old-anchor-slug>` under `apps/docs/content` and update matches.

Then run [`review-the-docs`](../review-the-docs/SKILL.md) local self-review (`pnpm lint:mdx`, and `pnpm build:guides-markdown` when guides/explainers/tutorials changed).

## Additional resources

- Structure SoT: [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) (mixed types, navigation, glue)
- Structure ops: [`apps/docs/CONTRIBUTING.md`](../../../apps/docs/CONTRIBUTING.md) — Guides: Mixed information types, Navigation, Cross-references and glue
- Pitfalls: [`write-the-docs/reference/common-pitfalls.md`](../write-the-docs/reference/common-pitfalls.md)
- Mechanics: [`write-the-docs/reference/drafting-mechanics.md`](../write-the-docs/reference/drafting-mechanics.md)
- Architecture/IA: [`ask-the-docs`](../ask-the-docs/SKILL.md)
- Net-new drafts: [`write-the-docs`](../write-the-docs/SKILL.md)
- Review: [`review-the-docs`](../review-the-docs/SKILL.md)

# How-to guide template

Use this template when the reader asks "How do I do one task?" The page is a procedure. It carries the Procedure information type from [Information types](../03-page-structure.md#information-types) and links out for concept and reference.

## Scope

- One task and one audience per page.
- A second task, or a second audience, gets its own page.
- Background longer than a short paragraph moves to an explainer. Lookup tables move to a reference page.

## Frontmatter

- `title`: a verb phrase, 35 characters or fewer.
- `description`: one sentence naming the task, the outcome, and the reader. 150 to 160 characters.

## Headings, in order

| Heading | Required | Holds |
| --- | --- | --- |
| Value statement | Yes | One or two sentences, no heading. What the reader does and what they have when done. |
| `## Overview` | Yes | A short paragraph of concept, then a link to the explainer for readers who want to understand how it works. |
| `## Prerequisites` | Only if needed | Bullets. Each opens with a bold lead-in that names the item, then says what it is for and links to where the reader gets it. |
| `## <Task>` | Yes | The happy path. A one-sentence preview of the phases, then numbered H3 phases, each holding a numbered procedure. Phrase the heading as what the reader would search. If that repeats the title, use `## Procedure`. |
| `## Verify` | Yes | A numbered procedure: a command or request, then the output that means it worked. |
| `## Next steps` | Yes | One sentence on what the links cover, then two to four links, each with a reason. |

## Rules

- **Happy path only.** The procedure is the one route where everything works, in the order the reader acts. Alternatives, options, edge cases, and error handling leave the page. Give each a one-line cross-reference at the step it affects, or collect them in Next steps. Troubleshooting belongs on its own page.
- **Actions, not explanations.** A step says what the reader does. How the system behaves underneath does not belong in a step. Move it to the explainer and link it: `Pass the key to createClient. For how the key maps to a role, see [How API keys work](...)`.
- **Brevity.** Every word costs an agent context and a human reader attention. Write the fewest words that keep the step correct. A step is one sentence plus its code block. A lead-in is one or two sentences. Cut a sentence that restates the heading, the step, or the code.
- **Cross-reference.** When a point needs more than a sentence, link to the page that holds it instead of writing it here. Link at the step that needs it, and say in a few words what the reader finds.
- **Glue.** A heading is never followed directly by another heading, a list, a code block, or a table. Write a short paragraph under every H2 and H3 that says what the reader is about to do and why. One or two sentences is enough.
- **Preview.** The paragraph under the task heading names the phases in order, so the reader knows the route before the first step.
- **Numbered phases.** Number every H3 under the task heading in order: `### 1. Set your variable names`.
- **Numbered steps.** Write the steps under every H3, and under every tab or other branch inside one, as a numbered procedure. A notes paragraph may follow the list.
- **One step.** A phase with one step gets a second one. Add a situating step first, such as opening the file or the page where the reader makes the change.
- **Short explainers.** Keep explanatory text to what the reader needs for the step in front of them. Longer background goes to the explainer.
- **No pointer sections.** Do not leave a "Moved sections" heading or a stub heading that only links elsewhere. Link from the text that needs the other page.

## Skeleton

```md
---
title: <Verb phrase>
description: <Task, outcome, and reader in one sentence.>
---

<What you do, and what you have when done.>

## Overview

<Two to four sentences of concept.> To learn how <topic> works, see [<Explainer title>](/docs/guides/<path>).

## Prerequisites

- **<Item>.** <What it is for.> <Where to get it, as a link.>

## Procedure

<One sentence naming the phases: you will do A, then B, then C.>

### 1. <Phase name>

<One or two sentences: what this phase does and why.>

1. <Situating step, such as opening the file or page.>

2. <One action.>

   ```bash
   <Complete command>
   ```

   <Note that applies to this step only.>

### 2. <Phase name>

<One or two sentences.>

1. <One action.>

2. <One action.>

## Verify

<One sentence: what you are about to confirm.>

1. Run:

   ```bash
   <Command>
   ```

2. Check the output. It includes `<expected output>`.

## Next steps

<One sentence on what the links below cover.>

- [<Page>](/docs/guides/<path>): <why the reader goes there>
```

## Anti-patterns

Not recommended:

- A step that depends on "the key above" or "as before".
- A warning at the end of the page for a step in the middle.
- Information only in a screenshot, a video, or a tab.
- A heading with nothing under it, or with only a list or a code block under it.
- A phase that is one unnumbered paragraph with a code block.
- An alternative path, an optional step, or an error case in the middle of the procedure.
- A sentence in a step that explains what the system does underneath.

Recommended:

- Name the thing in each step and each heading, so a section read alone still makes sense.
- Put the warning inside the step it applies to.
- Say it in text, and keep any image or video as an addition.
- Open each phase with a sentence that says what the reader is about to do.

## Checklist

- [ ] One task, one audience.
- [ ] Value statement answers what and what for.
- [ ] Overview is short and links to learning material.
- [ ] Every prerequisite has a bold lead-in and a link to where to get it.
- [ ] Task heading does not repeat the title, or reads `Procedure`.
- [ ] Task heading has a paragraph that previews the phases.
- [ ] Every H2 and H3 has a paragraph before anything else.
- [ ] Every H3 under the task heading is numbered.
- [ ] Every phase is a numbered procedure, and no phase has a single step.
- [ ] Every code block is complete and sits under the step that introduces it.
- [ ] Verify is a numbered procedure and names the expected output.
- [ ] The procedure is the happy path. Alternatives, options, and error cases are cross-referenced, not written out.
- [ ] No step explains what happens underneath. The explanation lives in the explainer and is linked.
- [ ] Every sentence earns its words. A step is one sentence plus code.
- [ ] Every section reads alone.
- [ ] No "Moved sections" heading or pointer-only heading.

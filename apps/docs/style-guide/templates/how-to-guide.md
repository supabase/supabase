# How-to guide template

Use this template when the reader asks "How do I do one task?" The page is a procedure. It carries the Procedure information type from [Information types](../03-page-structure.md#information-types) and links out for concept and reference.

## Scope

- One task and one audience per page.
- A second task, or a second audience, gets its own page.
- Procedures past six steps get named phases, each its own H3.
- Background longer than a short paragraph moves to an explainer. Lookup tables move to a reference page.

## Frontmatter

- `title`: a verb phrase, 35 characters or fewer.
- `description`: one sentence naming the task, the outcome, and the reader. 150 to 160 characters.

## Headings, in order

| Heading | Required | Holds |
| --- | --- | --- |
| Value statement | Yes | One or two sentences, no heading. What the reader does and what they have when done. |
| `## Overview` | Yes | A short paragraph of concept, then links to the explainer or learning material for readers who want to understand how it works. |
| `## Prerequisites` | Only if needed | Bullets. Each links to where the reader gets it. |
| `## <Task>` | Yes | Numbered steps. Phrase the heading as what the reader would search. If that repeats the title, use `## Procedure`. |
| `## Verify` | Yes | A command or request, and the output that means it worked. |
| `## Next steps` | Yes | Two to four links, each with a reason. |

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

- <Item, linked to where to get it>

## Procedure

1. <One action.>

   ```bash
   <Complete command>
   ```

   <Note that applies to this step only.>

2. <One action.>

## Verify

Run:

```bash
<Command>
```

The output includes `<expected output>`.

## Next steps

- [<Page>](/docs/guides/<path>): <why the reader goes there>
```

## Anti-patterns

Not recommended:

- A step that depends on "the key above" or "as before".
- A warning at the end of the page for a step in the middle.
- Information only in a screenshot, a video, or a tab.

Recommended:

- Name the thing in each step and each heading, so a section read alone still makes sense.
- Put the warning inside the step it applies to.
- Say it in text, and keep any image or video as an addition.

## Checklist

- [ ] One task, one audience.
- [ ] Value statement answers what and what for.
- [ ] Overview is short and links to learning material.
- [ ] Task heading does not repeat the title, or reads `Procedure`.
- [ ] Every code block is complete and sits under the step that introduces it.
- [ ] Verify names the expected output.
- [ ] Every section reads alone.
- [ ] A moved section left a pointer under the same anchor.

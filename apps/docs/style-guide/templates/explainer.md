# Explainer template

Use this template when the reader asks "What is it, and when do I use it?" The page carries the Concept, Process, and Structure information types from [Information types](../03-page-structure.md#information-types). It holds no steps.

## Scope

- One concept per page.
- A section with its own subsections, and little in common with the rest, moves to its own page.
- Steps move to a how-to guide. Lookup tables move to a reference page.

## Frontmatter

- `title`: a noun phrase for the concept, 35 characters or fewer.
- `description`: one sentence saying what the concept is and what it decides. 150 to 160 characters.

## Headings, in order

| Heading | Required | Holds |
| --- | --- | --- |
| Value statement | Yes | One or two sentences, no heading. What the concept is and why the reader needs it. |
| `## <Concept section>` | Yes, one or more | One idea per heading. Phrase it as the question it answers, or name the idea. Each section reads alone. |
| `## Limits` | Yes | What the concept does not do, and where it stops. Facts, not warnings. |
| `## Related` | Yes | Links to the how-to guide for the task and to the reference page for the values. |

## Skeleton

```md
---
title: <Concept name>
description: <What it is and what it decides.>
---

<What it is and why the reader needs it.>

## <What the concept identifies>

<Definition in the first sentence. Then a table for same-attribute rows, or prose for reasoning.>

## <How it relates to the neighbor concept>

<Comparison, as a table.>

## Limits

- <What it does not cover.>

## Related

- [<How-to guide>](/docs/guides/<path>): <task it covers>
- [<Reference>](/docs/guides/<path>): <values it lists>
```

## Anti-patterns

Not recommended:

- Numbered steps inside a concept section.
- "This" or "it" at the start of a section, pointing at an earlier one.

Recommended:

- Link to a how-to guide for the steps.
- Name the concept again at the start of the section.

## Checklist

- [ ] One concept.
- [ ] No steps.
- [ ] Every section reads alone.
- [ ] Limits section states facts only.
- [ ] Related links to the how-to guide and the reference.

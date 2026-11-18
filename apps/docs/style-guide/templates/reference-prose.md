# Reference (prose) template

Use this template when the reader asks "What is the value or limit?" The page carries the Fact information type from [Information types](../03-page-structure.md#information-types). It holds no steps and no background. Generated references are out of scope.

## Scope

- One subject per page.
- A table past the size limit splits into one page per category.
- Steps move to a how-to guide. Background moves to an explainer.

## Frontmatter

- `title`: a noun phrase for the subject plus "reference", 35 characters or fewer.
- `description`: one sentence saying what the page lists. 150 to 160 characters.

## Headings, in order

| Heading | Required | Holds |
| --- | --- | --- |
| Intro line | Yes | One sentence, no heading. What the page lists. |
| `## <Category>` | Yes, one or more | A table with a header row, then notes for the rows that need one. Each long table repeats its header row under its own heading. |
| `## Related` | Yes | Links to the explainer and the how-to guide. |

## Skeleton

```md
---
title: <Subject> reference
description: <What the page lists.>
---

<What the page lists.>

## <Category>

| <Attribute> | <Attribute> | <Attribute> |
| --- | --- | --- |
| <Value> | <Value> | <Value> |

<Note for a row that needs one.>

## Related

- [<Explainer>](/docs/guides/<path>): <why the values are what they are>
- [<How-to guide>](/docs/guides/<path>): <task that uses them>
```

## Anti-patterns

Not recommended:

- A paragraph of reasoning between table rows.
- A table that relies on the heading above it for its meaning.

Recommended:

- Link to the explainer for reasoning.
- Name the subject in the header row or the intro line.

## Checklist

- [ ] One subject.
- [ ] No steps and no background.
- [ ] Every table has a header row.
- [ ] Related links to the explainer and the how-to guide.

---
name: docs-guides
description: Write, edit, organize, and review Supabase guide content in apps/docs/content/guides. Use for guide MDX, frontmatter, navigation, terminology, links, code samples, partials, content listings, and docs validation.
---

# Supabase guide authoring

## Sources of truth

Before changing a guide:

1. Read `apps/docs/CONTRIBUTING.md` for content types, structure, components, and
   style.
2. Read `apps/docs/WORD_LIST.md` for preferred terminology, spelling, and
   capitalization.
3. Inspect nearby guides and the relevant navigation section before deciding on
   file placement or structure.

When guidance conflicts, follow `apps/docs/CONTRIBUTING.md`. Match literal code,
API names, UI labels, and third-party product names even when they differ from the
word list.

## Writing workflow

1. Identify the document type. A guide is a concise procedure for a targeted task;
   a tutorial covers a larger goal and includes more explanatory context.
2. Define the reader's goal and prerequisites before drafting.
3. Classify substantial sections as contextual, procedural, or reference content.
   In a mixed guide, group sections by information type so that context doesn't
   interrupt the procedural path.
4. For a long or mixed guide, add a short introduction that links to its major
   section groups and tells readers when to use each one. Skip this navigation
   when a short guide is already easy to scan.
5. Connect contextual sections to their corresponding procedures when useful.
   Add introductions to section groups, transitions between information types,
   and outcomes after procedures. Don't link every adjacent section.
6. Use second person, present tense, short paragraphs, and ordered steps for
   sequential actions.
7. Search `apps/docs/WORD_LIST.md` when introducing or reviewing technical terms,
   UI actions, abbreviations, and potentially ambiguous language.
8. Keep code samples executable in their stated context and consistent with
   repository formatting. Clearly mark intentionally omitted code. Use lowercase
   SQL keywords.
9. Reuse repeated content through `apps/docs/content/_partials` instead of copying
   it.
10. Add new pages to
    `apps/docs/components/Navigation/NavigationMenu/NavigationMenu.constants.ts`.
    File placement alone doesn't add a page to navigation.
11. Use `/docs/...` paths for pages in Supabase docs and site-root paths such as
    `/dashboard` for pages outside docs. Use descriptive link text and sparse
    admonitions with the appropriate severity.

## Validation

From `apps/docs`, run:

```bash
pnpm lint:mdx
pnpm build:guides-markdown
```

Run broader formatting, type checking, or tests when the change affects MDX
components, content listings, navigation code, or generated output.

For a mixed guide, verify that context and procedures are grouped, introductory
navigation links resolve to the intended sections, related context and procedures
are cross-referenced where useful, and transitions make the reading path clear.

Treat lint replacements as suggestions when context matters. Rewrite the sentence
instead of applying a replacement that changes its technical meaning.

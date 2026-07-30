---
name: docs-content
description: Write, edit, organize, and review Supabase content anywhere in apps/docs — guides, explainers, tutorials, troubleshooting entries, reference docs, and partials. Use for MDX/TOML authoring, frontmatter, navigation, terminology, links, code samples, content listings, and docs validation.
---

# Supabase docs authoring

## Sources of truth

Before changing docs content:

1. Read `apps/docs/CONTRIBUTING.md` for content types, structure, components, and
   style.
2. Read `apps/docs/WORD_LIST.md` for preferred terminology, spelling, and
   capitalization.
3. Inspect nearby content of the same type and the relevant navigation section
   before deciding on file placement or structure. Guides, explainers, and
   tutorials live under `apps/docs/content/guides`. Troubleshooting entries live
   under `apps/docs/content/troubleshooting` and use TOML frontmatter — follow
   `_template.mdx` in that directory rather than a guide's YAML frontmatter.
   Reference docs are generated from `apps/docs/spec` and library source, so
   look for the spec file or repo definition instead of editing rendered output
   directly.

When guidance conflicts, follow `apps/docs/CONTRIBUTING.md`. Match literal code,
API names, UI labels, and third-party product names even when they differ from the
word list.

## Writing workflow

1. Identify the document type: explainer, tutorial, guide, or reference, per
   `apps/docs/CONTRIBUTING.md`. A guide is a concise procedure for a targeted
   task; a tutorial covers a larger goal and includes more explanatory context;
   an explainer is conceptual and prose-based; reference content is factual,
   like a dictionary entry. Troubleshooting entries follow their own TOML
   structure rather than these four types.
2. Define the reader's goal and prerequisites before drafting.
3. Classify substantial sections as contextual, procedural, or reference content.
   In a mixed page, group sections by information type so that context doesn't
   interrupt the procedural path.
4. For a long or mixed page, add a short introduction that links to its major
   section groups and tells readers when to use each one. Skip this navigation
   when a short page is already easy to scan.
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
10. Add new guide, explainer, and tutorial pages to
    `apps/docs/components/Navigation/NavigationMenu/NavigationMenu.constants.ts`.
    File placement alone doesn't add a page to navigation. Troubleshooting
    entries are indexed automatically and don't need a navigation entry.
11. Use `/docs/...` paths for pages in Supabase docs and site-root paths such as
    `/dashboard` for pages outside docs. Use descriptive link text and sparse
    admonitions with the appropriate severity.

## Validation

From `apps/docs`, run:

```bash
pnpm lint:mdx
pnpm build:guides-markdown
```

`pnpm lint:mdx` covers all content under `apps/docs/content`, including
troubleshooting entries. `pnpm build:guides-markdown` only applies to guides,
explainers, and tutorials.

From the repository root, run `pnpm format` to apply Prettier to any changed
MDX (and other) files. This enforces repo-wide formatting rules, including
lowercase SQL keyword casing in code samples.

Run broader type checking or tests when the change affects MDX components,
content listings, navigation code, or generated output.

For a mixed page, verify that context and procedures are grouped, introductory
navigation links resolve to the intended sections, related context and procedures
are cross-referenced where useful, and transitions make the reading path clear.

Treat lint replacements as suggestions when context matters. Rewrite the sentence
instead of applying a replacement that changes its technical meaning.

Anchor IDs are generated from heading text at render time, and nothing in CI
checks that `#anchor` links still resolve. Before renaming, removing, or
substantially rewording a heading, run
`grep -rn "#<old-anchor-slug>" apps/docs/content` to find in-page and
cross-file links that target it, and update every match. If a heading needs a
stable anchor independent of its wording, pin it with a custom anchor, for
example `## Some heading [#some-heading]`.

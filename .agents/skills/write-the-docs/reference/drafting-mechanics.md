# Drafting mechanics

Mechanics that come up during drafting but aren't worth duplicating from
`CONTRIBUTING.md` or `ask-the-docs`. For nav wiring, partials, and file
placement, see `ask-the-docs`'s `app-map.md` and `federated-docs.md`.

## Link paths

- Use `/docs/...` paths for pages in Supabase docs.
- Use site-root paths such as `/dashboard` for pages outside docs.
- Use descriptive link text and sparse admonitions with the appropriate severity.

## Anchor stability

Anchor IDs are generated from heading text at render time, and nothing in CI
checks that `#anchor` links still resolve. Before renaming, removing, or
substantially rewording a heading, run:

```bash
grep -rn "#<old-anchor-slug>" apps/docs/content
```

Update every in-page and cross-file match. If a heading needs a stable anchor
independent of its wording, pin it with a custom anchor, for example
`## Some heading [#some-heading]`.

## Lint and format

From `apps/docs`:

```bash
pnpm lint:mdx
pnpm build:guides-markdown
```

`pnpm lint:mdx` covers all content under `apps/docs/content`, including
troubleshooting entries. `pnpm build:guides-markdown` only applies to guides,
explainers, and tutorials.

From the repository root, run `pnpm format` to apply Prettier to changed MDX
files. This enforces repo-wide formatting rules, including lowercase SQL
keyword casing in code samples.

Treat `supa-mdx-lint` replacements as suggestions when context matters. Rewrite
the sentence instead of applying a replacement that changes its technical
meaning.

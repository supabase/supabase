# Supabase Docs

Next.js app router + MDX. Dev server: `pnpm dev:docs` → http://localhost:3001/docs (the bare `/` 404s).

## Style guide

`style-guide/` holds the docs style guide as plain markdown.

- `style-guide/README.md` — what the guide covers, how the files are ordered, and the external references it defers to
- `style-guide/WORD_LIST.md` — terminology; check it before drafting and again before opening a PR
- `style-guide/01-voice-and-tone.md` — person, tense, sentence length, brevity
- `style-guide/02-elements.md` — admonitions, code blocks, procedures, tabs, images
- `style-guide/03-page-structure.md` — document type, section grouping, chunking

Load the file you need rather than the whole directory. No tool enforces the guide, so applying it is the author's job, or the skill's.

## Skills

Load these before working. `pm-the-docs`, `write-the-docs`, `edit-the-docs`, `ask-the-docs`, and `review-the-docs` back the docs authoring process. See `CONTRIBUTING.md` for which stage each covers. They apply the style guide above. For architecture questions (MDX pipeline, GraphQL endpoint, search embeddings, federated docs, build pipeline), `ask-the-docs` has the reference notes.

## Test requirements

Before running tests for `apps/docs`, ensure local Supabase is available and the DB is in a known state.

### Recommended sequence

```bash
pnpm supabase status
pnpm supabase start        # if not running
pnpm supabase db reset --local
pnpm run -F docs test:local:unwatch
```

### Notes

- Always reset the local DB before running docs tests to avoid state leakage.
- Prefer `test:local:unwatch` for non-watch CI-like runs. Append a path to run a single file: `pnpm run -F docs test:local:unwatch internals/internal-links.test.ts`.
- `pnpm test` (from `apps/docs`) wraps `test:local` in `supabase start` / `supabase stop`, but does not reset the DB and runs in watch mode, so it is not a substitute for the sequence above.

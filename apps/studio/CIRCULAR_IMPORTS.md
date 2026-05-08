# Circular imports — TanStack migration tracker

Temporary tracking doc, peer to `TANSTACK_MIGRATION.md`. Captures every
circular-import finding (source or chunk-level) we hit during the
Next → TanStack migration so they can be lifted into a separate
follow-up PR later.

## Why a separate PR?

The migration branch is already large and touches a lot of `apps/studio`
surface. Source-level fixes for cycles tend to span `packages/ui` and other
shared workspaces — they're easier to review, revert, and bisect when not
co-mingled with route migrations.

## Convention going forward

1. **One fix per commit.** Whenever we land a workaround or a real source
   fix for a circular-dep issue, it goes in its own commit (or a clearly
   isolated hunk) so it can be cherry-picked.
2. **Tag the source comment.** Any code comment that explains the
   workaround should be greppable — start the comment with
   `Circular-dep workaround:` so we can find every instance with one
   `git grep`. Then list the file/line in this doc.
3. **Add a row in this doc.** Every entry should record:
   - what failed (symptom),
   - root cause (source vs chunk-level),
   - what we did about it,
   - which commit holds the fix,
   - what a "real" fix would look like, if different.
4. **Don't rewrite history to extract.** When the follow-up PR is
   prepared, cherry-pick the relevant commits onto a fresh branch off
   `master`. The originals on the migration branch can stay as-is.

## Findings

### 1. `cva is not a function` at SSR prerender — `ui` ↔ `TreeView` chunk cycle

**Symptom.** Build (`pnpm --filter=studio build`) fails at SSR prerender
of `/`:

```
TypeError: cva is not a function
    at .../dist/server/assets/TreeView-zmu8GZxM.js:1482:27
```

The crashing line is the top-level `cva(...)` initializer for
`TreeViewItemVariant` inside `packages/ui/src/components/TreeView/TreeView.tsx`.

**When it surfaced.** Adding `apps/studio/routes/project/$ref/database/triggers.tsx`
(stage 4 of the database migration). The new shell pulls `PageLayout`,
`NoPermission`, and a permission hook into the SSR graph. That import shape
is enough to nudge Rolldown into a different chunk layout, which exposes
the latent cycle.

**Root cause — chunk-level, not source-level.** Verified:

- `madge --circular --include-npm packages/ui/index.tsx` → no cycles.
- `madge --circular --include-npm apps/studio/routes/__root.tsx` → no cycles.
- No `import ... from 'ui'` inside `packages/ui/src/**` (8 grep hits all
  in `@deprecated` JSDoc strings).
- No `[plugin rolldown:circular-dependency]` warnings during the build.

The cycle exists only in Rolldown's chunk graph:

- `dist/server/assets/ui-*.js` (the package barrel + `cn`/`Input`/`cva`/most
  utilities) imports `TreeView`'s exports from `dist/server/assets/TreeView-*.js`
  — because `packages/ui/index.tsx` does `export * from './src/components/TreeView'`.
- `dist/server/assets/TreeView-*.js` imports `cn`/`Input`/`cva` back from
  `dist/server/assets/ui-*.js` — because Rolldown placed those utilities
  into the `ui` chunk even though `TreeView.tsx` references them via
  relative paths (`../../lib/utils`, `../shadcn/ui/input`,
  `class-variance-authority`).

ESM tolerates source-level cycles because every imported binding is a
live reference and most consumers read them from inside function bodies
that run after the module graph is fully evaluated. Chunks don't have
the same forgiveness — the `cva(...)` call sits at the top of the
`TreeView` chunk's body, runs before the `ui` chunk has finished
defining its `Or` (cva) export, and gets `undefined`.

**Workaround landed.** Pin `class-variance-authority` to its own chunk so
neither `ui` nor `TreeView` ends up holding it:

- File: `apps/studio/vite.config.ts`
- Form: `build.rollupOptions.output.manualChunks` lambda that returns
  `'class-variance-authority'` for any module under
  `node_modules/class-variance-authority/`.
- Commit: `3662e52f62 feat(studio): migrate /database/triggers/* + force cva into own chunk (stage 4)`.
- Note: the workaround is bundled with the stage-4 route additions in
  the same commit. To extract for the follow-up PR, cherry-pick the
  `apps/studio/vite.config.ts` hunk plus its surrounding comment block.

**Why no source fix?** All non-breaking restructures we considered don't
actually break the chunk cycle:

- Switching `TreeView.tsx` to import from a different relative path —
  doesn't matter; Rolldown will still pool utilities into the `ui` chunk.
- Removing the `@deprecated` self-import comments — already not real
  imports, removing them is cosmetic.

The structural fixes that _would_ break the cycle are all breaking changes
to consumers across the monorepo:

- Split the `ui` barrel into multiple sub-entries: `ui/utils`,
  `ui/tree-view`, etc. Touches every `import ... from 'ui'` site.
- Drop `cn`/utility re-exports from the main `ui` barrel and force
  consumers to import them from a deeper path. Same blast radius.
- Move `TreeView` out of the main barrel into its own sub-export. Only
  affects `TreeView` consumers but still breaking for them.

A hypothetical upstream fix would be a Rolldown chunker change that
detects the cycle and shuffles utilities into a third chunk
automatically. None known at the time of writing.

**Real fix tracking.** None landed. If/when one of the structural changes
above is approved, this row should be updated with the commit and the
chunk-pin in `vite.config.ts` reverted in the same PR.

## Empty rows

(This section will fill up as we keep migrating. Add new entries above.)

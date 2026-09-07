# Supabase Design System

Design resources for building consistent user experiences at Supabase.

## Getting started

From the repo root:

```bash
cp apps/design-system/.env.local.example apps/design-system/.env.local
cd apps/design-system
pnpm i
pnpm dev
```

Or from `apps/design-system`:

```bash
cp .env.local.example .env.local
pnpm i
pnpm dev
```

The `dev` command builds the registry once, then runs the Next.js dev server (which starts Velite in watch mode) and a registry file watcher in parallel. That is the recommended workflow.

Open [http://localhost:3003/design-system](http://localhost:3003/design-system) in your browser to see the result.

### Hot reload

There are two content pipelines:

| What you edit | Watcher | Notes |
| --- | --- | --- |
| `content/docs/**/*.mdx` | Velite (via `next.config.mjs`) | Rebuilds on save; wait for `[VELITE] rebuild finished` before expecting updates |
| `registry/**` (examples, `examples.ts`, etc.) | `dev:registry` (`tsx watch`) | Rebuilds `__registry__` on save |

Velite runs inside the Next.js dev server because Turbopack does not support the old Contentlayer webpack plugin. Registry output is separate and must be watched explicitly.

Doc pages load compiled content from `.velite/allDocs.json` (~27MB for all 105 docs). Velite rebuilds are fast; the remaining cost is Next re-parsing that bundle on each content change. Splitting per-doc output is the next step if dev still feels slow.

### Alternative commands

You can also run the development server and registry watcher separately. Build the registry first, because `dev:next` and `dev:registry` do not:

```bash
pnpm build:registry

# Run only the Next.js development server (includes Velite watch)
pnpm dev:next

# Run only the registry watcher (in a separate terminal shell)
pnpm dev:registry
```

From the repo root, `pnpm dev:design-system` runs the same `dev` script. If you split the watchers from the root, build first:

```bash
pnpm --filter=design-system build:registry
pnpm --filter=design-system dev:next
pnpm --filter=design-system dev:registry
```

### Watching for MDX changes

Velite watches `content/docs` while `dev:next` is running. If you run `pnpm dev:next` on its own, Velite still starts via `next.config.mjs`. You do not need a separate `velite dev` process.

### Adding components

The design system _references_ components rather than housing them. That distinction matters: everything below is about documenting components, not implementing them. Add or edit the components themselves in one of these two places:

- [`packages/ui`](https://github.com/supabase/supabase/tree/master/packages/ui): basic UI components
- [`packages/ui-patterns`](https://github.com/supabase/supabase/tree/master/packages/ui-patterns): components built from libraries or from `packages/ui`

After you add or remove documented components, update these source files:

- `config/docs.ts`: list of components in the sidebar
- `content/docs`: the component documentation
- `registry/examples.ts`: example components
- `registry/fragments.ts`: fragment components
- `registry/charts.ts`: chart components
- `registry/copy-writing.ts`: copywriting examples
- `registry/default/example/*`: the example component implementations
- `registry/default/block/*`: chart block implementations, when you add a chart

Do not edit `__registry__`. `pnpm dev`, `pnpm typecheck`, and `pnpm build` generate it from the files above, and it is gitignored. If you add registry entries while the app is already running, regenerate it:

```bash
cd apps/design-system
pnpm build:registry
```

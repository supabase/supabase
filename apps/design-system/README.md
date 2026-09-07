# Supabase Design System

Design resources for building consistent user experiences at Supabase.

## Getting started

First, make a copy of _.env.local.example_ and name it _env.local_. Then install any required packages and start the development server:

```bash
cd apps/design-system
pnpm i
pnpm dev
```

The `dev` command generates `__registry__`, then runs the Next.js development server and Contentlayer together. That is the recommended workflow.

### Alternative commands

You can also run the development server and content watcher separately. Generate the registry first, because `dev:next` and `dev:content` do not:

```bash
pnpm generate:registry

# Run only the Next.js development server
pnpm dev:next

# Run only the content watcher (in a separate terminal shell)
pnpm dev:content
```

From the repo root, `pnpm dev:design-system` runs the same `dev` script, so it also generates `__registry__`. If you split the watchers from the root, generate first:

```bash
pnpm --filter=design-system generate:registry
pnpm --filter=design-system dev:next
pnpm --filter=design-system dev:content
```

Open [http://localhost:3003](http://localhost:3003) in your browser to see the result.

### Watching for MDX changes

The `dev` command watches MDX files and hot-reloads them. If you are running `pnpm dev:next` on its own, also run `pnpm dev:content` in another terminal.

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
pnpm generate:registry
```

# Supabase Design System

Design resources for building consistent user experiences at Supabase.

## Getting started

First, make a copy of _.env.local.example_ and name it _env.local_. Then install any required packages and start the development server:

```bash
cd apps/design-system
pnpm i
pnpm dev:full
```

The `dev:full` command runs both the Next.js development server and Contentlayer concurrently, which is recommended for most development workflows.

### Alternative commands

You can also run the development server and content watcher separately:

```bash
# Run only the Next.js development server
pnpm dev

# Run only the content watcher (in a separate terminal shell)
pnpm content:dev
```

Or run the development server from the root directory:

```bash
pnpm dev:design-system
```

To run both the development server and content watcher from the root directory, you can use:

```bash
# Run the development server
pnpm dev:design-system

# Run the content watcher (in a separate terminal shell)
pnpm --filter=design-system content:dev
```

Open [http://localhost:3003](http://localhost:3003) in your browser to see the result.

### Watching for MDX changes

The `dev:full` command automatically watches for changes to MDX files with hot reload. If you're running the `pnpm dev` separately, you'll need to run `pnpm content:dev` in a separate terminal shell to watch for content changes.

### Adding components

The design system _references_ components rather than housing them. That’s an important distinction to make, as everything that follows here is about the documentation of components. You can add or edit components in one of these two places:

- [`packages/ui`](https://github.com/supabase/supabase/tree/master/packages/ui): basic UI components
- [`packages/ui-patterns`](https://github.com/supabase/supabase/tree/master/packages/ui-patterns): components which are built using NPM libraries or amalgamations of components from `patterns/ui`

With that out of the way, there are several parts of this design system that need to be manually updated after components have been added or removed (from documentation). These include:

- `config/docs.ts`: list of components in the sidebar
- `content/docs`: the actual component documentation
- `registry/examples.ts`: Example components
- `registry/charts.ts`: Chart components
- `registry/fragments.ts`: Fragment components

You may need to rebuild the design system’s registry. You can do that via:

```bash
cd apps/design-system
pnpm build:registry
```

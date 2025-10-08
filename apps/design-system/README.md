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

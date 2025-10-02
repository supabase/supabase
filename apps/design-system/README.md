# Supabase Design System

Design resources for building consistent user experiences at Supabase.

## Getting Started

First, make a copy of _.env.local.example_ and name it _env.local_. Then install any required packages and start the development server:

```bash
cd apps/design-system
pnpm i
pnpm dev
```

You can also run the development server from the root directory:

```bash
pnpm dev:design-system
```

Open [http://localhost:3003](http://localhost:3003) in your browser to see the result.

### Watching for MDX changes

If you would like to watch for changes to MDX files with hot reload, you can run the following command in a separate terminal shell:

```
pnpm content:dev
```

This runs Contentlayer concurrently and watches for any changes.

### `develop`

Start the Strapi application with autoReload enabled.

From the `apps/cms` directory:

```
pnpm run develop
```

From the monorepo root:

```
pnpm dev:cms
```

You also need to add the .env vars either to point to the hosted supabase project or to the local supabase project inside the `apps/cms/supabase` directory.

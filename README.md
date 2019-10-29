# Supabase

Supercharge PostgreSQL. [https://supabase.io](https://supabase.io)

## About

Supabase provide opensource tools that make PostgreSQL even better.

## Docs

All of our documeentation is stored in this repo as a single source of truth. You can view it online at [https://supabase.io/docs/-/about](https://supabase.io/docs/-/about).

## Development

This is monorepo. As much as we love `npm`, we have decided to use `yarn` to manage the separate workspaces.

```bash
yarn # installs all dependencies for all workspaces.
yarn workspaces dev # runs "dev" command in all workspaces.
yarn workspace @supabase/web dev # runs "dev" command in the "web" workspace.

yarn workspace @supabase/web add package # installs "package" in the "web" workspace
yarn workspace @supabase/web remove package # removes "package" in the "web" workspace
```
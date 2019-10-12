# Supabase

Supercharge your database.

## Development

This is monorepo. As much as we love `npm`, we have decided to use `yarn` to manage the separate workspaces.

```sh
yarn # installs all dependencies for all workspaces.
yarn workspaces dev # runs "dev" command in all workspaces.
yarn workspace @supabase/web dev # runs "dev" command in the "web" workspace.

yarn workspace @supabase/web add package # installs "package" in the "web" workspace
yarn workspace @supabase/web remove package # removes "package" in the "web" workspace
```
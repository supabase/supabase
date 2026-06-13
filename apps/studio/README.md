# Supabase Studio

A dashboard for managing your self-hosted Supabase project, and used on our [hosted platform](https://supabase.com/dashboard). Built with:

- [Next.js](https://nextjs.org/)
- [Tailwind](https://tailwindcss.com/)

## What's included

Studio is designed to work with existing deployments - either the local hosted, docker setup, or our CLI. It is not intended for managing the deployment and administration of projects - that's out of scope.

As such, the features exposed on Studio for existing deployments are limited to those which manage your database:

- Table & SQL editors
  - Saved queries are unavailable
- Database management
  - Policies, roles, extensions, replication
- API documentation

## Managing Project Settings

Project settings are managed outside of the Dashboard. If you use docker compose, you should manage the settings in your docker-compose file. If you're deploying Supabase to your own cloud, you should store your secrets and env vars in a vault or secrets manager.

## How to contribute?

- Branch from `master` and name your branches with the following structure
  - `{type}/{branch_name}`
    - Type: `chore | fix | feature`
    - The branch name is arbitrary — just make sure it summarizes the work.
- When you send a PR to `master`, it will automatically tag members of the frontend team for review.
- Review the [contributing checklists](contributing/contributing-checklists.md) to help test your feature before sending a PR.
- The Dashboard is under active development. You should run `git pull` frequently to make sure you're up to date.

### Developer Quickstart

> [!NOTE]  
> **Supabase internal use:** To develop on Studio locally with the backend services, see the instructions in the [internal `infrastructure` repo](https://github.com/supabase/platform/blob/develop/docs/contributing.md).

```bash
# You'll need to be on Node v20
# in /studio

## For external contributors
pnpm install # install dependencies
pnpm run dev # start dev server

## For internal contributors
## First clone the private supabase/platform repo and follow instructions for setting up mise
mise studio  # Run from supabase/platform alongside `mise infra`

## For all
pnpm run test # run tests
pnpm run test -- --watch # run tests in watch mode
```

## Running within a self-hosted environment

Follow the [self-hosting guide](https://supabase.com/docs/guides/hosting/docker) to get started.

```bash
cd ..
cd docker
docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml up
```

The Docker command also starts a Studio container on port `8082`. If you want to run the Studio frontend from your local checkout with Next.js, stop the Docker Studio container from another terminal:

```bash
docker stop supabase-studio
```

Once you've got that set up, update `.env` in the studio folder, or `.env.local` for local-only overrides, with the corresponding values from `docker/.env`.

```
POSTGRES_PASSWORD=
PG_META_CRYPTO_KEY=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
```

When running the local Studio frontend against Docker services, use the postgres-meta port exposed by `docker-compose.dev.yml`:

```
STUDIO_PG_META_URL=http://localhost:5555
```

`PG_META_CRYPTO_KEY` must match the value in `docker/.env`. Studio uses this key to encrypt the connection string sent to postgres-meta, and postgres-meta must use the same key to decrypt it.

Then run the following commands to install dependencies and start the dashboard.

```bash
pnpm install
pnpm run dev
```

If you would like to configure different defaults for "Default Organization" and "Default Project", you will need to update `.env` in the studio folder, or `.env.local` for local-only overrides, with the corresponding values.

```
DEFAULT_ORGANIZATION_NAME=
DEFAULT_PROJECT_NAME=
```

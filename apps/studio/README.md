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
> **Supabase internal use:** To develop on Studio locally with the backend services, see the instructions in the [internal `infrastructure` repo](https://github.com/supabase/infrastructure/blob/develop/docs/contributing.md).

```bash
# You'll need to be on Node v20
# in /studio

npm i # install dependencies
npm run dev:secrets:pull # Supabase internal use: if you are working on the platform version of the Studio
npm run dev # start dev server
npm run test # run tests
npm run -- --watch # run tests in watch mode
```

## Running within a self-hosted environment

Follow the [self-hosting guide](https://supabase.com/docs/guides/hosting/docker) to get started.

```
cd ..
cd docker
docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml up
```

Once you've got that set up, update `.env` in the studio folder with the corresponding values.

```
POSTGRES_PASSWORD=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
```

Then run the following commands to install dependencies and start the dashboard.

```
npm install
npm run dev
```

If you would like to configure different defaults for "Default Organization" and "Default Project", you will need to update the `.env` in the studio folder with the corresponding values.

```
DEFAULT_ORGANIZATION_NAME=
DEFAULT_PROJECT_NAME=
```

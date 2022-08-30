# Supabase Studio

A dashboard for managing your self-hosted Supabase project, and used on our [hosted platform](https://app.supabase.com). Built with:

- [Next.js](https://nextjs.org/)
- [Tailwind](https://tailwindcss.com/)
- [Supabase UI](https://ui.supabase.com/)
- [MobX](https://www.mobxjs.com/)

## Disclaimer

Supabase Studio is under heavy development. Apologies for any confusing patterns used while we're refactoring the codebase. If you're planning to contribute, it is advised that you run `git pull` frequently to retrieve the latest updates.

## What's included

Studio is designed to work with existing deployments - either the local hosted, docker setup, or our CLI. It is not intended for managing the deployment and administration of projects - that's out of scope.

As such, the features exposed on Studio for existing deployments are limited to those which manage your database:

- Table & SQL editors
  - Saved queries are unavailable
- Database management
  - Policies, roles, extensions, replication
- API documentation

## Managing Project Settings

Project settings are managed outside of the Dashboard. If you use docker-compose, you should manage the settings in your docker-compose file. If you're deploying Supabase to your own cloud, you should store your secrets and env vars in a vault or secrets manager.

## How to contribute?

- Branch from `master` and name your branches with the following structure
  - `{type}/{branch_name}`
    - Type: `chore | fix | feature`
    - Branch Name: Arbitrary, just make sure it summarizes the work
- Send a PR to `master` and tag the following members in your PR as reviewers
  - [MildTomato](https://github.com/mildtomato), [phamhieu](https://github.com/phamhieu), [joshenlim](https://github.com/joshenlim)

### Developer Quickstart

```bash
# You'll need to be on Node v14
# in /studio

npm i # install deps
npm run dev # start dev server
npm run test # run tests
npm run -- --watch # run tests in watch mode
```

## Running within a self-hosted environment

Firstly, follow the guide [here](https://supabase.com/docs/guides/hosting/docker) to get started with self-hosted Supabase.

```
cd ..
cd docker
docker-compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml up
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

## UI Testing Notes

### `<Popover>` vs `<Dropdown>`

When simulating clicks on these components, do the following:

```js
// for Popovers
import userEvent from '@testing-library/user-event'
userEvent.click('Hello world')

// for Dropdowns
import clickDropdown from 'tests/helpers'
clickDropdown('Hello world')
```

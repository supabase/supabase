# Supabase Edge Function Examples

## What are Supabase Edge Functions?

[Supabase Edge Functions](https://supabase.com/edge-functions) are written in TypeScript, run via Deno, and deployed with the Supabase CLI. Please [download](https://github.com/supabase/cli#install-the-cli) the latest version of the Supabase CLI, or [upgrade](https://github.com/supabase/cli#install-the-cli) it if you have it already installed.

## Example Functions

We're constantly adding new Function Examples, [check our docs](https://supabase.com/docs/guides/functions#examples) for a complete list!

## Develop locally

- Run `supabase start` (make sure your Docker daemon is running.)
- Run `cp ./supabase/.env.local.example ./supabase/.env.local` to create your local `.env` file.
- Set the required variables for the corresponding edge functions in the `.env.local` file.
- Run `supabase functions serve --env-file ./supabase/.env.local --no-verify-jwt`
- Run the CURL command in the example function, or use the [invoke method](https://supabase.com/docs/reference/javascript/invoke) on the Supabase client or use the test client [app](./app/).

## Test Client

This example includes a create-react-app in the [`./app/`](./app/) directory which you can use as a sort of postman to make test requests both locally and to your deployed functions.

### Test locally

- `cd app`
- `npm install`
- `npm start`

Note: when testing locally, the select dropdown doesn't have any effect, and invoke simply calls whatever function is currently served by the CLI.

## Deploy

- Generate access token and log in to CLI
  - Navigate to https://supabase.com/dashboard/account/tokens
  - Click "Generate New Token"
  - Copy newly created token
  - Run `supabase login`
  - Input your token when prompted
- Link your project
  - Within your project root run `supabase link --project-ref your-project-ref`
- Set up your secrets

  - Run `supabase secrets set --env-file ./supabase/.env.local` to set the environment variables.

  (This is assuming your local and production secrets are the same. The recommended way is to create a separate `.env` file for storing production secrets, and then use it to set the environment variables while deploying.)

  - You can run `supabase secrets list` to check that it worked and also to see what other env vars are set by default.

- Deploy the function
  - Within your project root run `supabase functions deploy your-function-name`
- In your [`./app/.env`](./app/.env) file remove the `SUPA_FUNCTION_LOCALHOST` variable and restart your Expo app.

### Test deployed functions

This example includes a create-react-app in the [`./app/`](./app/) directory which you can use as a sort of postman to make test requests both locally and to your deployed functions.

- `cd app`
- `cp .env.example .env`
- Fill in your env vars from https://supabase.com/dashboard/project/_/settings/api
- `npm install`
- `npm start`

### Deploy via GitHub Actions

This example includes a [deploy GitHub Action](./.github/workflows/deploy.yaml) that automatically deploys your Supabase Edge Functions when pushing to or merging into the main branch.

You can use the [`setup-cli` GitHub Action](https://github.com/marketplace/actions/supabase-cli-action) to run Supabase CLI commands in your GitHub Actions, for example to deploy a Supabase Edge Function:

```yaml
name: Deploy Function

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      PROJECT_ID: your-project-id

    steps:
      - uses: actions/checkout@v3

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - run: supabase functions deploy --project-ref $PROJECT_ID
```

Since Supabase CLI [v1.62.0](https://github.com/supabase/cli/releases/tag/v1.62.0) you can deploy all functions with a single command.

Individual function configuration like [JWT verification](/docs/reference/cli/config#functions.function_name.verify_jwt) and [import map location](/docs/reference/cli/config#functions.function_name.import_map) can be set via the `config.toml` file.

```toml
[functions.hello-world]
verify_jwt = false
```

## 👁⚡️👁

\o/ That's it, you can now invoke your Supabase Function via the [`supabase-js`](https://supabase.com/docs/reference/javascript/invoke) and [`supabase-dart`](https://supabase.com/docs/reference/dart/invoke) client libraries. (More client libraries coming soon. Check the [supabase-community](https://github.com/supabase-community#client-libraries) org for details).

For more info on Supabase Functions, check out the [docs](https://supabase.com/docs/guides/functions) and the [examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions).

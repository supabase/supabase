---
id: 'functions-deploy'
title: 'Deploy to Production'
description: 'Deploy your Edge Functions to your remote Supabase Project.'
subtitle: 'Deploy your Edge Functions to your remote Supabase Project.'
tocVideo: '5OWH9c4u68M'
---

Once you have developed your Edge Functions locally, you can deploy them to your Supabase project.

<Admonition type="note">

Before getting started, make sure you have the Supabase CLI installed. Check out the CLI installation guide for installation methods and troubleshooting.

</Admonition>

---

## Step 1: Authenticate

Log in to the Supabase CLI if you haven't already:

```bash
supabase login
```

---

## Step 2: Connect your project

Get the project ID associated with your function:

```bash
supabase projects list
```

<Admonition type="tip" label="Need a new project?">

If you haven't yet created a Supabase project, you can do so by visiting [database.new](https://database.new).

</Admonition>

[Link](/docs/reference/cli/usage#supabase-link) your local project to your remote Supabase project using the ID you just retrieved:

```bash
supabase link --project-ref your-project-id
```

Now you should have your local development environment connected to your production project.

---

## Step 3: Deploy Functions

You can deploy all edge functions within the `functions` folder with a single command:

```bash
supabase functions deploy
```

Or deploy individual Edge Functions by specifying the function name:

```bash
supabase functions deploy hello-world
```

### Deploying public functions

By default, Edge Functions require a valid JWT in the authorization header. If you want to deploy Edge Functions without Authorization checks (commonly used for Stripe webhooks), you can pass the `--no-verify-jwt` flag:

```bash
supabase functions deploy hello-world --no-verify-jwt
```

<Admonition type="caution">

Be careful when using this flag, as it will allow anyone to invoke your Edge Function without a valid JWT. The Supabase client libraries automatically handle authorization.

</Admonition>

## Step 4: Verify successful deployment

🎉 Your function is now live!

When the deployment is successful, your function is automatically distributed to edge locations worldwide. Your edge functions is now running globally at `https://[YOUR_PROJECT_ID].supabase.co/functions/v1/hello-world.`

---

## Step 5: Test your live function

You can now invoke your Edge Function using the project's `ANON_KEY`, which can be found in the [API settings](/dashboard/project/_/settings/api) of the Supabase Dashboard. You can invoke it from within your app:

<$CodeTabs>

```bash name=cURL
curl --request POST 'https://<project_id>.supabase.co/functions/v1/hello-world' \
  --header 'Authorization: Bearer ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{ "name":"Functions" }'
```

```js name=JavaScript
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://xyzcompany.supabase.co', 'publishable-or-anon-key')

const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'Functions' },
})
```

</$CodeTabs>

<Admonition type="note">

Note that the `SUPABASE_PUBLISHABLE_KEY` is different in development and production. To get your production anon key, you can find it in your Supabase dashboard under Settings > API.

</Admonition>

You should now see the expected response:

```json
{ "message": "Hello Production!" }
```

<Admonition type="note">

You can also test the function through the Dashboard. To see how that works, check out the [Dashboard Quickstart guide](/docs/guides/dashboard/quickstart).

</Admonition>

---

## CI/CD deployment

You can use popular CI / CD tools like GitHub Actions, Bitbucket, and GitLab CI to automate Edge Function deployments.

### GitHub Actions

You can use the official [`setup-cli` GitHub Action](https://github.com/marketplace/actions/supabase-cli-action) to run Supabase CLI commands in your GitHub Actions.

The following GitHub Action deploys all Edge Functions any time code is merged into the `main` branch:

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
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - run: supabase functions deploy --project-ref $PROJECT_ID
```

---

### GitLab CI

Here is the sample pipeline configuration to deploy via GitLab CI.

```yaml
image: node:20

# List of stages for jobs, and their order of execution
stages:
  - setup
  - deploy

# This job runs in the setup stage, which runs first.
setup-npm:
  stage: setup
  script:
    - npm i supabase
  cache:
    paths:
      - node_modules/
  artifacts:
    paths:
      - node_modules/

# This job runs in the deploy stage, which only starts when the job in the build stage completes successfully.
deploy-function:
  stage: deploy
  script:
    - npx supabase init
    - npx supabase functions deploy --debug
  services:
    - docker:dind
  variables:
    DOCKER_HOST: tcp://docker:2375
```

---

### Bitbucket Pipelines

Here is the sample pipeline configuration to deploy via Bitbucket.

```yaml
image: node:20

pipelines:
  default:
    - step:
        name: Setup
        caches:
          - node
        script:
          - npm i supabase
    - parallel:
        - step:
            name: Functions Deploy
            script:
              - npx supabase init
              - npx supabase functions deploy --debug
            services:
              - docker
```

---

### Function configuration

Individual function configuration like [JWT verification](/docs/guides/cli/config#functions.function_name.verify_jwt) and [import map location](/docs/guides/cli/config#functions.function_name.import_map) can be set via the `config.toml` file.

```toml
[functions.hello-world]
verify_jwt = false
```

This ensures your function configurations are consistent across all environments and deployments.

---

### Example

This example shows a GitHub Actions workflow that deploys all Edge Functions when code is merged into the `main` branch.

<$CodeSample
meta="deploy.yaml"
path="/edge-functions/.github/workflows/deploy.yaml"
/>

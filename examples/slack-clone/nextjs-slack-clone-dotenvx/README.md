# Dotenvx integration with Supabase project

This is a full-stack Slack clone example using:

- Frontend:
  - [Next.js](https://github.com/vercel/next.js) - a React framework for production.
  - [Supabase.js](https://supabase.com/docs/library/getting-started) for user management and realtime data syncing.
- Backend:
  - [supabase.com/dashboard](https://supabase.com/dashboard/): hosted Postgres database with RESTful API for usage with Supabase.js.
  - A connection to GitHub for authentication.

## Introduction

This project demonstrates how you can leverage [dotenvx](https://dotenvx.com/) and `config.toml` to easily deploy different
environments. We'll see how you can have a similar setup for your dev and remote production project.

## Core concept

Most of the configurations within `config.toml` can receive env variables via the `env()` syntax. Our goal here is to leverage
this with `dotenvx` to handle sensitive values such as GitHub app credentials for the auth 3rd parties.

The key thing to know about `dotenvx` is that it allows you to easily encrypt secrets and share them across your team.
The keys to decrypt those secrets will be stored under `.env.keys`; these must be secured and left out of your version control.
You'll need to share those private keys with your team to allow them to decrypt the env values [more details about how dotenvx secrets work](https://dotenvx.com/encryption).

In this example, we'll reproduce how you would deploy and manage an app environment using dotenvx.

### How to structure your environment files:

We recommend following a similar convention to the one we use in this project.
We're clearly splitting the environments into 3 files:

- `supabase/.env.local` -- In charge of setting up the "local development" so you can test and develop your application when you use `npx supabase start`
- `supabase/.env.production` -- Will contain the environment for the main production project on Supabase.

If we explore our `.env.local` with our `config.toml`, we can see that we drive the values that are environment
dependent with the `env()` syntax:

```toml
...
site_url = "env(SUPABASE_AUTH_SITE_URL)"
# A list of *exact* URLs that auth providers are permitted to redirect to post authentication.
additional_redirect_urls = [
    # Will be localhost:3000 in development or the URL of your deployed app in production.
    "env(SUPABASE_AUTH_ADDITIONAL_REDIRECT_URLS)",
]
...

[auth.external.github]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET)"
```

# Local development

To run the stack locally, we need to set those values. Some of them aren't senstitives and are stored in plain text
but you can see that we have encrypted values for our github connections:

```supabase/.env.local
# Credentials for github connection
SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=encrypted:BGN3vY/hup3ZENuwbkSxhL9TI7QvGH24HyPS9nd/oaZSQMmuDPS+Y1IJKPCsi38BSxxcHEUh09I9jp75nUuslXjHWs+y9p4OLIUPcUBAYlPTKvPrxkn3MLzJ0WxdvukWlzMosSZfUdMtYpze3GnU9UEDG0+O
SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=encrypted:BMefTMshFBXOxqYuxGt7HEOhVM1C0tySmX/Wl23nRe0Bm1aiMuzfFIBqUDd21jM2hqnEUJgaOQ6HJSFEJt/iXBWUvqz2aedTUbELTyuCZKNCQWF2cAAOYqipaoFKIODCqGwULhYFD31G0y0WlJWXOB0IAwyhACJu7y4nvsZmuZ8yNvASHP5Blho=
```

You want to replace thoses with the ones macthing your own development [Github Oauth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

To do so, we can simply remove the ones we currently have in our `.env.local` and set your own using `dotenvx` cli:

```bash
npx dotenvx set SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID "<your-github-client-id>" -f supabase/.env.local
npx dotenvx set SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET "<your-github-app-secret>" -f supabase/.env.local
```

Dotenvx will automatically encrypt those values and create a `.env.keys` for you locally.

Now that we have everything setup, we can run our stack with `dotenvx` so all the env values get set and decrypted properly:

```
# First we start our supabase local server
npx dotenvx run -f supabase/.env.local -- npx supabase start
# Then we can start our frontend dev server similarly
npx dotenvx run -f supabase/.env.local -- npm run dev
```

If you now heads up to `locahost:3000` you should be able to connect using github oauth integration and use the app.

# Remote deployment

Now that we ensured our local development is working, it's time to get this deployed to our remote supabase project.

## Prerequisites

- A vercel account
- A Supabase account

### Create a new project

Sign up to Supabase - [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a new project. Wait for your database to start.

When it's finished, let's start creating our `.env.production` to
prepare for our vercel deployment. We'll need two values from our [supabase api settings](https://supabase.com/dashboard/project/_/settings/api)

```supabase/.env.production
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-api-key>
```

### TODO: how can we deploy to vercel from local ? Get errors when trying with `npx vercel`

Configure the other variables to match your frontend deployed url:

```
# The frontend site url, will be used by Supabase Auth services to properly configure auth redirects
SUPABASE_AUTH_SITE_URL=https://<app-website-url>vercel.app/
SUPABASE_AUTH_ADDITIONAL_REDIRECT_URLS=https://<app-website-url>vercel.app/**,https://<app-website-url>vercel.app/
```

### Github Production Oauth

You can now setup your github production app, and add the secrets to `.env.production`

```bash
npx dotenvx set SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID "<your-github-client-id>" -f supabase/.env.production
npx dotenvx set SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET "<your-github-app-secret>" -f supabase/.env.production
```

### Deploy to remote supabase

Now that we have our production environment setup, we can deploy it to our supabase
remote instance to do so we will:

1. Link our local project with the supabase remote project
2. Execute the database migrations on our remote project
3. Sync up our configurations with the `.env.production` values to our supabase instance.

```bash
# Link our local with our remote project
npx dotenvx run -f supabase/.env.production -- npx supabase link --project-ref ttaksszuncbizcfomjje
# Push our local migrations to setup our remote project
npx dotenvx run -f supabase/.env.production -- npx supabase db push
# Sync up our configuration
npx dotenvx run -f supabase/.env.production -- npx supabase config push
```

Now, if you head to your supabase remote project, you should see everything
configured with your production values.

### How to Use with Preview Branches

We are currently developing a workflow to integrate dotenv secrets with the Supabase branching system. This will allow each new deployed branch to be fully configured, including secrets.

However, this feature is not ready yet. While we work on a secure way to share dotenv secrets, you can still use a similar approach to manually configure an existing deployed branch on Supabase.

To do this, create a `.env.preview` file containing your secrets. Then, sync the branch configuration with your local values. Note that the branching executor already handles database migrations, so you'll only need to push the configuration:

```bash
npx dotenvx run -f supabase/.env.preview -- npx supabase link --project-ref <branch-ref>
# Sync branch configuration
npx dotenvx run -f supabase/.env.preview -- npx supabase config push
```

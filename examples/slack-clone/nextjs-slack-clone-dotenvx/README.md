# Dotenvx integration with supabase project

This is a full-stack Slack clone example using:

- Frontend:
  - [Next.js](https://github.com/vercel/next.js) - a React framework for production.
  - [Supabase.js](https://supabase.com/docs/library/getting-started) for user management and realtime data syncing.
- Backend:
  - [supabase.com/dashboard](https://supabase.com/dashboard/): hosted Postgres database with restful API for usage with Supabase.js.
  - A connection to github for authentification.

## Introduction

This project demonstrate how you can leverage [dotenvx](https://dotenvx.com/) and `config.toml` to easily deploy differents
environments. We'll see how you can have a similiar setup for your dev and remote production project.

## Core concept

Most of the configurations within `config.toml` can received env variables via the `env()` syntax. Our goal here is to leverage
this with `dotenvx` to handle sensistives values such as Github app credentials for the auth 3rd parties.

The key thing to know about `dotenvx` is that it allows you to easily encrypt secrets and share them across your team.
The key to decrypt thoses secrets will be stored under `.env.keys`, those must be secured and left out of your version control.
You'll need to share thoses private keys with your team to allow them to decrypt the env values [more details about how dotenvx secrets works](https://dotenvx.com/encryption).

In this example, we'll reproduce how you would deploy and manage an app environment using dotenvx.

### How to structure your environment files:

We recommend to follow a similar convention to the one we use in this project.
We're clearly spltting the environments into 3 files"

- `supabase/.env.local` -- In charge of setting up the "local development" so you can test and develop your application when you use `npx supabase start`
- `supabase/.env.production` -- Will contain the environment for the main production project on supabase.

If we explore our `.env.local` with our `config.toml` we can see that we drive the values that are environment
dependents with the `env()` synax:

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

## Deploy with vercel

The easiest way to get started is to deploy with vercel. This will:

1. Allow you to create a new supabase project
2. Link and deploy the frontend for this project on Vecel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Fslack-clone%2Fnextjs-slack-clone&project-name=supabase-nextjs-slack-clone&repository-name=supabase-nextjs-slack-clone&integration-ids=oac_VqOgBHqhEoFTPzGkPd7L0iH6&external-id=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Fslack-clone%2Fnextjs-slack-clone)

> Here we assume you already have a vercel

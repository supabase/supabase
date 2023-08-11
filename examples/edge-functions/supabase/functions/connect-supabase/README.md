# Build a Supabase Marketplace Integration

Supabase offers an [OAuth2 connection flow](https://supabase.com/docs/guides/platform/oauth-apps/authorize-an-oauth-app) and a [Management API](https://supabase.com/docs/reference/api/introduction) allowing you to build Supabase Marketplace Integrations that connect to our users' hosted Supabase projects, making it more convenient than ever to create scalabale backends programmatically and tap into the extensive pool of Supabase users.

## Setup

1. Follow the [steps in the docs](https://supabase.com/docs/guides/platform/oauth-apps/publish-an-oauth-app) to create an OAuth App.
1. Set `SUPA_CONNECT_CLIENT_ID` and `SUPA_CONNECT_CLIENT_SECRET` in your `.env.local` file as shown in the [`.env.local.example` file](../../.env.local.example).

## Connect to Supabase using OAuth2

This example showcases and end-to-end OAuth2 connection flow with [PKCE](https://supabase.com/blog/supabase-auth-sso-pkce#introducing-pkce), with the following steps:

1. Create authorization URL with PKCE codeVerifier.
1. Redirect user to Supabase to authorize your application to connect to their Supabase account.
1. User gets redirected to the callback route, where we exchange the code in the URL for `access_token` and `refresh_token`.
1. We use the `access_token` to retrieve a list of the user's projects using the [`supabase-management-js` library](https://github.com/supabase-community/supabase-management-js).

## Run locally

```bash
supabase functions serve connect-supabase --no-verify-jwt --env-file ./supabase/.env.local
```

Navigate to http://localhost:54321/functions/v1/connect-supabase

## Deploy to Supabase Edge Functions

```bash
supabase functions deploy connect-supabase --no-verify-jwt
supabase secrets set --env-file ./supabase/.env.local
```

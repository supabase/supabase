# Supabase Edge Function Examples

## What are Supabase Edge Functions?

[Supabase Edge Functions](https://supabase.com/edge-functions) are written in TypeScript, run via Deno, and deployed with the Supabase CLI. Please [download](https://github.com/supabase/cli#install-the-cli) the latest version of the Supabase CLI, or [upgrade](https://github.com/supabase/cli#install-the-cli) it if you have it already installed.

## Example Functions

The function examples are located in [`./supabase/functions`](./supabase/functions):

- [`browser-with-cors`](./supabase/functions/browser-with-cors/index.ts): Handle CORS headers for function invocations from browser environments.
- [`select-from-table-with-auth-rls`](./supabase/functions/select-from-table-with-auth-rls/index.ts): Retrieve data from an authenticated user via RLS.

## Develop locally

- Run `supabase start` (make sure your Docker daemon is running.)
- Run `supabase functions serve your-function-name`
- Run the CURL command in the example function, or use the [invoke method](https://supabase.com/docs/reference/javascript/invoke) on the Supabase client.

## Deploy

- Generate access token and log in to CLI
  - Navigate to https://app.supabase.io/account/tokens
  - Click "Generate New Token"
  - Copy newly created token
  - Run `supabase login`
  - Input your token when prompted
- Link your project
  - Within your project root run `supabase link --project-ref your-project-ref`
- Set up your secrets
  - Run `supabase secrets set --from-stdin < .env` to set the env vars from your `.env` file.
  - You can run `supabase secrets list` to check that it worked and also to see what other env vars are set by default.
- Deploy the function
  - Within your project root run `supabase functions deploy payment-sheet`
- In youre [`./app/.env`](./app/.env) file remove the `SUPA_FUNCTION_LOCALHOST` variable and restart your Expo app.

## 👁⚡️👁

\o/ That's it, you can now invoke your Supabase Function via the [`supabase-js`](https://supabase.com/docs/reference/javascript/invoke) and [`supabase-dart`](https://supabase.com/docs/reference/dart/invoke) client libraries. (More client libraries coming soon. Check the [supabase-community](https://github.com/supabase-community#client-libraries) org for details).

For more info on Supabase Functions, check out the [docs](https://supabase.com/docs/guides/functions) and the [examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions).

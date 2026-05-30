# Resend with Supabase Edge Functions

This example shows how to use Resend with [Supabase Edge Functions](https://supabase.com/docs/guides/functions).

## Prerequisites

To get the most out of this example, you’ll need to:

- [Create an API key](https://resend.com/api-keys)
- [Verify your domain](https://resend.com/domains)
- Create your `.env` file and set your `RESEND_API_KEY`

```bash
cp .env.example .env
```

## Instructions

1. Make sure you have the latest version of the [Supabase CLI](https://supabase.com/docs/guides/cli#installation) installed.

2. Run function locally:

```sh
supabase start
supabase functions serve --no-verify-jwt --env-file ./supabase/.env.local
```

GET http://localhost:54321/functions/v1/send-email-resend

3. Deploy function to Supabase:

```sh
supabase functions deploy resend --no-verify-jwt
```

## License

MIT License

# Open Graph Image Generation

Generate Open Graph images with Deno and Supabase Edge Functions, no framework needed. This is a fork of the awesome [@vercel/og](https://www.npmjs.com/package/@vercel/og), ported to run on Deno.

- Docs: https://deno.land/x/og_edge@0.0.2
- Examples: https://vercel.com/docs/concepts/functions/edge-functions/og-image-examples
- Demo: https://obuldanrptloktxcffvn.functions.supabase.co/launchweek-ticket-og?ticketNumber=1234&username=thorwebdev&name=Thor%20%E9%9B%B7%E7%A5%9E%20Schaeff

## Run locally

```bash
supabase functions serve launchweek-ticket-og --no-verify-jwt
```

Navigate to http://localhost:54321/functions/v1/launchweek-ticket-og?ticketNumber=3524&username=thorwebdev&name=Thor%20%E9%9B%B7%E7%A5%9E%20Schaeff

## Deploy

```bash
supabase functions deploy launchweek-ticket-og --no-verify-jwt
```

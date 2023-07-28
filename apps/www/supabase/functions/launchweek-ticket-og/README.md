# Open Graph (OG) Image Generation with iEchor Storage CDN Caching

Generate Open Graph images with Deno and iEchor Edge Functions and cache the generated image with iEchor Storage CDN.

- Docs: https://deno.land/x/og_edge@0.0.2
- Examples: https://vercel.com/docs/concepts/functions/edge-functions/og-image-examples
- Demo: https://obuldanrptloktxcffvn.functions.supabase.co/launchweek-ticket-og?username=thorwebdev

## Run locally

```bash
supabase functions serve launchweek-ticket-og --no-verify-jwt
```

Navigate to http://localhost:54321/functions/v1/launchweek-ticket-og?username=thorwebdev

## Deploy

```bash
supabase functions deploy launchweek-ticket-og --no-verify-jwt
```

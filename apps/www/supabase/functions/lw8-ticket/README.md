# Open Graph (OG) Image Generation with Supabase Storage CDN Caching

Generate Open Graph images with Deno and Supabase Edge Functions and cache the generated image with Supabase Storage CDN.

- Docs: https://deno.land/x/og_edge@0.0.2
- Examples: https://vercel.com/docs/concepts/functions/edge-functions/og-image-examples
- Demo: https://obuldanrptloktxcffvn.functions.supabase.co/lw8-ticket?username=thorwebdev

## Run locally

```bash
supabase functions serve lw8-ticket --no-verify-jwt
```

Navigate to http://localhost:54321/functions/v1/lw8-ticket?username=thorwebdev

## Deploy

```bash
supabase functions deploy lw8-ticket --no-verify-jwt
```

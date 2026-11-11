# Open Graph (OG) Image Generation with Supabase Storage CDN Caching

Generate Open Graph images with Deno and Supabase Edge Functions and cache the generated image with Supabase Storage CDN.

- Docs: 
- Examples: https://vercel.com/docs/og-image-generation#examples
- Demo: https://obuldanrptloktxcffvn.supabase.co/functions/v1/lwx-ticket?username=thorwebdev

## Run locally

```bash
supabase start
supabase functions serve lwx-ticket --no-verify-jwt --env-file ./supabase/.env.local
```

Navigate to http://localhost:54321/functions/v1/lwx-ticket?username=thorwebdev

## Deploy

```bash
supabase functions deploy lwx-ticket --no-verify-jwt
```

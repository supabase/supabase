# Cloudflare Turnstile

Turnstile is Cloudflare's CAPTCHA alternative: https://developers.cloudflare.com/turnstile/get-started/

## Setup

- Follow these steps to set up a new site: https://developers.cloudflare.com/turnstile/get-started/
- Add the Cloudflare Turnstile widget to your site: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/

## Deploy the server-side validation Edge Functions

- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

```bash
supabase functions deploy cloudflare-turnstile
supabase secrets set CLOUDFLARE_TURNSTILE_SECRET_KEY=your_secret_key
```

## Invoke the function from your site

```js
const { data, error } = await supabase.functions.invoke('cloudflare-turnstile', {
  body: { token },
})
```

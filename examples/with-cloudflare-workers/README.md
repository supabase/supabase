# Supabase with Cloudflare Workers

Cloudflare Workers does not support `XMLHttpRequest` object and only support native `fetch`. This means this `supabase-js` client does not work on Cloudflare Workers. Supabase JS Client internally uses `cross-fetch` package to polyfill `fetch` which relies on `XMLHttpRequest`.

To resolve this, we can use `patch-package` to patch `cross-fetch` package as minimal as possible.

This repo contains minimal Cloudflare Workers project with the patch automatically applied.

### Credits

This example was [originally](https://github.com/nascode/cloudflare-workers-supabase-fix) created by [@nascode](https://github.com/nascode).

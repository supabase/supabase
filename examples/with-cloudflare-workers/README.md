# Supabase with Cloudflare Workers

`supabase-js` uses the `cross-fetch` library to make HTTP requests, but that does not work pn Cloudflare Workers.
We're asking Supabase Client to use Cloudflare Workers' in-built `fetch` method to make HTTP requests using the `fetch` option

Source: https://supabase.com/docs/reference/javascript/initializing#custom-fetch-implementation

### Credits

This example was [originally](https://github.com/nascode/cloudflare-workers-supabase-fix) created by [@nascode](https://github.com/nascode).

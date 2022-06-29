# Supabase with Cloudflare Workers

`supabase-js` uses the `cross-fetch` library to make HTTP requests, which has issues on Cloudflare Workers.
To solve this we can use Cloudflare Workers' in-built `fetch` method to make HTTP requests using the optional `fetch` parameter in the `supabase-js` client.

Source: https://supabase.com/docs/reference/javascript/initializing#custom-fetch-implementation

### Credits

This example was [originally](https://github.com/nascode/cloudflare-workers-supabase-fix) created by [@nascode](https://github.com/nascode).

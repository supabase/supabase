# Supabase Edge Functions

> Globally distributed TypeScript serverless functions, deployed in seconds.

Supabase Edge Functions let you run server-side TypeScript code at the edge, close to your users. Built on the open source Deno runtime, they integrate seamlessly with the rest of the Supabase platform: database, auth, storage, and realtime.

## Key Features

- **Global deployment**: functions run at the edge worldwide for low latency
- **TypeScript-first**: write in TypeScript with full type checking and autocompletion
- **Node.js compatible**: supports Node.js APIs and 2M+ NPM modules
- **Zero configuration**: pre-populated environment variables for accessing your Supabase project (database, auth, storage)
- **Database webhooks**: trigger functions automatically on table INSERT, UPDATE, or DELETE events
- **Regional invocation**: optionally pin functions to run near your database for lower DB latency
- **Built-in observability**: real-time log streaming, SQL-queryable Log Explorer, and metrics dashboards
- **CI/CD**: deploy via Supabase CLI with GitHub Actions support
- **Local development**: hot code reloading, Language Server for autocompletion, same runtime locally and in production

## Technical Details

- Runtime: Deno (open source, V8-based)
- Languages: TypeScript, JavaScript
- NPM support: 2M+ modules via npm: specifiers
- Scaling: automatic, no manual tuning
- Security: SSL, Firewall, DDoS protection built in
- Open source: same Edge Runtime runs locally and in production, no vendor lock-in

## Common Use Cases

- Webhook handlers (Stripe, GitHub, Twilio)
- Server-side API routes and middleware
- Scheduled tasks (via pg_cron + database webhooks)
- AI/ML inference endpoints
- Email and notification sending
- Third-party API integrations

## Links

- Documentation: https://supabase.com/docs/guides/functions
- API Reference: https://supabase.com/docs/reference/javascript/functions-invoke
- Dashboard: https://supabase.com/dashboard

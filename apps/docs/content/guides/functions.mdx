---
id: 'functions'
title: 'Edge Functions'
description: 'Run TypeScript functions globally at the edge.'
subtitle: 'Run TypeScript functions globally at the edge.'
sidebar_label: 'Overview'
tocVideo: 'za_loEtS4gs'
---

Edge Functions are server-side TypeScript functions, distributed globally at the edge—close to your users. They can be used for listening to webhooks or integrating your Supabase project with third-parties [like Stripe](https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/stripe-webhooks). Edge Functions are developed using [Deno](https://deno.com), which offers a few benefits to you as a developer:

- It is open source.
- It is portable. Supabase Edge Functions run locally, and on any other Deno-compatible platform (including self-hosted infrastructure).
- It is TypeScript first and supports WASM.
- Edge Functions are globally distributed for low-latency.

## How it works

- **Request enters an edge gateway (relay)** — the gateway routes traffic, handles auth headers/JWT validation, and applies routing/traffic rules.
- **Auth & policies are applied** — the gateway (or your function) can validate Supabase JWTs, apply rate-limits, and centralize security checks before executing code.
- **[Edge runtime](https://github.com/supabase/edge-runtime) executes your function** — the function runs on a regionally-distributed Edge Runtime node closest to the user for minimal latency.
- **Integrations & data access** — functions commonly call Supabase APIs (Auth, Postgres, Storage) or third-party APIs. For Postgres, prefer connection strategies suited for edge/serverless environments (see the `connect-to-postgres` guide).
- **Observability and logs** — invocations emit logs and metrics you can explore in the dashboard or downstream monitoring (Sentry, etc.).
- **Response returns via the gateway** — the gateway forwards the response back to the client and records request metadata.

## Quick technical notes

- **Runtime:** Supabase Edge Runtime (Deno compatible runtime with TypeScript first). Functions are `.ts` files that export a handler.
- **Local dev parity:** Use Supabase CLI for a local runtime similar to production for faster iteration (`supabase functions serve` command).
- **Global deployment:** Deploy your Edge Functions via Supabase Dashboard, CLI or MCP.
- **Cold starts & concurrency:** cold starts are possible — design for short-lived, idempotent operations. Heavy long-running jobs should be moved to [background workers](/docs/guides/functions/background-tasks).
- **Database connections:** treat Postgres like a remote, pooled service — use connection pools or serverless-friendly drivers.
- **Secrets:** store credentials in Supabase [project secrets](/docs/reference/cli/supabase-secrets) and access them via environment variables.

## When to use Edge Functions

- Authenticated or public HTTP endpoints that need low latency.
- Webhook receivers (Stripe, GitHub, etc.).
- On-demand image or Open Graph generation.
- Small AI inference tasks or orchestrating calls to external LLM APIs (like OpenAI)
- Sending transactional emails.
- Building messaging bots for Slack, Discord, etc.

<ContentListings id="functions-get-started" />

## Examples

Check out [Supabase Edge Function Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions) in GitHub or try these examples:

<ContentListings id="functions-examples-supabase" />

<ContentListings id="functions-examples-webhooks-payments" />

<ContentListings id="functions-examples-ai-media" />

<ContentListings id="functions-examples-messaging" />

<ContentListings id="functions-examples-operations" />

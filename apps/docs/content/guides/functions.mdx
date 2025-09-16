---
id: 'functions'
title: 'Edge Functions'
description: 'Globally distributed TypeScript functions.'
subtitle: 'Globally distributed TypeScript functions.'
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

- **Runtime:** Supabase Edge Runtime (Deno compatible runtime with TypeScript first). Functions are simple `.ts` files that export a handler.
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

<div className="not-prose">
  <Button size="medium" asChild>
    <a href="/docs/guides/functions/quickstart">Get started</a>
  </Button>
</div>

## Examples

Check out the [Edge Function Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions) in our GitHub repository.

<div className="grid md:grid-cols-12 gap-4 not-prose">
  {[
    {
      name: 'With supabase-js',
      description: 'Use the Supabase client inside your Edge Function.',
      href: '/guides/functions/auth',
    },
    {
      name: 'Type-Safe SQL with Kysely',
      description:
        'Combining Kysely with Deno Postgres gives you a convenient developer experience for interacting directly with your Postgres database.',
      href: '/guides/functions/kysely-postgres',
    },
    {
      name: 'Monitoring with Sentry',
      description: 'Monitor Edge Functions with the Sentry Deno SDK.',
      href: '/guides/functions/examples/sentry-monitoring',
    },
    {
      name: 'With CORS headers',
      description: 'Send CORS headers for invoking from the browser.',
      href: '/guides/functions/cors',
    },
    {
      name: 'React Native with Stripe',
      description: 'Full example for using Supabase and Stripe, with Expo.',
      href: 'https://github.com/supabase-community/expo-stripe-payments-with-supabase-functions',
    },
    {
      name: 'Flutter with Stripe',
      description: 'Full example for using Supabase and Stripe, with Flutter.',
      href: 'https://github.com/supabase-community/flutter-stripe-payments-with-supabase-functions',
    },
    {
      name: 'Building a RESTful Service API',
      description:
        'Learn how to use HTTP methods and paths to build a RESTful service for managing tasks.',
      href: 'https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/restful-tasks/index.ts',
    },
    {
      name: 'Working with Supabase Storage',
      description: 'An example on reading a file from Supabase Storage.',
      href: 'https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/read-storage/index.ts',
    },
    {
      name: 'Open Graph Image Generation',
      description: 'Generate Open Graph images with Deno and Supabase Edge Functions.',
      href: '/guides/functions/examples/og-image',
    },
    {
      name: 'OG Image Generation & Storage CDN Caching',
      description: 'Cache generated images with Supabase Storage CDN.',
      href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/og-image-with-storage-cdn',
    },
    {
      name: 'Get User Location',
      description: `Get user location data from user's IP address.`,
      href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/location',
    },
    {
      name: 'Cloudflare Turnstile',
      description: `Protecting Forms with Cloudflare Turnstile.`,
      href: '/guides/functions/examples/cloudflare-turnstile',
    },
    {
      name: 'Connect to Postgres',
      description: `Connecting to Postgres from Edge Functions.`,
      href: '/guides/functions/connect-to-postgres',
    },
    {
      name: 'GitHub Actions',
      description: `Deploying Edge Functions with GitHub Actions.`,
      href: '/guides/functions/examples/github-actions',
    },
    {
      name: 'Oak Server Middleware',
      description: `Request Routing with Oak server middleware.`,
      href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/oak-server',
    },
    {
      name: 'Hugging Face',
      description: `Access 100,000+ Machine Learning models.`,
      href: '/guides/ai/examples/huggingface-image-captioning',
    },
    {
      name: 'Amazon Bedrock',
      description: `Amazon Bedrock Image Generator`,
      href: '/guides/functions/examples/amazon-bedrock-image-generator',
    },
    {
      name: 'OpenAI',
      description: `Using OpenAI in Edge Functions.`,
      href: '/guides/ai/examples/openai',
    },
    {
      name: 'Stripe Webhooks',
      description: `Handling signed Stripe Webhooks with Edge Functions.`,
      href: '/guides/functions/examples/stripe-webhooks',
    },
    {
      name: 'Send emails',
      description: `Send emails in Edge Functions with Resend.`,
      href: '/guides/functions/examples/send-emails',
    },
    {
      name: 'Web Stream',
      description: `Server-Sent Events in Edge Functions.`,
      href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/streams',
    },
    {
      name: 'Puppeteer',
      description: `Generate screenshots with Puppeteer.`,
      href: '/guides/functions/examples/screenshots',
    },
    {
      name: 'Discord Bot',
      description: `Building a Slash Command Discord Bot with Edge Functions.`,
      href: '/guides/functions/examples/discord-bot',
    },
    {
      name: 'Telegram Bot',
      description: `Building a Telegram Bot with Edge Functions.`,
      href: '/guides/functions/examples/telegram-bot',
    },
    {
      name: 'Upload File',
      description: `Process multipart/form-data.`,
      href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/file-upload-storage',
    },
    {
      name: 'Upstash Redis',
      description: `Build an Edge Functions Counter with Upstash Redis.`,
      href: '/guides/functions/examples/upstash-redis',
    },
    {
      name: 'Rate Limiting',
      description: `Rate Limiting Edge Functions with Upstash Redis.`,
      href: '/guides/functions/examples/rate-limiting',
    },
    {
      name: 'Slack Bot Mention Edge Function',
      description: `Slack Bot handling Slack mentions in Edge Function`,
      href: '/guides/functions/examples/slack-bot-mention',
    },
  ].map((x) => (
    <div className="col-span-4" key={x.href}>
      <Link href={x.href} passHref>
        <GlassPanel icon={'/docs/img/icons/github-icon'} hasLightIcon={true} title={x.name}>
          {x.description}
        </GlassPanel>
      </Link>
    </div>
  ))}
</div>

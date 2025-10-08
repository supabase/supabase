---
title: 'Upstash Redis'
description: 'Build an Edge Functions Counter with Upstash Redis.'
---

<div class="video-container">
  <iframe
    src="https://www.youtube-nocookie.com/embed/OPg3_oPZCh0"
    frameBorder="1"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  ></iframe>
</div>

A Redis counter example that stores a [hash](https://redis.io/commands/hincrby/) of function invocation count per region. Find the code on [GitHub](https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/upstash-redis-counter).

## Redis database setup

Create a Redis database using the [Upstash Console](https://console.upstash.com/) or [Upstash CLI](https://github.com/upstash/cli).

Select the `Global` type to minimize the latency from all edge locations. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to your .env file.

You'll find them under **Details > REST API > .env**.

```bash
cp supabase/functions/upstash-redis-counter/.env.example supabase/functions/upstash-redis-counter/.env
```

## Code

Make sure you have the latest version of the [Supabase CLI installed](/docs/guides/cli#installation).

Create a new function in your project:

```bash
supabase functions new upstash-redis-counter
```

And add the code to the `index.ts` file:

```ts index.ts
import { Redis } from 'https://deno.land/x/upstash_redis@v1.19.3/mod.ts'

console.log(`Function "upstash-redis-counter" up and running!`)

Deno.serve(async (_req) => {
  try {
    const redis = new Redis({
      url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
      token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
    })

    const deno_region = Deno.env.get('DENO_REGION')
    if (deno_region) {
      // Increment region counter
      await redis.hincrby('supa-edge-counter', deno_region, 1)
    } else {
      // Increment localhost counter
      await redis.hincrby('supa-edge-counter', 'localhost', 1)
    }

    // Get all values
    const counterHash: Record<string, number> | null = await redis.hgetall('supa-edge-counter')
    const counters = Object.entries(counterHash!)
      .sort(([, a], [, b]) => b - a) // sort desc
      .reduce((r, [k, v]) => ({ total: r.total + v, regions: { ...r.regions, [k]: v } }), {
        total: 0,
        regions: {},
      })

    return new Response(JSON.stringify({ counters }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 200 })
  }
})
```

## Run locally

```bash
supabase start
supabase functions serve --no-verify-jwt --env-file supabase/functions/upstash-redis-counter/.env
```

Navigate to http://localhost:54321/functions/v1/upstash-redis-counter.

## Deploy

```bash
supabase functions deploy upstash-redis-counter --no-verify-jwt
supabase secrets set --env-file supabase/functions/upstash-redis-counter/.env
```

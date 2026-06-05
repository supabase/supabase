// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { Redis } from 'https://deno.land/x/upstash_redis@v1.19.3/mod.ts'
import { withSupabase } from 'npm:@supabase/server@^1'

console.log(`Function "upstash-redis-counter" up and running!`)

// Public endpoint, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, async (_req) => {
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
        .reduce(
          (r, [k, v]) => ({
            total: r.total + v,
            regions: { ...r.regions, [k]: v },
          }),
          {
            total: 0,
            regions: {},
          }
        )

      return Response.json({ counters })
    } catch (error) {
      return Response.json({ error: error.message })
    }
  }),
}

// To invoke, navigate to 'http://localhost:54321/functions/v1/upstash-redis-counter'.

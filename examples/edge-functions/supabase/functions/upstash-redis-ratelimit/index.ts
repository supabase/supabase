import { Ratelimit } from 'npm:@upstash/ratelimit@^2'
import { Redis } from 'npm:@upstash/redis@^1'
import { withSupabase } from 'npm:@supabase/server@^1'

console.log(`Function "upstash-redis-counter" up and running!`)

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    try {
      const redis = new Redis({
        url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
        token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
      })

      // Create a new ratelimiter, that allows 10 requests per 10 seconds
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(2, '10 s'),
        analytics: true,
      })

      // Use a constant string to limit all requests with a single ratelimit
      // Or use a userID, apiKey or ip address for individual limits.
      const identifier = ctx.userClaims?.id
      const { success } = await ratelimit.limit(identifier)

      if (!success) {
        throw new Error('limit exceeded')
      }

      return Response.json({ success })
    } catch (error) {
      return Response.json({ error: error.message })
    }
  }),
}

// curl -i --location --request POST 'http://localhost:54321/functions/v1/upstash-redis-ratelimit' \
//   --header 'Authorization: Bearer <USER_ACCESS_TOKEN>' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'

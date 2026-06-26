import * as Sentry from 'npm:@sentry/deno@^10'
import { withSupabase } from 'npm:@supabase/server@^1'

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
  integrations: [],
  debug: true,
  // Performance Monitoring
  tracesSampleRate: 1.0,
})

// Set region and execution_id as custom tags
Sentry.setTag('region', Deno.env.get('SB_REGION'))
Sentry.setTag('execution_id', Deno.env.get('SB_EXECUTION_ID'))

// Authenticated endpoint, so deploy with verify_jwt = true.
export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    try {
      const { name } = await req.json()
      const data = {
        message: `Hello ${name}!`,
      }

      return Response.json(data)
    } catch (e) {
      Sentry.captureException(e)
      return Response.json({ msg: 'error' }, { status: 500 })
    }
  }),
}

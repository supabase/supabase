import * as Sentry from 'https://deno.land/x/sentry/index.mjs'

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [],
  debug: true,
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
})

// Set region and execution_id as custom tags
Sentry.setTag('region', Deno.env.get('SB_REGION'))
Sentry.setTag('execution_id', Deno.env.get('SB_EXECUTION_ID'))

Deno.serve(async (req) => {
  try {
    const { name } = await req.json()
    const data = {
      message: `Hello ${name}!`,
    }

    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    Sentry.captureException(e)
    return new Response(JSON.stringify({ msg: 'error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

import { SupabaseServerError } from '@supabase/server'
import { withSupabase } from '@supabase/server/adapters/hono'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { supabaseServerEnv } from '../env'
import type { HandlerContext } from './auth'
import { assistantCors } from './cors'
import { jsonError, toErrorResponse } from './errors'
import { routes } from './routes'

type AppEnv = { Variables: { supabaseContext: HandlerContext } }

export const app = new Hono<AppEnv>()

app.use('*', assistantCors)

const serverEnv = supabaseServerEnv()
const auth = {
  none: withSupabase({ auth: 'none', env: serverEnv }),
  user: withSupabase({ auth: 'user', env: serverEnv }),
}

for (const route of routes) {
  app.on(route.method, route.pattern, auth[route.auth], (c) =>
    route.handler(c.req.raw, c.var.supabaseContext, c.req.param())
  )
}

for (const pattern of new Set(routes.map((route) => route.pattern))) {
  app.all(pattern, () => jsonError(405, 'invalid_request', 'Method not allowed'))
}

app.notFound(() => jsonError(404, 'not_found', 'Not found'))
app.onError((error) => {
  if (error instanceof HTTPException) {
    if (error.cause instanceof SupabaseServerError) {
      return Response.json(error.cause.toJSON(), { status: error.cause.status })
    }
    return error.getResponse()
  }
  return toErrorResponse(error)
})

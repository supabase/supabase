import { SupabaseServerError } from '@supabase/server'
import { withSupabase } from '@supabase/server/adapters/hono'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'

import type { Database } from '../db/database.types'
import { supabaseServerEnv } from '../env'
import { getPlatformPolicy } from '../platform/policy'
import { requireUserId } from './auth'
import type { HandlerContext } from './auth'
import { assistantCors } from './cors'
import { HttpError, jsonError, toErrorResponse } from './errors'
import { bearer } from './request'
import { routes } from './routes'

type AppEnv = { Variables: { supabaseContext: HandlerContext } }

export const app = new Hono<AppEnv>()

app.use('*', assistantCors)
app.use(
  '*',
  bodyLimit({
    maxSize: 5 * 1024 * 1024,
    onError: () =>
      jsonError(413, 'invalid_request', 'Request is too large. Start a new conversation.'),
  })
)

const serverEnv = supabaseServerEnv()
const auth = {
  none: withSupabase<Database>({ auth: 'none', env: serverEnv }),
  user: withSupabase<Database>({ auth: 'user', env: serverEnv }),
}

for (const route of routes) {
  app.on(route.method, route.pattern, auth[route.auth], async (c) => {
    const ctx = c.var.supabaseContext
    if (route.auth === 'user') {
      if (ctx.jwtClaims?.aud !== 'authenticated' || ctx.jwtClaims?.role !== 'authenticated')
        throw new HttpError(401, 'unauthorized', 'Sign in to continue.')
      const token = bearer(c.req.header('x-platform-authorization') ?? null)
      const policy = await getPlatformPolicy(token, {}, c.req.raw.signal)
      const { data, error } = await ctx.supabase
        .from('platform_identities')
        .select('platform_user_id')
        .eq('user_id', requireUserId(ctx))
        .maybeSingle()
      if (error || data?.platform_user_id !== policy.userId)
        throw new HttpError(403, 'unauthorized', 'Sign in again to use the assistant.')
      ctx.platformUserId = policy.userId
      ctx.platformToken = token
    }
    return route.handler(c.req.raw, ctx, c.req.param())
  })
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

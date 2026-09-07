import { SupabaseServerError, type SupabaseContext, type SupabaseEnv } from '@supabase/server'
import { withSupabase } from '@supabase/server/adapters/hono'
import { Hono, type MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

export type AgentWorkerContext<
  Database,
  Extension extends object = object,
> = SupabaseContext<Database> & Extension

export type AgentWorkerEnv<Database, Extension extends object = object> = {
  Variables: { supabaseContext: AgentWorkerContext<Database, Extension> }
}

export interface AgentWorkerRoute<Database, Extension extends object = object> {
  readonly method: string
  readonly pattern: string
  readonly auth: 'user' | 'none'
  readonly handler: (
    request: Request,
    context: AgentWorkerContext<Database, Extension>,
    params: Record<string, string>
  ) => Response | Promise<Response>
}

export interface AgentWorkerOptions<Database, Extension extends object = object> {
  readonly env: Partial<SupabaseEnv>
  readonly routes: readonly AgentWorkerRoute<Database, Extension>[]
  readonly middleware?: readonly MiddlewareHandler<AgentWorkerEnv<Database, Extension>>[]
  /** Runs after user authentication; may attach application context or reject access. */
  readonly authorize?: (
    request: Request,
    context: AgentWorkerContext<Database, Extension>,
    route: AgentWorkerRoute<Database, Extension>
  ) => void | Promise<void>
  /** Formats application errors. Supabase authentication errors and HTTPException retain their responses. */
  readonly onError?: (
    error: Error,
    request: Request
  ) => Response | undefined | Promise<Response | undefined>
}

/** Creates a Supabase Worker with per-route authentication and request-scoped clients. */
export function createAgentWorker<Database, Extension extends object = object>(
  options: AgentWorkerOptions<Database, Extension>
): Hono<AgentWorkerEnv<Database, Extension>> {
  const routes = options.routes.map((route) => {
    if (route.auth !== 'user' && route.auth !== 'none') {
      throw new Error(`Route "${route.pattern}" requires an explicit auth mode: "user" or "none".`)
    }
    return { ...route, method: route.method.toUpperCase() }
  })
  const app = new Hono<AgentWorkerEnv<Database, Extension>>()

  for (const middleware of options.middleware ?? []) app.use('*', middleware)

  const auth = {
    user: withSupabase<Database>({ auth: 'user', env: options.env }),
    none: withSupabase<Database>({ auth: 'none', env: options.env }),
  }

  for (const route of routes) {
    app.on(route.method, route.pattern, auth[route.auth], async (context) => {
      const request = context.req.raw
      const supabaseContext = context.var.supabaseContext
      if (route.auth === 'user') {
        if (
          supabaseContext.authMode !== 'user' ||
          supabaseContext.jwtClaims?.aud !== 'authenticated' ||
          supabaseContext.jwtClaims?.role !== 'authenticated' ||
          !supabaseContext.userClaims?.id
        ) {
          throw new HTTPException(401, {
            res: workerError(401, 'unauthorized', 'Sign in to continue.'),
          })
        }
        await options.authorize?.(request, supabaseContext, route)
      }
      return route.handler(request, supabaseContext, context.req.param())
    })
  }

  const methodsByPattern = new Map<string, Set<string>>()
  for (const { method, pattern } of routes) {
    const methods = methodsByPattern.get(pattern) ?? new Set<string>()
    methods.add(method)
    if (method === 'GET') methods.add('HEAD')
    methodsByPattern.set(pattern, methods)
  }
  for (const [pattern, methods] of methodsByPattern) {
    app.all(pattern, () =>
      Response.json(
        { code: 'invalid_request', message: 'Method not allowed' },
        { status: 405, headers: { Allow: [...methods].join(', ') } }
      )
    )
  }

  app.notFound(() => workerError(404, 'not_found', 'Not found'))
  app.onError(async (error, context) => {
    if (error instanceof HTTPException) {
      if (error.cause instanceof SupabaseServerError) {
        return Response.json(error.cause.toJSON(), { status: error.cause.status })
      }
      return error.getResponse()
    }
    if (error instanceof SupabaseServerError) {
      return Response.json(error.toJSON(), { status: error.status })
    }
    return (
      (await options.onError?.(error, context.req.raw)) ??
      workerError(500, 'internal', 'Unable to complete the request. Try again.')
    )
  })

  return app
}

function workerError(status: number, code: string, message: string): Response {
  return Response.json({ code, message }, { status })
}

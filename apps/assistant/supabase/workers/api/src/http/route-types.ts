import type { HandlerContext } from './auth'

export type RouteAuth = 'user' | 'none'

export type Route = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  pattern: string
  auth: RouteAuth
  handler: (
    req: Request,
    ctx: HandlerContext,
    params: Record<string, string>
  ) => Response | Promise<Response>
}

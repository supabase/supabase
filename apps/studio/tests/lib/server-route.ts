type ServerRouteHandler = (ctx: {
  request: Request
  params?: Record<string, string>
}) => Promise<Response>

type ServerRoute = { options: { server?: { handlers?: unknown } } }

/**
 * Returns the server handler a TanStack file route registers for `method`. The request passed to
 * it can use any method, which is how tests reach a handler's own "method not allowed" branch.
 */
export function getRouteHandler(route: ServerRoute, method: string): ServerRouteHandler {
  const handlers = route.options.server?.handlers as
    | Partial<Record<string, ServerRouteHandler>>
    | undefined
  const handler = handlers?.[method]
  if (!handler) throw new Error(`Route has no ${method} handler`)
  return handler
}

type ServerRouteHandler = (ctx: {
  request: Request
  params?: Record<string, string>
}) => Promise<Response>

type ServerRoute = { options: { server?: { handlers?: unknown } } }

/**
 * Returns the server handler a TanStack file route dispatches for `method`, mirroring
 * TanStack Start's lookup order (`HEAD` falls back to `GET`, and any unmatched method falls
 * back to `ANY`).
 */
export function getRouteHandler(route: ServerRoute, method: string): ServerRouteHandler {
  const handlers = route.options.server?.handlers as
    | Partial<Record<string, ServerRouteHandler>>
    | undefined
  const upper = method.toUpperCase()
  const handler =
    upper === 'HEAD'
      ? (handlers?.HEAD ?? handlers?.GET ?? handlers?.ANY)
      : (handlers?.[upper] ?? handlers?.ANY)
  if (!handler) throw new Error(`Route has no ${method} handler`)
  return handler
}

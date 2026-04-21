// @ts-ignore - built at `vite build` time, not present in source
import handler from '../dist/server/server.js'

// Vercel's Node runtime passes a Request-like object whose `.url` is
// path-only (e.g. `/dashboard/api/incident-banner`) — that's
// IncomingMessage semantics, not Web API `Request` semantics. TanStack's
// H3Event constructor expects an absolute URL and crashes with
// `ERR_INVALID_URL`. Reconstruct a compliant Request using the `host`
// header before handing off.
//
// eslint-disable-next-line import/no-anonymous-default-export, no-restricted-exports
export default (request) => {
  const incomingUrl = request.url
  let url
  try {
    url = new URL(incomingUrl)
  } catch {
    const host = request.headers.get('host') ?? 'localhost'
    const proto = request.headers.get('x-forwarded-proto') ?? 'https'
    url = new URL(incomingUrl, `${proto}://${host}`)
  }
  const normalized = new Request(url, request)
  return handler.fetch(normalized)
}

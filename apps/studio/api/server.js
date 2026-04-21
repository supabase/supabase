import { Readable } from 'node:stream'

// @ts-ignore - built at `vite build` time, not present in source
import handler from '../dist/server/server.js'

// Vercel's Node runtime passes an IncomingMessage-shaped object (path-only
// `.url`, plain-object `.headers`, Node Readable `.body`). TanStack's H3
// server expects a Web-standard Request. Normalize both shapes so the
// wrapper works whether Vercel hands us a Web Request or a Node-ish one.
//
// eslint-disable-next-line import/no-anonymous-default-export, no-restricted-exports
export default async (request) => {
  const headers = toHeaders(request.headers)

  let url
  try {
    url = new URL(request.url)
  } catch {
    const host = headers.get('host') ?? 'localhost'
    const proto = headers.get('x-forwarded-proto') ?? 'https'
    url = new URL(request.url, `${proto}://${host}`)
  }

  const method = request.method ?? 'GET'
  const init = { method, headers }
  if (method !== 'GET' && method !== 'HEAD' && request.body != null) {
    // Node IncomingMessage is a Readable (Node stream); Web Request wants a
    // ReadableStream. `Readable.toWeb` bridges the two. If we were given a
    // Web ReadableStream already, pass it through.
    init.body =
      typeof request.body.getReader === 'function' ? request.body : Readable.toWeb(request)
    init.duplex = 'half'
  }

  return handler.fetch(new Request(url, init))
}

function toHeaders(source) {
  if (source instanceof Headers) return source
  const headers = new Headers()
  if (!source) return headers
  if (typeof source.entries === 'function') {
    for (const [key, value] of source.entries()) headers.append(key, value)
    return headers
  }
  for (const [key, value] of Object.entries(source)) {
    if (value == null) continue
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v))
    else headers.append(key, String(value))
  }
  return headers
}

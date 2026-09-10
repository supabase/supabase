// Vite-side compat for `next/server`. Studio's middleware (proxy.ts) and
// a couple of App Router routes import from here. Most of this surface
// isn't actually exercised at runtime under TanStack/Vite — middleware
// doesn't run, and the App Router routes only call NextResponse.json —
// but the imports need to resolve to real values so the bundle compiles
// and consumers don't crash if they're invoked.

type NextInit = ResponseInit & {
  // Next attaches a `request` bag on `next()` to allow middleware to
  // mutate request headers before forwarding. Accepted-and-ignored here.
  request?: { headers?: HeadersInit }
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

function buildResponse(body: BodyInit | null, init?: NextInit): Response {
  // Strip the Next-only `request` field before handing off to the
  // standard Response constructor — it'd be retained as a non-standard
  // option and trip strict implementations.
  if (init && 'request' in init) {
    const { request: _request, ...rest } = init
    return new Response(body, rest)
  }
  return new Response(body, init)
}

export const NextResponse = {
  json: (data: unknown, init?: NextInit) => {
    // Response.json sets Content-Type for us; merge any caller headers.
    return Response.json(data, init && 'request' in init ? { ...init, request: undefined } : init)
  },

  // Middleware uses `NextResponse.next()` to signal "continue without
  // rewriting". Under TanStack we have no middleware runtime, so the
  // returned Response is effectively a placeholder that mirrors the
  // shape Next produces (empty 200).
  next: (init?: NextInit): Response => buildResponse(null, init),

  redirect: (url: string | URL, init?: number | NextInit): Response => {
    const status = typeof init === 'number' ? init : (init?.status ?? 307)
    if (!REDIRECT_STATUSES.has(status)) {
      throw new RangeError(
        `[next/server compat] NextResponse.redirect: invalid status ${status}; expected one of ${[...REDIRECT_STATUSES].join(', ')}`
      )
    }
    const headers = new Headers(typeof init === 'object' ? init?.headers : undefined)
    headers.set('Location', String(url))
    return new Response(null, { status, headers })
  },

  // Used in middleware to rewrite an incoming request to a different
  // path without changing the visible URL. Encoded by setting the
  // `x-middleware-rewrite` header (matches Next's runtime contract).
  rewrite: (destination: string | URL, init?: NextInit): Response => {
    const headers = new Headers(init?.headers)
    headers.set('x-middleware-rewrite', String(destination))
    return buildResponse(null, { ...init, headers })
  },

  error: (): Response => new Response(null, { status: 500 }),
}

// NextRequest extends Request with `nextUrl`, `cookies`, `geo`, and `ip`.
// None of our workspace source reads those fields at runtime — most
// imports are type-only. Aliasing the runtime value to the global
// Request constructor keeps value imports working (e.g. `import {
// NextRequest } from 'next/server'` followed by `(req: NextRequest) => …`
// type annotations under verbatimModuleSyntax / isolatedModules).
export const NextRequest = Request
export type NextRequest = Request

// Stub the type-only exports Next ships so consumers importing them
// don't need to special-case the shim.
export type NextMiddleware = (request: Request) => Response | Promise<Response> | undefined | void
export type MiddlewareConfig = {
  matcher?: string | string[]
}

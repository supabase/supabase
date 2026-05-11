import type { NextApiRequest, NextApiResponse } from 'next'

// Adapter that lets Next.js pages-router API handlers run under TanStack
// Start server routes without rewriting them. The adapter builds a
// NextApiRequest-shaped object from the Web `Request`, plus a
// NextApiResponse proxy that captures `status` / `setHeader` / `json` /
// `send` / `write` / `end` / `redirect` and produces a Web `Response`.
//
// Limitations (acceptable for the bulk of studio API routes):
// - Body is buffered: streaming handlers that want to flush to the client
//   before finishing will still buffer in memory. Studio has 2 such routes
//   (functions body.ts, mcp/index.ts) that need bespoke handling.
// - Body parsing covers JSON and urlencoded. Multipart/raw binary inbound
//   is not implemented — no studio route reads multipart in.

type NextHandler = (req: NextApiRequest, res: NextApiResponse) => unknown | Promise<unknown>

interface RouteCtx {
  request: Request
  params?: Record<string, string | undefined>
}

export function toWebHandler(handler: NextHandler) {
  return async ({ request, params = {} }: RouteCtx): Promise<Response> => {
    const req = await buildRequest(request, params)
    const { res, finalize } = buildResponse()

    const result = await handler(req, res)

    // Handlers like /api/ai/docs.ts already return a Web Response directly
    // (they were written for the edge runtime). Pass it through.
    if (result instanceof Response) return result

    return finalize()
  }
}

async function buildRequest(
  request: Request,
  params: Record<string, string | undefined>
): Promise<NextApiRequest> {
  const url = new URL(request.url)
  const method = request.method.toUpperCase()

  const headers: Record<string, string | string[]> = {}
  request.headers.forEach((value, key) => {
    const k = key.toLowerCase()
    const existing = headers[k]
    if (existing === undefined) {
      headers[k] = value
    } else if (Array.isArray(existing)) {
      existing.push(value)
    } else {
      headers[k] = [existing, value]
    }
  })

  const cookies: Record<string, string> = {}
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const trimmed = part.trim()
      if (!trimmed) continue
      const eq = trimmed.indexOf('=')
      const name = eq >= 0 ? trimmed.slice(0, eq) : trimmed
      const value = eq >= 0 ? trimmed.slice(eq + 1) : ''
      cookies[name] = decodeURIComponent(value)
    }
  }

  // Next merges route params and URL search params into `req.query`.
  // Duplicate keys become arrays (URLSearchParams.getAll).
  const query: Record<string, string | string[]> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) query[k] = v
  }
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key)
    query[key] = values.length === 1 ? values[0] : values
  }

  let body: unknown = undefined
  if (method !== 'GET' && method !== 'HEAD' && request.body) {
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const text = await request.text()
      body = text ? JSON.parse(text) : undefined
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text()
      body = Object.fromEntries(new URLSearchParams(text))
    } else {
      body = await request.text()
    }
  }

  // Surface a tiny subset of Node's `IncomingMessage` EventEmitter API so
  // handlers that wire client-abort via `req.on('close', …)` /
  // `req.on('aborted', …)` (e.g. AI streaming routes) can still hook into
  // the Web `Request.signal`. We don't model arbitrary event types — only
  // `close` and `aborted`, both of which fire when the signal aborts.
  const listeners: Record<string, Set<(...args: unknown[]) => void>> = {}
  const fireAbort = () => {
    for (const event of ['close', 'aborted'] as const) {
      const set = listeners[event]
      if (!set) continue
      for (const fn of set) {
        try {
          fn()
        } catch {
          // Swallow — Node would emit `error` on the request, but we
          // have nothing meaningful to do with it here.
        }
      }
    }
  }
  if (request.signal.aborted) {
    queueMicrotask(fireAbort)
  } else {
    request.signal.addEventListener('abort', fireAbort, { once: true })
  }

  return {
    method,
    url: url.pathname + url.search,
    headers,
    query,
    body,
    cookies,
    on(event: string, fn: (...args: unknown[]) => void) {
      ;(listeners[event] ??= new Set()).add(fn)
      return this
    },
    off(event: string, fn: (...args: unknown[]) => void) {
      listeners[event]?.delete(fn)
      return this
    },
    once(event: string, fn: (...args: unknown[]) => void) {
      const wrapper = (...args: unknown[]) => {
        listeners[event]?.delete(wrapper)
        fn(...args)
      }
      ;(listeners[event] ??= new Set()).add(wrapper)
      return this
    },
    removeListener(event: string, fn: (...args: unknown[]) => void) {
      listeners[event]?.delete(fn)
      return this
    },
    removeAllListeners(event?: string) {
      if (event) listeners[event]?.clear()
      else for (const set of Object.values(listeners)) set.clear()
      return this
    },
    emit(event: string, ...args: unknown[]) {
      const set = listeners[event]
      if (!set) return false
      for (const fn of set) fn(...args)
      return true
    },
  } as unknown as NextApiRequest
}

function buildResponse() {
  let statusCode = 200
  const responseHeaders = new Headers()
  const chunks: Uint8Array[] = []
  const encoder = new TextEncoder()

  const encode = (data: unknown): Uint8Array => {
    if (data instanceof Uint8Array) return data
    if (typeof data === 'string') return encoder.encode(data)
    if (data === undefined || data === null) return new Uint8Array(0)
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
      return new Uint8Array(data)
    }
    return encoder.encode(String(data))
  }

  const res = {} as NextApiResponse & Record<string, unknown>

  res.statusCode = 200
  res.status = (code: number) => {
    statusCode = code
    res.statusCode = code
    return res
  }
  res.setHeader = (name: string, value: number | string | readonly string[]) => {
    const key = name.toLowerCase()
    if (Array.isArray(value)) {
      responseHeaders.delete(key)
      for (const v of value) responseHeaders.append(key, String(v))
    } else {
      responseHeaders.set(key, String(value))
    }
    return res
  }
  res.getHeader = (name: string) => responseHeaders.get(name.toLowerCase()) ?? undefined
  res.getHeaders = () => {
    const out: Record<string, string> = {}
    responseHeaders.forEach((v, k) => {
      out[k] = v
    })
    return out
  }
  res.hasHeader = (name: string) => responseHeaders.has(name.toLowerCase())
  res.removeHeader = (name: string) => {
    responseHeaders.delete(name.toLowerCase())
  }
  res.json = (data: unknown) => {
    if (!responseHeaders.has('content-type')) {
      responseHeaders.set('content-type', 'application/json')
    }
    chunks.push(encode(JSON.stringify(data)))
    return res
  }
  res.send = (data: unknown) => {
    if (data === undefined || data === null) return res
    if (
      typeof data === 'object' &&
      !(data instanceof Uint8Array) &&
      !(typeof Buffer !== 'undefined' && Buffer.isBuffer(data))
    ) {
      return res.json(data)
    }
    chunks.push(encode(data))
    return res
  }
  res.write = (chunk: unknown) => {
    chunks.push(encode(chunk))
    return true
  }
  res.end = (data?: unknown) => {
    if (data !== undefined) chunks.push(encode(data))
    return res
  }
  res.redirect = (...args: unknown[]) => {
    const [status, location] =
      typeof args[0] === 'number' ? [args[0], args[1] as string] : [302, args[0] as string]
    statusCode = status
    res.statusCode = status
    responseHeaders.set('location', location)
    return res
  }

  const finalize = (): Response => {
    const totalLen = chunks.reduce((n, c) => n + c.length, 0)
    const payload = new Uint8Array(totalLen)
    let offset = 0
    for (const c of chunks) {
      payload.set(c, offset)
      offset += c.length
    }
    return new Response(payload.length === 0 ? null : payload, {
      status: statusCode,
      headers: responseHeaders,
    })
  }

  return { res, finalize }
}

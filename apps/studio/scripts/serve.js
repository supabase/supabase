#!/usr/bin/env node
// Standalone Node HTTP server that hosts the production studio build.
//
// We export the fetch-handler shape from `dist/server/server.js` because
// Vercel consumes it directly (see `apps/studio/api/server.js`). For
// self-hosted / e2e, we need an HTTP listener of our own — this is that
// listener.
//
// Responsibilities:
//   - Load env files in vite preview's order so non-NEXT_PUBLIC_* values
//     (POSTGRES_PASSWORD, PG_META_CRYPTO_KEY, etc.) are in process.env
//     at request time. NEXT_PUBLIC_* are already inlined into the bundle
//     at build time and don't need to be re-loaded.
//   - Serve static client assets from `dist/client/` directly with the
//     right MIME types and cache headers.
//   - Forward everything else to the TanStack Start handler exported
//     from `dist/server/server.js`.
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

import { readEnvFiles } from './lib/env.js'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const clientDir = path.join(studioRoot, 'dist/client')
const mode = process.env.MODE || 'production'

const envFiles = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]
const parsed = readEnvFiles(studioRoot, envFiles)
// Don't clobber values the shell already provides — match `vite preview`.
for (const [k, v] of Object.entries(parsed)) {
  if (process.env[k] !== undefined) continue
  process.env[k] = v.replace(
    /\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g,
    (_, name) => process.env[name] ?? parsed[name] ?? ''
  )
}

// Initialize server-side Sentry now that .env values are in process.env (the
// instrument module reads process.env.NEXT_PUBLIC_SENTRY_DSN at call time).
// Imported dynamically here rather than via a `--import` flag so it runs after
// the env-loading block above. Non-fatal if the SDK isn't present.
try {
  await import(path.join(studioRoot, 'instrument.server.mjs'))
} catch (err) {
  console.warn('[serve] Sentry server init skipped:', err?.message ?? err)
}
const { wrapFetchWithSentry } = await import('@sentry/tanstackstart-react').catch(() => ({
  wrapFetchWithSentry: (fetchHandler) => fetchHandler,
}))

const { default: rawHandler } = await import(path.join(studioRoot, 'dist/server/server.js'))
// Wrap so request-scoped errors (incl. ones swallowed into a 500) are captured.
const handler = {
  ...rawHandler,
  fetch: wrapFetchWithSentry(rawHandler.fetch.bind(rawHandler)),
}

const mimeByExt = new Map([
  ['.js', 'application/javascript; charset=utf-8'],
  ['.mjs', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json'],
])

// Vite emits hashed filenames (e.g. `index-DB4J79t9.js`) for everything
// it bundles. Those are content-addressed so we serve them immutable.
const HASHED_RE = /-[A-Za-z0-9_-]{6,}\.[a-z0-9]+$/

async function serveStatic(req, res) {
  let pathname
  try {
    pathname = new URL(req.url, 'http://localhost').pathname
  } catch {
    return false
  }
  if (pathname === '/' || pathname.endsWith('/')) return false
  if (pathname.includes('..') || pathname.includes('\\')) return false
  const filePath = path.join(clientDir, pathname)
  if (!filePath.startsWith(clientDir + path.sep)) return false

  let st
  try {
    st = await stat(filePath)
  } catch {
    return false
  }
  if (!st.isFile()) return false

  res.statusCode = 200
  res.setHeader(
    'content-type',
    mimeByExt.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream'
  )
  res.setHeader('content-length', String(st.size))
  res.setHeader(
    'cache-control',
    HASHED_RE.test(pathname) ? 'public, max-age=31536000, immutable' : 'no-cache'
  )
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath)
    stream.on('error', reject)
    stream.on('end', resolve)
    stream.pipe(res)
  })
  return true
}

function toWebRequest(req) {
  const protocol = req.socket.encrypted ? 'https' : 'http'
  const url = `${protocol}://${req.headers.host ?? 'localhost'}${req.url}`
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (k.startsWith(':')) continue
    if (Array.isArray(v)) for (const vv of v) headers.append(k, vv)
    else if (v !== undefined) headers.set(k, v)
  }
  const init = { method: req.method, headers }
  // Only attach a body for methods that can carry one AND that actually
  // have body bytes coming. Wrapping `req` in `Readable.toWeb(req)` for
  // requests where Node has nothing to deliver leaves undici's
  // `extractBody` looking at an already-consumed stream and throwing
  // `TypeError: Response body object should not be disturbed or locked`
  // at the `new Request(...)` call below.
  const contentLength = Number(req.headers['content-length'] ?? '0')
  const hasBody =
    req.method !== 'GET' &&
    req.method !== 'HEAD' &&
    (contentLength > 0 || req.headers['transfer-encoding'] === 'chunked')
  if (hasBody) {
    init.body = Readable.toWeb(req)
    init.duplex = 'half'
  }
  return new Request(url, init)
}

async function pipeWebResponse(response, res) {
  res.statusCode = response.status
  // The Headers iterator collapses duplicate keys, and for `set-cookie` it joins
  // every cookie into one comma-separated value — which corrupts auth/session
  // cookies. Pull the cookies out separately via getSetCookie() and set them as
  // an array so each one becomes its own header.
  const setCookies =
    typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : []
  for (const [k, v] of response.headers) {
    if (k.toLowerCase() === 'set-cookie') continue
    res.setHeader(k, v)
  }
  if (setCookies.length > 0) res.setHeader('set-cookie', setCookies)
  if (!response.body) {
    res.end()
    return
  }
  // Pipe via Readable.fromWeb so the underlying stream gets proper backpressure
  // and gets released cleanly. `for await (chunk of response.body)` works in
  // simple cases but can leave the body in a "disturbed / locked" state when
  // the handler internally peeks at it — surfacing as
  // `TypeError: Response body object should not be disturbed or locked` on a
  // subsequent request.
  await new Promise((resolve, reject) => {
    const readable = Readable.fromWeb(response.body)
    readable.on('error', reject)
    res.on('error', reject)
    res.on('close', resolve)
    res.on('finish', resolve)
    readable.pipe(res)
  })
}

// Security headers for the self-hosted server. Mirrors the non-platform branch
// of next.config.ts `headers()` (self-hosted is always IS_PLATFORM=false, so the
// CSP is just `frame-ancestors 'none'` and there's no HSTS). The platform CSP is
// applied at the edge via vercel.ts instead; see security-headers.ts. Set before
// any response is written so both the static and handler paths inherit them.
const SECURITY_HEADERS = [
  ['X-Frame-Options', 'DENY'],
  ['X-Content-Type-Options', 'nosniff'],
  ['Content-Security-Policy', "frame-ancestors 'none';"],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
]

const port = Number(process.env.PORT || 8082)
createServer(async (req, res) => {
  try {
    for (const [key, value] of SECURITY_HEADERS) res.setHeader(key, value)
    if (await serveStatic(req, res)) return
    const response = await handler.fetch(toWebRequest(req))
    await pipeWebResponse(response, res)
  } catch (err) {
    console.error('[serve] request failed:', err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('content-type', 'text/plain; charset=utf-8')
    }
    res.end('Internal Server Error')
  }
}).listen(port, () => {
  console.log(`Studio listening on http://localhost:${port} (mode=${mode})`)
})

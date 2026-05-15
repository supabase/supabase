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

import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const clientDir = path.join(studioRoot, 'dist/client')
const mode = process.env.MODE || 'production'

const dotenvLine = /^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*?)\s*$/
const envFiles = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]
const parsed = {}
for (const file of envFiles) {
  let content
  try {
    content = await readFile(path.join(studioRoot, file), 'utf8')
  } catch {
    continue
  }
  for (const raw of content.split('\n')) {
    const m = dotenvLine.exec(raw)
    if (!m) continue
    let v = m[2]
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    parsed[m[1]] = v
  }
}
// Don't clobber values the shell already provides — match `vite preview`.
for (const [k, v] of Object.entries(parsed)) {
  if (process.env[k] !== undefined) continue
  process.env[k] = v.replace(
    /\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g,
    (_, name) => process.env[name] ?? parsed[name] ?? ''
  )
}

const { default: handler } = await import(path.join(studioRoot, 'dist/server/server.js'))

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
  res.setHeader('content-type', mimeByExt.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream')
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
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = Readable.toWeb(req)
    init.duplex = 'half'
  }
  return new Request(url, init)
}

async function pipeWebResponse(response, res) {
  res.statusCode = response.status
  for (const [k, v] of response.headers) res.setHeader(k, v)
  if (response.body) {
    for await (const chunk of response.body) res.write(chunk)
  }
  res.end()
}

const port = Number(process.env.PORT || 8082)
createServer(async (req, res) => {
  try {
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

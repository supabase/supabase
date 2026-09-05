#!/usr/bin/env node
// Post-build gate for the TanStack/Nitro build; runs from `build:tanstack`.
//
// 1. Boots the built server and requests a cheap API route with a
//    platform-like env. The Start entry evaluates the whole route tree on the
//    first request, so a module-scope side effect that needs a self-hosted-only
//    env var (e.g. `createClient(process.env.SUPABASE_URL!)`) would 500 every
//    route on Vercel; this fails the build instead.
// 2. On Vercel builds, asserts `.vercel/output` has the routing the SPA relies
//    on (written by scripts/vercel-spa-routes.ts): documents from the static
//    shell, only `/api/*` and `/_serverFn/*` into the function. A Nitro or
//    TanStack Start upgrade that changes the output shape fails here instead
//    of silently invoking the function per page view.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Must match scripts/vercel-spa-routes.ts.
const SHELL_PATH = '/_shell.html'
const SERVER_FN_BASE = '/_serverFn'
const API_PREFIX = '/api'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const vercelOut = path.join(studioRoot, '.vercel/output')

const fail = (msg) => {
  console.error(`\n[verify-build] FAIL: ${msg}\n`)
  process.exit(1)
}

// Simulate the platform function runtime: these are only set on self-hosted,
// so removing them surfaces any route that needs them at module-load time.
for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  delete process.env[key]
}

// A module that fails to evaluate inside the route tree surfaces as an
// unhandled rejection, not as a 5xx on an unrelated route, so treat one as a
// failed boot too.
process.on('unhandledRejection', (reason) => {
  fail(`unhandled rejection while booting the server:\n${reason?.stack ?? reason}`)
})

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// A request to any route forces the full route tree to load, so one cheap,
// dependency-free endpoint is enough to exercise the boot.
const SMOKE_ROUTE = `${BASE_PATH}/api/get-utc-time`

function checkVercelOutput() {
  const functionsDir = path.join(vercelOut, 'functions')
  const funcs = existsSync(functionsDir)
    ? readdirSync(functionsDir).filter((f) => f.endsWith('.func'))
    : []
  if (funcs.length !== 1) fail(`expected exactly one .func dir, found ${JSON.stringify(funcs)}`)
  const funcDir = path.join(functionsDir, funcs[0])
  if (!existsSync(path.join(funcDir, '.vc-config.json'))) {
    fail(`${funcs[0]}/.vc-config.json missing (did the vercel preset's compiled hook run?)`)
  }
  const functionDest = `/${funcs[0].replace(/\.func$/, '')}`

  const shellFile = path.join(vercelOut, 'static', SHELL_PATH.slice(1))
  if (!existsSync(shellFile))
    fail(`${SHELL_PATH} missing: TanStack Start did not prerender the SPA shell`)
  if (existsSync(path.join(vercelOut, 'static/index.html'))) {
    fail('static/index.html exists: a prerendered "/" would shadow the shell rewrite')
  }

  const { routes } = JSON.parse(readFileSync(path.join(vercelOut, 'config.json'), 'utf8'))
  const fsIdx = routes.findIndex((r) => r.handle === 'filesystem')
  if (routes.filter((r) => r.handle === 'filesystem').length !== 1) {
    fail('expected exactly one { handle: "filesystem" }')
  }
  const earlyDest = routes.slice(0, fsIdx).find((r) => r.dest)
  if (earlyDest) fail(`route before filesystem has a dest: ${JSON.stringify(earlyDest)}`)

  // Hashed chunks live under whatever prefix Nitro's immutable cache-control
  // rule covers: `/assets`, or `/_vercel/immutable/<salt>/nitro`.
  const assetRule = routes.find(
    (r) => r.headers?.['cache-control']?.includes('immutable') && r.src?.endsWith('/(.*)')
  )
  if (!assetRule) fail('no immutable cache-control rule for hashed assets')
  const assetsPrefix = assetRule.src.replace(/\/\(\.\*\)$/, '')
  const shellAssets = [
    ...readFileSync(shellFile, 'utf8').matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css))"/g),
  ].map((m) => m[1])
  const stray = shellAssets.filter((url) => !url.startsWith(`${assetsPrefix}/`))
  if (shellAssets.length === 0 || stray.length > 0) {
    fail(`shell must reference its chunks under ${assetsPrefix}/, got ${JSON.stringify(stray)}`)
  }

  const expectedTail = [
    ...(BASE_PATH ? [BASE_PATH, ''] : ['']).flatMap((prefix) => [
      { src: `${prefix}${SERVER_FN_BASE}/(.*)`, dest: functionDest },
      { src: `${prefix}${API_PREFIX}/(.*)`, dest: functionDest },
    ]),
    { src: `${assetsPrefix}/(.*)`, status: 404 },
    ...(BASE_PATH ? [{ src: `${BASE_PATH}/(.*\\.\\w+)`, dest: '/$1' }] : []),
    { src: '/(.*)', dest: SHELL_PATH },
  ]
  const tail = routes.slice(-expectedTail.length)
  if (JSON.stringify(tail) !== JSON.stringify(expectedTail)) {
    fail(
      `last routes must be\n${JSON.stringify(expectedTail, null, 2)}\nbut are\n${JSON.stringify(tail, null, 2)}`
    )
  }
  const catchAlls = routes.filter((r) => r.src === '/(.*)' && r.dest)
  if (catchAlls.length !== 1)
    fail(`expected one "/(.*)" catch-all, found ${JSON.stringify(catchAlls)}`)

  console.log(
    `[verify-build] ✓ .vercel/output: documents -> ${SHELL_PATH}, ${SERVER_FN_BASE}/* and ${API_PREFIX}/* -> ${functionDest}, chunks under ${assetsPrefix}/`
  )
  return path.join(funcDir, 'index.mjs')
}

async function smoke(request, label) {
  console.log(`[verify-build] booting ${label}`)
  let res
  try {
    res = await request(SMOKE_ROUTE)
  } catch (err) {
    fail(`${SMOKE_ROUTE} threw while booting the server:\n${err?.stack ?? err}`)
  }
  if (res.status >= 500) {
    const body = await res.text().catch(() => '')
    fail(
      `${SMOKE_ROUTE} -> ${res.status}\n${body.slice(0, 800)}\n` +
        'The server bundle does not boot cleanly. A route module probably has a top-level side ' +
        'effect (e.g. createClient at module scope with a missing env var); make it lazy so it ' +
        'only runs inside the handler.'
    )
  }
  console.log(`[verify-build] ✓ ${SMOKE_ROUTE} -> ${res.status}`)
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

async function fetchWhenListening(url, attempts = 50) {
  for (let i = 0; ; i++) {
    try {
      return await fetch(url)
    } catch (err) {
      if (i >= attempts) throw err
      await new Promise((r) => setTimeout(r, 200))
    }
  }
}

if (existsSync(path.join(vercelOut, 'config.json'))) {
  const entry = checkVercelOutput()
  // Nitro's vercel entry (web format) exports `{ fetch(request) }`.
  const { default: handler } = await import(entry)
  if (typeof handler?.fetch !== 'function') fail(`${entry} does not export a fetch handler`)
  await smoke(
    (route) => handler.fetch(new Request(`http://localhost${route}`)),
    path.relative(studioRoot, entry)
  )
} else {
  // Nitro's node-server entry listens on PORT as soon as it is imported.
  const entry = path.join(studioRoot, '.output/server/index.mjs')
  if (!existsSync(entry))
    fail(`${path.relative(studioRoot, entry)} missing: did \`vite build\` run?`)
  const port = await freePort()
  process.env.PORT = String(port)
  await import(entry)
  await smoke(
    (route) => fetchWhenListening(`http://127.0.0.1:${port}${route}`),
    path.relative(studioRoot, entry)
  )
}

console.log('[verify-build] passed')
process.exit(0)

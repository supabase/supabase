#!/usr/bin/env node
// Post-build smoke test: boot the built TanStack server handler and make a
// real request with a platform-like environment, so module-scope boot
// crashes fail the BUILD instead of the deployed function at runtime.
//
// Why this exists: the TanStack server entry eagerly imports the entire route
// tree (`loadEntries`), so every route module is evaluated the first time the
// single function handler serves a request. A bad top-level side effect in any
// one route — e.g. `createClient(process.env.SUPABASE_URL!, ...)` at module
// scope, where SUPABASE_URL is unset on platform — throws during that import
// and 500s every route, including trivial ones like /api/get-utc-time. Those
// failures only showed up at runtime on Vercel; this catches them at build.
//
// What this catches: anything that throws while the route tree is imported
// (the most common class — missing env vars read at module scope).
// What this does NOT catch: assets missing from the *Vercel function bundle*
// (e.g. libpg-query.wasm). Local node_modules still has those, so booting the
// plain `dist/server` build won't surface them — that needs booting the
// `vercel build` output. Pass that function's entry as argv[1] to reuse this
// script in a deploy-gating CI step.

import path from 'node:path'
import { fileURLToPath } from 'node:url'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const serverEntry = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(studioRoot, 'dist/server/server.js')

// Simulate the platform function runtime: these are only set on self-hosted,
// so removing them surfaces any route that needs them at module-load time.
for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  delete process.env[key]
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// A request to any route forces `loadEntries` to import the full route tree,
// so a single cheap, dependency-free endpoint is enough to exercise the boot.
const ROUTES = ['/api/get-utc-time']

console.log(`[smoke] booting ${path.relative(studioRoot, serverEntry)}`)
const { default: handler } = await import(serverEntry)

let failed = false
for (const route of ROUTES) {
  const url = `http://localhost${basePath}${route}`
  try {
    const res = await handler.fetch(new Request(url))
    if (res.status >= 500) {
      failed = true
      const body = await res.text().catch(() => '')
      console.error(`[smoke] ✗ ${route} → ${res.status}\n${body.slice(0, 800)}`)
    } else {
      console.log(`[smoke] ✓ ${route} → ${res.status}`)
    }
  } catch (err) {
    failed = true
    console.error(`[smoke] ✗ ${route} threw while booting the server:\n`, err)
  }
}

if (failed) {
  console.error(
    '\n[smoke] FAILED — the server bundle does not boot cleanly. This usually means a\n' +
      'route module has a top-level side effect (e.g. createClient at module scope with a\n' +
      'missing env var). Make it lazy so it only runs inside the handler.'
  )
  process.exit(1)
}

console.log('\n[smoke] passed — server boots and routes respond without a 5xx.')
process.exit(0)

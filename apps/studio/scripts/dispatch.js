#!/usr/bin/env node
// Dispatch a top-level npm script (dev/build/start) to either the next- or
// tanstack-flavoured variant based on STUDIO_FRAMEWORK. We parse the env files
// (via the shared scripts/lib/env.js parser) and pull out only
// STUDIO_FRAMEWORK — we deliberately don't load the whole file into the
// child's process.env, because scripts/serve.js / vite do their own .env
// loading and would otherwise refuse to override the dispatcher-set values,
// including NEXT_PUBLIC_IS_PLATFORM which the e2e `.env.test` needs to flip to
// `false`.
//
// Usage: node scripts/dispatch.js <target>
//   target ∈ { dev, build, start }
//
// Resolves to `pnpm run <target>:<framework>` where framework is `tanstack`
// when STUDIO_FRAMEWORK=tanstack (set in the shell env, `.env`, or
// `.env.local`), otherwise `next`.
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readEnvFiles } from './lib/env.js'

const target = process.argv[2]
if (!target) {
  console.error('dispatch.js: missing target (expected one of: dev, build, start)')
  process.exit(2)
}

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Shell env wins, then `.env.local`, then `.env` — the same precedence
// scripts/serve.js and vite use, so STUDIO_FRAMEWORK set in either file is
// picked up (not just `.env.local`).
const fileEnv = readEnvFiles(studioRoot, ['.env', '.env.local'])
const studioFramework = process.env.STUDIO_FRAMEWORK ?? fileEnv.STUDIO_FRAMEWORK
const framework = studioFramework === 'tanstack' ? 'tanstack' : 'next'
const script = `${target}:${framework}`

// Use async `spawn` rather than `spawnSync` — long-running dev servers
// (vite dev / next dev) wedge under `spawnSync` because Node holds the
// event loop and stdin doesn't flow through cleanly. The dev server says
// "ready" then exits ~1s later. `spawn` + manual forwarding keeps the
// child interactive and lets the parent exit cleanly when the child does.
const child = spawn('pnpm', ['run', script], {
  stdio: 'inherit',
  env: process.env,
})

const forwardSignal = (signal) => {
  if (!child.killed) child.kill(signal)
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT']) {
  process.on(signal, () => forwardSignal(signal))
}

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})

child.on('error', (err) => {
  console.error('dispatch.js: failed to spawn child:', err)
  process.exit(1)
})

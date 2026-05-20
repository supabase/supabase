#!/usr/bin/env node
// Dispatch a top-level npm script (dev/build/start) to either the next- or
// tanstack-flavoured variant based on STUDIO_FRAMEWORK. Invoked from
// package.json scripts wrapped in `node --env-file-if-exists=.env.local`,
// so a local .env.local opts the developer into the TanStack path while
// the Vercel Next.js prod project (no env var) gets the next path.
//
// Usage: node scripts/dispatch.js <target>
//   target ∈ { dev, build, start }
//
// Resolves to `pnpm run <target>:<framework>` where framework is `tanstack`
// when STUDIO_FRAMEWORK=tanstack, otherwise `next`.
import { spawnSync } from 'node:child_process'

const target = process.argv[2]
if (!target) {
  console.error('dispatch.js: missing target (expected one of: dev, build, start)')
  process.exit(2)
}

const framework = process.env.STUDIO_FRAMEWORK === 'tanstack' ? 'tanstack' : 'next'
const script = `${target}:${framework}`

const result = spawnSync('pnpm', ['run', script], {
  stdio: 'inherit',
  env: process.env,
})

process.exit(result.status ?? 1)

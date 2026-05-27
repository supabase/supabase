#!/usr/bin/env node
// Dispatch a top-level npm script (dev/build/start) to either the next- or
// tanstack-flavoured variant based on STUDIO_FRAMEWORK. Read .env.local
// manually for STUDIO_FRAMEWORK only (we don't want to leak the whole file
// into the child's process.env — scripts/serve.js / vite handle .env file
// loading themselves and would otherwise refuse to override the
// dispatcher-set values, including NEXT_PUBLIC_IS_PLATFORM which the e2e
// `.env.test` needs to flip to `false`).
//
// Usage: node scripts/dispatch.js <target>
//   target ∈ { dev, build, start }
//
// Resolves to `pnpm run <target>:<framework>` where framework is `tanstack`
// when STUDIO_FRAMEWORK=tanstack (set in shell env or .env.local),
// otherwise `next`.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const target = process.argv[2]
if (!target) {
  console.error('dispatch.js: missing target (expected one of: dev, build, start)')
  process.exit(2)
}

function readEnvLocalKey(key) {
  try {
    const content = readFileSync('.env.local', 'utf8')
    const line = /^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*?)\s*$/
    for (const raw of content.split('\n')) {
      const m = line.exec(raw)
      if (!m || m[1] !== key) continue
      let v = m[2]
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      return v
    }
  } catch {
    // .env.local doesn't exist — fine, fall through.
  }
  return undefined
}

const studioFramework = process.env.STUDIO_FRAMEWORK ?? readEnvLocalKey('STUDIO_FRAMEWORK')
const framework = studioFramework === 'tanstack' ? 'tanstack' : 'next'
const script = `${target}:${framework}`

const result = spawnSync('pnpm', ['run', script], {
  stdio: 'inherit',
  env: process.env,
})

process.exit(result.status ?? 1)

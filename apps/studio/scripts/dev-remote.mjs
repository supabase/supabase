#!/usr/bin/env node
// Launch Studio against a hosted backend, à la Sentry dev-ui.
// See scripts/dev-tools-extension/README.md.
//   pnpm dev:studio:remote[:staging]   (--print to dry-run)

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const STUDIO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = process.env.STUDIO_PORT ?? '8082'
const ORIGIN = `http://localhost:${PORT}`

// Hosted backends the proxy forwards to. null = not wired yet (override via env).
const TARGETS = {
  production: {
    REMOTE_API_URL: 'https://api.supabase.com',
    REMOTE_GOTRUE_URL: 'https://alt.supabase.io/auth/v1',
  },
  staging: {
    // supabase.green — TODO: fill in staging hosts.
    REMOTE_API_URL: null,
    REMOTE_GOTRUE_URL: null,
  },
}

const args = process.argv.slice(2)
const printOnly = args.includes('--print')
const targetName = (args.find((arg) => !arg.startsWith('--')) ?? 'production').toLowerCase()

const target = TARGETS[targetName]
if (!target) {
  console.error(`Unknown target "${targetName}". Use one of: ${Object.keys(TARGETS).join(', ')}`)
  process.exit(1)
}

const apiUrl = process.env.REMOTE_API_URL || target.REMOTE_API_URL
const gotrueUrl = process.env.REMOTE_GOTRUE_URL || target.REMOTE_GOTRUE_URL

if (!apiUrl || !gotrueUrl) {
  console.error(
    `\n"${targetName}" endpoints aren't set.\n` +
      `Fill them into TARGETS in scripts/dev-remote.mjs, or pass REMOTE_API_URL / REMOTE_GOTRUE_URL.\n`
  )
  process.exit(1)
}

// Only fill what the caller hasn't set, so env overrides win.
const defaults = {
  NEXT_PUBLIC_IS_PLATFORM: 'true',
  REMOTE_DEV: 'true',
  REMOTE_API_URL: apiUrl,
  REMOTE_GOTRUE_URL: gotrueUrl,
  NEXT_PUBLIC_API_URL: `${ORIGIN}/platform`,
  NEXT_PUBLIC_GOTRUE_URL: `${ORIGIN}/auth/v1`,
  NEXT_PUBLIC_SITE_URL: ORIGIN,
  STUDIO_PORT: PORT,
}
const env = { ...process.env }
for (const [key, value] of Object.entries(defaults)) {
  if (env[key] === undefined || env[key] === '') env[key] = value
}

console.log(`\n▶ Studio remote dev — target: ${targetName}`)
console.log(`   control plane : ${env.REMOTE_API_URL}`)
console.log(`   auth (GoTrue) : [set]`)
console.log(`   local URL     : ${ORIGIN}`)
console.log(`   ⚠  Points at a hosted backend — treat every action as real.\n`)

if (printOnly) process.exit(0)

// Run the dev server directly (not via turbo) so the injected env reaches it.
const child = spawn('pnpm', ['run', 'dev'], { cwd: STUDIO_DIR, env, stdio: 'inherit' })
process.on('SIGINT', () => {})
child.on('close', (code) => process.exit(code ?? 0))

#!/usr/bin/env node
// Boots the production build (`.output/server/index.mjs`, Nitro's node
// server) for self-hosted and e2e runs.
//
// The only thing this adds over `node .output/server/index.mjs` is the env
// file cascade vite uses at build time — `.env` < `.env.local` < `.env.<MODE>`
// < `.env.<MODE>.local`, with values already in the shell winning — because
// the server reads process.env only, and the self-hosted/e2e values
// (POSTGRES_PASSWORD, `SUPABASE_URL=$API_URL`, …) live in those files.
// `$VAR` references are expanded the way vite's loadEnv expands them.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readEnvFiles } from './lib/env.js'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const mode = process.env.MODE || 'production'

const parsed = readEnvFiles(studioRoot, [
  '.env',
  '.env.local',
  `.env.${mode}`,
  `.env.${mode}.local`,
])
for (const [key, value] of Object.entries(parsed)) {
  if (process.env[key] !== undefined) continue
  process.env[key] = value.replace(
    /\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g,
    (_, name) => process.env[name] ?? parsed[name] ?? ''
  )
}

process.env.PORT ??= '8082'

await import(path.join(studioRoot, '.output/server/index.mjs'))

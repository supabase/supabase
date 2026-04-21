// scripts/patch-vercel-config.ts
import { readFileSync, writeFileSync } from 'node:fs'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
// Normalize: ensure leading slash, no trailing slash
// '' stays '', '/foo/' becomes '/foo', 'foo' becomes '/foo'
const base = basePath ? '/' + basePath.replace(/^\/+|\/+$/g, '') : ''

const path = '.vercel/output/config.json'
const config = JSON.parse(readFileSync(path, 'utf-8'))

config.routes = [
  {
    src: `${base}/assets/(.*)`,
    headers: { 'cache-control': 'public, max-age=31536000, immutable' },
  },
  { src: `${base}/api/(.*)`, dest: '/__server' },
  { src: `${base}/_serverFn/(.*)`, dest: '/__server' },
  { handle: 'filesystem' },
  { handle: 'miss' },
  { src: `${base}(/.*)?`, dest: `${base}/_shell.html`, check: true },
]

writeFileSync(path, JSON.stringify(config, null, 2))
console.log(`✓ Patched .vercel/output/config.json (basePath: ${base || '(none)'})`)

const handleCount = config.routes.filter((r: any) => r.handle === 'filesystem').length
if (handleCount !== 1) {
  console.error(`Expected exactly 1 filesystem handle, got ${handleCount}`)
  process.exit(1)
}

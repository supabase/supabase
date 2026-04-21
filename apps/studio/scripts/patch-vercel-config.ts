import { readFileSync, writeFileSync } from 'node:fs'

const path = '.vercel/output/config.json'
const config = JSON.parse(readFileSync(path, 'utf-8'))

config.routes = [
  {
    src: '/assets/(.*)',
    headers: { 'cache-control': 'public, max-age=31536000, immutable' },
  },
  { handle: 'filesystem' },
  { src: '/api/(.*)', dest: '/__server' },
  { src: '/_serverFn/(.*)', dest: '/__server' },
  { src: '/(.*)', dest: '/_shell.html' },
]

writeFileSync(path, JSON.stringify(config, null, 2))
console.log('✓ Patched .vercel/output/config.json')

// Sanity check — fail the build if something unexpected happens
const handleCount = config.routes.filter((r: any) => r.handle === 'filesystem').length
if (handleCount !== 1) {
  console.error(`Expected exactly 1 filesystem handle, got ${handleCount}`)
  process.exit(1)
}

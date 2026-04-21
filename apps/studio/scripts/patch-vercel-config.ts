import { readFileSync, writeFileSync } from 'node:fs'

const path = '.vercel/output/config.json'
const config = JSON.parse(readFileSync(path, 'utf-8'))

config.routes = [
  {
    src: '/assets/(.*)',
    headers: { 'cache-control': 'public, max-age=31536000, immutable' },
  },
  // API and server functions go to the function (before filesystem so they short-circuit)
  { src: '/api/(.*)', dest: '/__server' },
  { src: '/_serverFn/(.*)', dest: '/__server' },
  // Rewrite all other paths to the shell BEFORE filesystem check
  // so the filesystem then serves _shell.html as a static file
  { src: '/((?!assets/).*)', dest: '/_shell.html' },
  { handle: 'filesystem' },
]

writeFileSync(path, JSON.stringify(config, null, 2))
console.log('✓ Patched .vercel/output/config.json')

// Sanity check — fail the build if something unexpected happens
const handleCount = config.routes.filter((r: any) => r.handle === 'filesystem').length
if (handleCount !== 1) {
  console.error(`Expected exactly 1 filesystem handle, got ${handleCount}`)
  process.exit(1)
}

#!/usr/bin/env node
/**
 * Runs the whole MCP Apps stack locally, end to end:
 *
 *   surfaces   scripts/build.mjs --watch            -> dist/v1
 *   server     Supabase MCP server --http on :3111   the server that ships to production
 *   host       host/ on :5180                        chat + MCP Apps bridge, like Claude or ChatGPT
 *
 *   (default)              the server inlines dist/v1 into each document
 *   --assets-url=<https>   the server links a deployed build instead, as in production,
 *                          e.g. a preview deployment's https://…/v1. Views run in
 *                          opaque-origin sandboxes that cannot load from localhost,
 *                          in this host as in Claude and ChatGPT.
 *   --platform=api    your real Supabase account via SUPABASE_ACCESS_TOKEN (default)
 *   --platform=mock   mocked Management API with PGlite databases: no account, no real data
 *
 * Reads SUPABASE_ACCESS_TOKEN and HOST_MODEL from the environment or from
 * apps/mcp-apps/.env.host. The MCP server comes from the linked
 * @supabase/mcp-server-supabase package; build it there first.
 */
import { spawn } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadEnvFile } from '../host/server/env.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const assetsUrl = process.argv.find((arg) => arg.startsWith('--assets-url='))?.slice(13)
const platform = process.argv.find((arg) => arg.startsWith('--platform='))?.slice(11) ?? 'api'
if (!['api', 'mock'].includes(platform) || (assetsUrl && !assetsUrl.startsWith('https://'))) {
  console.error('Usage: dev-e2e.mjs [--assets-url=https://…/v1] [--platform=api|mock]')
  process.exit(1)
}
loadEnvFile(join(root, '.env.host'))
if (platform === 'mock') {
  // The mock platform accepts only its own token.
  process.env.SUPABASE_ACCESS_TOKEN = 'dummy-token'
} else if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.error(
    'Set SUPABASE_ACCESS_TOKEN (or add it to apps/mcp-apps/.env.host), or use --platform=mock.'
  )
  process.exit(1)
}

// The package does not export package.json, so find its directory through the link.
const mcpPackage = realpathSync(join(root, 'node_modules', '@supabase', 'mcp-server-supabase'))
const cli = join(mcpPackage, 'dist', 'cli.js')
if (!existsSync(cli)) {
  console.error(
    `The MCP server is not built in ${mcpPackage}. Run \`pnpm --filter @supabase/mcp-server-supabase build\` in the mcp repository.`
  )
  process.exit(1)
}

const colors = { surfaces: 35, server: 33, host: 32 }
const children = []

function run(name, command, args, cwd = root) {
  const child = spawn(command, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
  const prefix = `\x1b[${colors[name]}m${name.padEnd(8)}\x1b[0m`
  for (const stream of [child.stdout, child.stderr]) {
    let buffer = ''
    stream.on('data', (chunk) => {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) if (line.trim()) console.log(`${prefix} ${line}`)
    })
  }
  child.on('exit', (code) => {
    console.log(`${prefix} exited with ${code}`)
    shutdown(code ?? 1)
  })
  children.push(child)
}

let stopping = false
function shutdown(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGTERM')
  process.exit(code)
}
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

const vite = join(root, 'node_modules', '.bin', 'vite')
run('surfaces', process.execPath, [join(root, 'scripts', 'build.mjs'), '--watch'])
const appsArgs = [
  ...(assetsUrl ? ['--apps-url', assetsUrl] : ['--apps-dir', join(root, 'dist', 'v1')]),
]
if (platform === 'mock') {
  run(
    'server',
    process.execPath,
    [
      '--import',
      'tsx',
      '--import',
      './scripts/dev-loader.mjs',
      'scripts/dev-mock-server.ts',
      '--port',
      '3111',
      ...appsArgs,
    ],
    mcpPackage
  )
} else {
  run('server', process.execPath, [cli, '--http', '--port', '3111', ...appsArgs])
}
run('host', vite, ['--config', 'host/vite.config.ts'])
console.log(
  `Open http://localhost:5180 once the surfaces build finishes (assets: ${assetsUrl ?? 'inlined from dist/v1'}, platform: ${platform}).`
)

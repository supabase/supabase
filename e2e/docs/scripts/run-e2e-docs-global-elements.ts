#!/usr/bin/env node
/**
 * Entry for `pnpm e2e:docs:global-elements`. Scope is the fixed page list in
 * utils/docs-global-elements.ts, so unlike `pnpm e2e:docs` this resolves nothing from
 * git. Extra CLI args are forwarded to Playwright.
 */
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const E2E_DOCS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// Mirrors the default in playwright.global-elements.config.ts.
const DEFAULT_BASE_URL = 'http://localhost:3001'
const PREFLIGHT_TIMEOUT_MS = 3_000

async function isBaseUrlReachable(baseUrl: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PREFLIGHT_TIMEOUT_MS)
  try {
    await fetch(baseUrl, { signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

async function main() {
  const playwrightArgs = process.argv.slice(2).filter((arg) => arg !== '--')

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim() || DEFAULT_BASE_URL
  if (!(await isBaseUrlReachable(baseUrl))) {
    console.error(`No docs server responding at ${baseUrl}.`)
    if (!process.env.PLAYWRIGHT_BASE_URL) {
      console.error('Start it with `pnpm dev:docs`, or point at a deployed site:')
      console.error('  PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs:global-elements')
    } else {
      console.error('Check that the URL is correct and reachable.')
    }
    process.exit(1)
  }

  const child = spawn(
    'pnpm',
    [
      'exec',
      'playwright',
      'test',
      '--config=playwright.global-elements.config.ts',
      ...playwrightArgs,
    ],
    {
      cwd: E2E_DOCS_ROOT,
      env: process.env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  )

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    process.exit(code ?? 1)
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

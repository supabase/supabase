#!/usr/bin/env node
/**
 * Default entry for `pnpm e2e:docs`.
 *
 * If DOCS_E2E_PAGE_PATHS is already set (CI, or an explicit local override),
 * runs Playwright with that list. Otherwise resolves pages from files changed
 * vs DOCS_E2E_BASE_REF (default origin/master), including the working tree.
 *
 * Pass `--all` to test every in-scope guide and troubleshooting page instead
 * (hundreds of pages — expect a long run against a deployed site).
 *
 * Extra CLI args are forwarded to Playwright (e.g. --ui, a spec file path).
 */
import { spawn, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  parseChangedFilesList,
  resolveAllDocsPages,
  resolveDocsScope,
} from '../utils/resolve-docs-scope.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const E2E_DOCS_ROOT = join(__dirname, '..')

// Mirrors the default in playwright.config.ts.
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

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: process.env,
  })
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
  }
  return result.stdout
}

function repoRootFromCwd(): string {
  return git(['rev-parse', '--show-toplevel'], E2E_DOCS_ROOT).trim()
}

function collectChangedFiles(repoRoot: string, baseRef: string): string[] {
  const ranges: string[][] = [
    // Commits on this branch since diverging from the base
    ['diff', '--name-only', '--diff-filter=ACMR', `${baseRef}...HEAD`],
    // Unstaged working tree
    ['diff', '--name-only', '--diff-filter=ACMR'],
    // Staged working tree
    ['diff', '--name-only', '--diff-filter=ACMR', '--cached'],
  ]

  const files = new Set<string>()
  for (const args of ranges) {
    try {
      for (const file of parseChangedFilesList(git([...args], repoRoot))) {
        files.add(file)
      }
    } catch (error) {
      if (args.includes(`${baseRef}...HEAD`)) {
        throw error
      }
      // Working-tree diffs can be empty / fail in odd git states; ignore those.
    }
  }
  return [...files].sort()
}

async function resolveAllPagePaths(): Promise<string[]> {
  const repoRoot = repoRootFromCwd()
  const pages = await resolveAllDocsPages(repoRoot)
  console.error(`Resolved all ${pages.length} in-scope docs page(s) (guides + troubleshooting).`)
  return pages
}

async function resolvePagePaths(): Promise<string[] | null> {
  const existing = process.env.DOCS_E2E_PAGE_PATHS?.trim()
  if (existing) {
    return existing
      .split(/[\n,]/)
      .map((p) => p.trim())
      .filter(Boolean)
  }

  const baseRef = process.env.DOCS_E2E_BASE_REF?.trim() || 'origin/master'
  const repoRoot = repoRootFromCwd()
  const changedFiles = collectChangedFiles(repoRoot, baseRef)
  const result = await resolveDocsScope({ changedFiles, repoRoot })

  if (result.skip) {
    console.error(
      `No in-scope docs pages changed vs ${baseRef} (including working tree). Skipping Playwright.`
    )
    return null
  }

  console.error(`Resolved ${result.pages.length} docs page(s) from changes vs ${baseRef}:`)
  for (const page of result.pages) {
    console.error(`  ${page}`)
  }
  return result.pages
}

async function main() {
  const rawArgs = process.argv.slice(2)
  const runAll = rawArgs.includes('--all')
  const playwrightArgs = rawArgs.filter((arg) => arg !== '--all' && arg !== '--')

  const pages = runAll ? await resolveAllPagePaths() : await resolvePagePaths()
  if (pages === null) {
    process.exit(0)
  }

  // playwright.config.ts sets a global maxFailures: 3, which would otherwise
  // abort an exhaustive --all run after just 3 failing pages out of hundreds.
  // -x is Playwright's shorthand for --max-failures=1.
  const hasMaxFailuresArg = playwrightArgs.some(
    (arg) => arg === '-x' || arg.startsWith('--max-failures')
  )
  const finalPlaywrightArgs =
    runAll && !hasMaxFailuresArg ? [...playwrightArgs, '--max-failures=0'] : playwrightArgs

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim() || DEFAULT_BASE_URL
  if (!(await isBaseUrlReachable(baseUrl))) {
    console.error(`No docs server responding at ${baseUrl}.`)
    if (!process.env.PLAYWRIGHT_BASE_URL) {
      console.error('Start it with `pnpm dev:docs`, or point at a deployed site:')
      console.error('  PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs')
    } else {
      console.error('Check that the URL is correct and reachable.')
    }
    process.exit(1)
  }

  const env = {
    ...process.env,
    DOCS_E2E_PAGE_PATHS: pages.join(','),
  }

  const child = spawn('pnpm', ['exec', 'playwright', 'test', ...finalPlaywrightArgs], {
    cwd: E2E_DOCS_ROOT,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

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

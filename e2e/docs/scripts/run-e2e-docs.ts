#!/usr/bin/env node
/**
 * Default entry for `pnpm e2e:docs`.
 *
 * If DOCS_E2E_PAGE_PATHS is already set (CI, or an explicit local override),
 * runs Playwright with that list. Otherwise resolves pages from files changed
 * vs DOCS_E2E_BASE_REF (default origin/master), including the working tree.
 *
 * Extra CLI args are forwarded to Playwright (e.g. --ui, a spec file path).
 */
import { spawn, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseChangedFilesList, resolveDocsScope } from '../utils/resolve-docs-scope.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const E2E_DOCS_ROOT = join(__dirname, '..')

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
  const ranges = [
    // Commits on this branch since diverging from the base
    ['diff', '--name-only', '--diff-filter=ACMR', `${baseRef}...HEAD`],
    // Unstaged working tree
    ['diff', '--name-only', '--diff-filter=ACMR'],
    // Staged working tree
    ['diff', '--name-only', '--diff-filter=ACMR', '--cached'],
  ] as const

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
  const playwrightArgs = process.argv
    .slice(2)
    .filter((arg, index) => !(index === 0 && arg === '--'))
  const pages = await resolvePagePaths()
  if (pages === null) {
    process.exit(0)
  }

  const env = {
    ...process.env,
    DOCS_E2E_PAGE_PATHS: pages.join(','),
  }

  const child = spawn('pnpm', ['exec', 'playwright', 'test', ...playwrightArgs], {
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

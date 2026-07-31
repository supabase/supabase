#!/usr/bin/env node
/**
 * Resolve docs E2E page scope from changed files.
 *
 * Usage:
 *   git diff --name-only origin/master...HEAD | node --experimental-strip-types scripts/resolve-docs-scope.ts
 *   node --experimental-strip-types scripts/resolve-docs-scope.ts --files a.mdx,b.mdx
 *
 * Outputs (GitHub Actions friendly):
 *   skip=true|false
 *   paths=<comma-separated /docs/... paths>
 * Also prints each path on its own line to stderr for debugging.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseChangedFilesList, resolveDocsScope } from '../utils/resolve-docs-scope.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../../..')

function readChangedFilesFromArgv(argv: string[]): string[] | null {
  const filesIdx = argv.indexOf('--files')
  if (filesIdx !== -1 && argv[filesIdx + 1]) {
    return parseChangedFilesList(argv[filesIdx + 1])
  }
  return null
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function main() {
  const argv = process.argv.slice(2)
  let changedFiles = readChangedFilesFromArgv(argv)

  if (!changedFiles) {
    if (process.stdin.isTTY) {
      console.error('Pass changed files via stdin or --files path1,path2')
      process.exit(2)
    }
    changedFiles = parseChangedFilesList(await readStdin())
  }

  const result = await resolveDocsScope({
    changedFiles,
    repoRoot: REPO_ROOT,
  })

  // GitHub Actions step outputs
  const githubOutput = process.env.GITHUB_OUTPUT
  const skipLine = `skip=${result.skip}`
  const pathsLine = `paths=${result.pages.join(',')}`

  if (githubOutput) {
    // appendFile via sync to keep the CLI dependency-free
    const { appendFileSync } = await import('node:fs')
    appendFileSync(githubOutput, `${skipLine}\n${pathsLine}\n`)
  } else {
    console.log(skipLine)
    console.log(pathsLine)
  }

  if (result.pages.length > 0) {
    console.error(`Resolved ${result.pages.length} docs page(s):`)
    for (const page of result.pages) {
      console.error(`  ${page}`)
    }
  } else {
    console.error('No in-scope docs pages — skipping Playwright suite.')
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

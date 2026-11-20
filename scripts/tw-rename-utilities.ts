/**
 * Replace renamed Tailwind CSS v3 utilities with their v4 equivalents.
 * https://tailwindcss.com/docs/upgrade-guide#renamed-utilities
 *
 * Usage:
 *   npx tsx scripts/tw-rename-utilities.ts [--dry-run] [paths...]
 *   node --experimental-strip-types scripts/tw-rename-utilities.ts [--dry-run] [paths...]
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const EXTENSIONS = new Set([
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.html',
  '.css',
  '.scss',
  '.mdx',
  '.md',
  '.vue',
  '.svelte',
])
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build'])

// Word-boundary helpers:
//   _B — not preceded by [-a-zA-Z0-9_]  (prevents matching mid-class-name)
//   _E — not followed by  [-a-zA-Z0-9_(] (prevents shadow-md, blur(...), etc.)
const B = '(?<![a-zA-Z0-9_\\-])'
const E = '(?![a-zA-Z0-9_\\-(])'

// Ordering matters: -sm → -xs must run before bare → -sm to avoid double-replacement.
const RENAMES: [RegExp, string][] = [
  // -sm → -xs
  [new RegExp(`${B}shadow-sm${E}`, 'g'), 'shadow-xs'],
  [new RegExp(`${B}drop-shadow-sm${E}`, 'g'), 'drop-shadow-xs'],
  [new RegExp(`${B}blur-sm${E}`, 'g'), 'blur-xs'],
  [new RegExp(`${B}backdrop-blur-sm${E}`, 'g'), 'backdrop-blur-xs'],
  [new RegExp(`${B}rounded-sm${E}`, 'g'), 'rounded-xs'],
  // bare → -sm
  [new RegExp(`${B}shadow${E}`, 'g'), 'shadow-sm'],
  [new RegExp(`${B}drop-shadow${E}`, 'g'), 'drop-shadow-sm'],
  [new RegExp(`${B}blur${E}`, 'g'), 'blur-sm'],
  [new RegExp(`${B}backdrop-blur${E}`, 'g'), 'backdrop-blur-sm'],
  [new RegExp(`${B}rounded${E}`, 'g'), 'rounded-sm'],
  // simple renames
  [new RegExp(`${B}outline-none${E}`, 'g'), 'outline-hidden'],
  [new RegExp(`${B}ring${E}`, 'g'), 'ring-3'],
]

function processFile(filePath: string, dryRun: boolean): number {
  let text: string
  try {
    text = fs.readFileSync(filePath, 'utf8')
  } catch {
    return 0
  }

  let total = 0
  for (const [pattern, replacement] of RENAMES) {
    const next = text.replace(pattern, () => {
      total++
      return replacement
    })
    text = next
  }

  if (total === 0) return 0

  if (!dryRun) fs.writeFileSync(filePath, text, 'utf8')

  const label = dryRun ? '[dry-run] ' : ''
  const s = total === 1 ? '' : 's'
  console.log(`${label}${filePath}  (${total} replacement${s})`)
  return total
}

function* walkDir(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walkDir(full)
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      yield full
    }
  }
}

function collectFiles(roots: string[]): string[] {
  const files: string[] = []
  for (const root of roots) {
    const stat = fs.statSync(root, { throwIfNoEntry: false })
    if (!stat) {
      console.warn(`Warning: path not found: ${root}`)
      continue
    }
    if (stat.isFile()) {
      files.push(root)
    } else if (stat.isDirectory()) {
      files.push(...walkDir(root))
    }
  }
  return files
}

function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run') || args.includes('-n')
  const paths = args.filter((a) => !a.startsWith('-'))
  const roots = paths.length > 0 ? paths : ['.']

  const files = collectFiles(roots)
  let totalFiles = 0
  let totalReplacements = 0

  for (const file of files) {
    const n = processFile(file, dryRun)
    if (n > 0) {
      totalFiles++
      totalReplacements += n
    }
  }

  const label = dryRun ? '[dry-run] ' : ''
  console.log(`\n${label}Done — ${totalReplacements} replacement(s) across ${totalFiles} file(s).`)
}

main()

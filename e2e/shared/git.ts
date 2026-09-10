import { spawnSync } from 'node:child_process'

import { parseChangedFilesList } from './paths.ts'

export function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', env: process.env })
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
  }
  return result.stdout
}

export function repoRootFrom(cwd: string): string {
  return git(['rev-parse', '--show-toplevel'], cwd).trim()
}

export function collectChangedFiles(repoRoot: string, baseRef: string): string[] {
  const branchRange = `${baseRef}...HEAD`
  const ranges = [
    ['diff', '--name-only', '--diff-filter=ACMR', branchRange],
    ['diff', '--name-only', '--diff-filter=ACMR'],
    ['diff', '--name-only', '--diff-filter=ACMR', '--cached'],
  ]

  const files = new Set<string>()
  for (const args of ranges) {
    try {
      for (const file of parseChangedFilesList(git(args, repoRoot))) {
        files.add(file)
      }
    } catch (error) {
      if (args.includes(branchRange)) throw error
    }
  }

  return [...files].sort()
}

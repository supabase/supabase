import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runRatchet } from '../ratchet-eslint-rules'

const studioRoot = path.resolve(__dirname, '../..')
const repoRoot = path.resolve(studioRoot, '..', '..')
const scriptArgvPlaceholder = path.resolve(studioRoot, 'scripts', 'ratchet-eslint-rules.ts')

const tempDirs: string[] = []

afterEach(() => {
  vi.restoreAllMocks()
  while (tempDirs.length) {
    const dir = tempDirs.pop()
    if (dir) {
      rmSync(dir, { recursive: true, force: true })
    }
  }
})

describe('ratchet-eslint-rules integration', () => {
  it('captures per-file counts when initializing baselines', () => {
    const tmp = createTempDir()
    const metadataPath = path.join(tmp, 'baseline.json')

    const eslintResults = buildEslintResults([
      { filePath: repoPath('apps/studio/src/a.ts'), rules: { 'no-console': 1 } },
      { filePath: repoPath('apps/studio/src/b.ts'), rules: { 'no-console': 2 } },
    ])

    const result = invokeRatchet(
      ['--metadata', metadataPath, '--rule', 'no-console', '--init'],
      eslintResults
    )

    expect(result).toBe(0)

    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
    expect(metadata.rules['no-console']).toBe(3)
    expect(metadata.ruleFiles['no-console']).toEqual({
      [relativeToCwd('apps/studio/src/a.ts')]: 1,
      [relativeToCwd('apps/studio/src/b.ts')]: 2,
    })
  })

  it('reports offending files when regressions occur and metadata has per-file data', () => {
    const tmp = createTempDir()
    const metadataPath = path.join(tmp, 'baseline.json')

    writeFileSync(
      metadataPath,
      JSON.stringify(
        {
          rules: { 'no-console': 2 },
          ruleFiles: {
            'no-console': {
              [relativeToCwd('apps/studio/src/a.ts')]: 2,
            },
          },
        },
        null,
        2
      )
    )

    const eslintResults = buildEslintResults([
      { filePath: repoPath('apps/studio/src/a.ts'), rules: { 'no-console': 3 } },
      { filePath: repoPath('apps/studio/src/b.ts'), rules: { 'no-console': 1 } },
    ])

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = invokeRatchet(
      ['--metadata', metadataPath, '--rule', 'no-console'],
      eslintResults
    )

    expect(result).toBe(1)
    const combinedErrors = errorSpy.mock.calls.map((args) => args.join(' ')).join('\n')
    expect(combinedErrors).toContain(`${relativeToCwd('apps/studio/src/a.ts')} (+1)`)
    expect(combinedErrors).toContain(`${relativeToCwd('apps/studio/src/b.ts')} (+1)`)
  })

  it('falls back gracefully when baseline is missing per-file data', () => {
    const tmp = createTempDir()
    const metadataPath = path.join(tmp, 'baseline.json')

    writeFileSync(
      metadataPath,
      JSON.stringify(
        {
          rules: { 'no-console': 1 },
        },
        null,
        2
      )
    )

    const eslintResults = buildEslintResults([
      { filePath: repoPath('apps/studio/src/a.ts'), rules: { 'no-console': 2 } },
    ])

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = invokeRatchet(
      ['--metadata', metadataPath, '--rule', 'no-console'],
      eslintResults
    )

    expect(result).toBe(1)
    const combinedErrors = errorSpy.mock.calls.map((args) => args.join(' ')).join('\n')
    expect(combinedErrors).toContain('baseline missing file breakdown')
    expect(combinedErrors).toContain(`${relativeToCwd('apps/studio/src/a.ts')} (2 current)`)
  })
})

function buildEslintResults(
  files: Array<{ filePath: string; rules: Record<string, number> }>
): unknown[] {
  return files.map(({ filePath, rules }) => ({
    filePath,
    messages: Object.entries(rules).flatMap(([ruleId, count]) =>
      Array.from({ length: count }, () => ({ ruleId }))
    ),
  }))
}

function createTempDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ratchet-eslint'))
  tempDirs.push(dir)
  return dir
}

function repoPath(relPath: string): string {
  return path.join(repoRoot, relPath)
}

function invokeRatchet(args: string[], eslintResults: unknown[]): number {
  const argv = ['node', scriptArgvPlaceholder, ...args]
  return runRatchet(argv, () => ({
    results: eslintResults as any,
    stderr: '',
  }))
}

function relativeToCwd(relPath: string): string {
  return path.relative(process.cwd(), repoPath(relPath)).split(path.sep).join('/')
}

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { runAxeRatchet } from '../ratchet-axe-rules'

const studioRoot = path.resolve(__dirname, '../..')
const scriptArgvPlaceholder = path.resolve(studioRoot, 'scripts', 'ratchet-axe-rules.ts')

const SCANNED_RULES = ['color-contrast', 'region']

// Nothing enumerates the tracked rules, so the ratchet has to catch a rule with no
// baseline entry by treating the missing entry as zero allowed nodes.
const PREVIOUSLY_UNTRACKED_RULES = [
  'list',
  'listitem',
  'aria-allowed-attr',
  'button-name',
  'link-name',
  'aria-valid-attr-value',
  'aria-command-name',
]

const SCAN_THEME = 'light'

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

describe('ratchet-axe-rules integration', () => {
  it('captures per-route counts when initializing baselines', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    const scans = buildScans([
      { surface: '/project/default', rules: { 'color-contrast': 1 } },
      { surface: '/project/default/editor', rules: { 'color-contrast': 2 } },
    ])

    expect(invokeRatchet(['--metadata', metadataPath, '--init'], scans)).toBe(0)

    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
    expect(metadata.rules['color-contrast']).toBe(3)
    expect(metadata.ruleRoutes['color-contrast']).toEqual({
      '/project/default': 1,
      '/project/default/editor': 2,
    })
  })

  it('initializes baselines for every rule the scan reported', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    const scans = buildScans([
      {
        surface: '/project/default',
        rules: { 'color-contrast': 1, list: 2, 'button-name': 3 },
      },
    ])

    expect(invokeRatchet(['--metadata', metadataPath, '--init'], scans)).toBe(0)

    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
    expect(metadata.rules).toEqual({ 'color-contrast': 1, list: 2, 'button-name': 3 })
  })

  it('reports offending routes when regressions occur and metadata has per-route data', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, {
      rules: { 'color-contrast': 2 },
      ruleRoutes: { 'color-contrast': { '/project/default': 2 } },
    })

    const scans = buildScans([
      { surface: '/project/default', rules: { 'color-contrast': 3 } },
      { surface: '/project/default/editor', rules: { 'color-contrast': 1 } },
    ])

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(1)

    const errors = collectCalls(errorSpy)
    expect(errors).toContain('You added 2 new violations of color-contrast')
    expect(errors).toContain('/project/default (+1)')
    expect(errors).toContain('/project/default/editor (+1)')
  })

  it('falls back gracefully when baseline is missing per-route data', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, { rules: { 'color-contrast': 1 } })

    const scans = buildScans([{ surface: '/project/default', rules: { 'color-contrast': 2 } }])

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(1)

    const errors = collectCalls(errorSpy)
    expect(errors).toContain('baseline missing route breakdown')
    expect(errors).toContain('/project/default (2 current)')
  })

  it('fails on a rule the baseline has never seen and names it', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, {
      rules: { 'color-contrast': 4 },
      ruleRoutes: { 'color-contrast': { '/project/default': 4 } },
    })

    const scans = buildScans([
      { surface: '/project/default', rules: { 'color-contrast': 4, 'button-name': 2 } },
    ])

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(1)

    const errors = collectCalls(errorSpy)
    expect(errors).toContain('button-name has no entry')
    expect(errors).toContain('baseline=0 (unbaselined), current=2')
    expect(errors).toContain('/project/default (2 current)')
    expect(errors).not.toContain('color-contrast')
  })

  it.each(PREVIOUSLY_UNTRACKED_RULES)('fails on an unbaselined %s violation', (rule) => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, { rules: { 'color-contrast': 0 } })

    const scans = buildScans([{ surface: '/project/default', rules: { [rule]: 1 } }])

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(1)
    expect(collectCalls(errorSpy)).toContain(`${rule} has no entry`)
  })

  it('marks unbaselined rules in the step summary table', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')
    const summaryPath = path.join(createTempDir(), 'summary.md')
    writeFileSync(summaryPath, '')

    writeBaseline(metadataPath, { rules: { 'color-contrast': 1 } })

    const scans = buildScans([
      { surface: '/project/default', rules: { 'color-contrast': 1, listitem: 3 } },
    ])

    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('GITHUB_STEP_SUMMARY', summaryPath)
    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(1)
    vi.unstubAllEnvs()

    const summary = readFileSync(summaryPath, 'utf8')
    expect(summary).toContain('| `listitem` (unbaselined) | **0** | **3** | +3 |')
    expect(summary).toContain('| `color-contrast` | **1** | **1** | +0 |')
  })

  it('ignores the removed rule-list flags instead of narrowing the comparison', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, { rules: { 'color-contrast': 1 } })

    const scans = buildScans([
      { surface: '/project/default', rules: { 'color-contrast': 1, 'link-name': 1 } },
    ])

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(
      invokeRatchet(['--metadata', metadataPath, '--rules-file', 'scripts/rules.json'], scans)
    ).toBe(1)
    expect(collectCalls(warnSpy)).toContain('Unknown argument: --rules-file')
  })

  it('treats a missing baseline file as an error rather than a pass', () => {
    const metadataPath = path.join(createTempDir(), 'absent.json')

    const scans = buildScans([{ surface: '/project/default', rules: { 'color-contrast': 1 } }])

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(2)
    expect(collectCalls(errorSpy)).toContain('Run with --init')
  })

  it('treats a flag missing its value as a usage error', () => {
    const scans = buildScans([{ surface: '/project/default', rules: {} }])

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(invokeRatchet(['--metadata'], scans)).toBe(2)
    expect(collectCalls(errorSpy)).toContain('--metadata needs a path')
  })

  it('warns but passes when a baselined rule reports nothing and was never scanned', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, { rules: { 'color-contrast': 0, 'heading-order': 4 } })

    const scans = buildScans([
      { surface: '/project/default', rules: {}, scannedRules: ['color-contrast'] },
    ])

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(0)
    expect(collectCalls(warnSpy)).toContain(
      'Baselined rules no scan unit reported running: heading-order'
    )
  })

  it('refuses to decrease a baseline for a rule the scan never ran', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, { rules: { 'color-contrast': 0, 'heading-order': 4 } })

    const scans = buildScans([
      { surface: '/project/default', rules: {}, scannedRules: ['color-contrast'] },
    ])

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(invokeRatchet(['--metadata', metadataPath, '--decrease-baselines'], scans)).toBe(2)
    expect(collectCalls(errorSpy)).toContain('heading-order')

    expect(JSON.parse(readFileSync(metadataPath, 'utf8')).rules['heading-order']).toBe(4)
  })

  it('errors when a scan unit failed to load', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, { rules: { 'color-contrast': 5 } })

    const scans = [
      {
        surface: '/project/default/sql',
        loaded: false,
        elementCount: 0,
        scannedRules: SCANNED_RULES,
        violations: [],
      },
    ]

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(2)
    expect(collectCalls(errorSpy)).toContain('/project/default/sql')
  })

  it('passes on an improvement without tightening the baseline', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, {
      rules: { 'color-contrast': 5 },
      ruleRoutes: { 'color-contrast': { '/project/default': 5 } },
    })

    const scans = buildScans([{ surface: '/project/default', rules: { 'color-contrast': 2 } }])

    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(0)

    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
    expect(metadata.rules['color-contrast']).toBe(5)
    expect(metadata.ruleRoutes['color-contrast']).toEqual({ '/project/default': 5 })
  })

  it('tightens the baseline only under --decrease-baselines', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, {
      rules: { 'color-contrast': 5 },
      ruleRoutes: { 'color-contrast': { '/project/default': 5 } },
    })

    const scans = buildScans([{ surface: '/project/default', rules: { 'color-contrast': 2 } }])

    expect(invokeRatchet(['--metadata', metadataPath, '--decrease-baselines'], scans)).toBe(0)

    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
    expect(metadata.rules['color-contrast']).toBe(2)
    expect(metadata.ruleRoutes['color-contrast']).toEqual({ '/project/default': 2 })
  })

  it('records the scanned theme in the baseline', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    const scans = buildScans([{ surface: '/project/default', rules: { 'color-contrast': 1 } }])

    expect(invokeRatchet(['--metadata', metadataPath, '--init'], scans)).toBe(0)

    expect(JSON.parse(readFileSync(metadataPath, 'utf8')).theme).toBe(SCAN_THEME)
  })

  it('errors when the scan theme differs from the baseline theme', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, { theme: 'light', rules: { 'color-contrast': 0 } })

    const scans = buildScans([{ surface: '/project/default', rules: {}, theme: 'dark' }])

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(2)
    expect(collectCalls(errorSpy)).toContain('captured in "light"')
  })

  it('errors when scan units rendered in more than one theme', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')

    writeBaseline(metadataPath, { theme: 'light', rules: { 'color-contrast': 0 } })

    const scans = buildScans([
      { surface: '/project/default', rules: {}, theme: 'light' },
      { surface: '/project/default/sql', rules: {}, theme: 'dark' },
    ])

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(2)
    expect(collectCalls(errorSpy)).toContain('more than one theme')
  })

  it('renders an improvement delta with a single minus sign', () => {
    const metadataPath = path.join(createTempDir(), 'baseline.json')
    const summaryPath = path.join(createTempDir(), 'summary.md')
    writeFileSync(summaryPath, '')

    writeBaseline(metadataPath, { rules: { 'color-contrast': 30 } })

    const scans = buildScans([{ surface: '/project/default', rules: { 'color-contrast': 4 } }])

    vi.stubEnv('GITHUB_STEP_SUMMARY', summaryPath)
    expect(invokeRatchet(['--metadata', metadataPath], scans)).toBe(0)
    vi.unstubAllEnvs()

    const summary = readFileSync(summaryPath, 'utf8')
    expect(summary).toContain('| -26 |')
    expect(summary).not.toContain('--26')
  })
})

function buildScans(
  units: Array<{
    surface: string
    rules: Record<string, number>
    scannedRules?: string[]
    theme?: string
  }>
) {
  return units.map(({ surface, rules, scannedRules, theme }) => ({
    surface,
    loaded: true,
    elementCount: 500,
    scannedRules: scannedRules ?? SCANNED_RULES,
    theme: theme ?? SCAN_THEME,
    violations: Object.entries(rules).map(([id, count]) => ({
      id,
      nodes: Array.from({ length: count }, () => ({ target: [id] })),
    })),
  }))
}

function writeBaseline(metadataPath: string, baseline: unknown): void {
  writeFileSync(metadataPath, JSON.stringify(baseline, null, 2))
}

function collectCalls(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.map((args: unknown[]) => args.join(' ')).join('\n')
}

function createTempDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ratchet-axe'))
  tempDirs.push(dir)
  return dir
}

function invokeRatchet(args: string[], scans: unknown[]): number {
  const argv = ['node', scriptArgvPlaceholder, ...args]
  return runAxeRatchet(argv, () => ({ results: scans as any, stderr: '' }))
}

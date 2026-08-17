/* eslint-disable turbo/no-undeclared-env-vars */
/**
 * Ratchet axe-core violations against a committed baseline.
 *
 * Reads the JSON the Playwright a11y scan writes to `e2e/studio/axe-results`,
 * one file per scan unit, and compares per-rule node counts against a baseline.
 *
 * Examples:
 *   # Capture baselines from a scan
 *   tsx scripts/ratchet-axe-rules.ts --init
 *
 *   # Compare current counts vs baselines
 *   tsx scripts/ratchet-axe-rules.ts
 *
 *   # Lower baselines when improvements occur
 *   tsx scripts/ratchet-axe-rules.ts --decrease-baselines
 *
 * Flags:
 *   --metadata <path>     Path to baseline file (default .github/axe-rule-baselines.json)
 *   --results <path>      Directory of scan result JSON (default ../../e2e/studio/axe-results)
 *   --init                Write current counts into metadata and exit 0
 *   --decrease-baselines  When improvements occur, lower stored baselines to match the new counts.
 *
 * Exit codes:
 *   0 stable or improved, 1 regression, 2 usage error or unusable scan data.
 *
 * Notes:
 * - Counts violating nodes, not violating rules, so a rule firing on ten
 *   elements counts ten.
 * - The baseline is the only rule list. Every rule the scan reports is compared,
 *   and a rule with no baseline entry is allowed zero nodes, so a violation type
 *   nobody has seen before fails instead of passing silently. That is what holds
 *   the rules a hand-maintained allowlist left out — `list`, `listitem`,
 *   `aria-allowed-attr`, `button-name`, `link-name`, `aria-valid-attr-value`,
 *   `aria-command-name` — at zero, with no entry to add and none to maintain.
 * - `button-name` is tracked here even though jsx-a11y runs over the same code:
 *   jsx-a11y's rule is `control-has-associated-label`, a static check on JSX,
 *   while `button-name` inspects the accessible name computed at render time.
 * - Improvements do not tighten the baseline unless --decrease-baselines is
 *   passed, so a PR that fixes violations cannot break a concurrent PR.
 * - A baselined rule that drops to zero while no scan unit reports having run it
 *   warns while comparing and fails under --decrease-baselines, where that
 *   phantom zero would be written back as the new baseline.
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// Mirrors MIN_MEANINGFUL_ELEMENTS in e2e/shared/a11y.ts. A scan unit below this
// rendered an empty state or never mounted, so its zero counts prove nothing.
const MIN_MEANINGFUL_ELEMENTS = 20

const MAX_ROUTES = 5

interface Args {
  metadata: string
  results: string
  init: boolean
  decreaseBaselines: boolean
}

class UsageError extends Error {}

interface ScanViolation {
  id?: string
  nodes?: unknown[]
}

interface ScanArtifact {
  surface?: string
  url?: string
  loaded?: boolean
  elementCount?: number
  scannedRules?: string[]
  theme?: string
  violations?: ScanViolation[]
}

interface ScanExecutionResult {
  results: ScanArtifact[]
  stderr: string
}

interface BaselineData {
  theme?: string
  rules: Record<string, number>
  ruleRoutes?: Record<string, Record<string, number>>
}

interface RuleSnapshot {
  total: number
  routes: Record<string, number>
}

function readFlagValue(argv: string[], index: number, flag: string): string {
  const value = (argv[index] ?? '').trim()
  if (!value || value.startsWith('--')) {
    throw new UsageError(
      `${flag} needs a path, for example ${flag} .github/axe-rule-baselines.json`
    )
  }
  return value
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    metadata: '.github/axe-rule-baselines.json',
    results: path.join('..', '..', 'e2e', 'studio', 'axe-results'),
    init: false,
    decreaseBaselines: false,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--init') {
      args.init = true
    } else if (a === '--decrease-baselines') {
      args.decreaseBaselines = true
    } else if (a === '--metadata') {
      args.metadata = readFlagValue(argv, ++i, '--metadata')
    } else if (a === '--results') {
      args.results = readFlagValue(argv, ++i, '--results')
    } else {
      console.warn(`Unknown argument: ${a}`)
    }
  }

  return args
}

function readScanResults(resultsPath: string): ScanExecutionResult {
  if (!existsSync(resultsPath)) {
    console.error(
      `No scan results at ${resultsPath}. Run the a11y Playwright specs first ` +
        '(`pnpm -C e2e/studio exec playwright test --grep @a11y`).'
    )
    process.exit(2)
  }

  const files = readdirSync(resultsPath).filter((file) => file.endsWith('.json'))
  if (!files.length) {
    console.error(`No scan result JSON files in ${resultsPath}.`)
    process.exit(2)
  }

  const results: ScanArtifact[] = []
  const problems: string[] = []

  for (const file of files) {
    const full = path.join(resultsPath, file)
    try {
      results.push(JSON.parse(readFileSync(full, 'utf8')) as ScanArtifact)
    } catch (e) {
      problems.push(`Could not parse ${full}: ${e}`)
    }
  }

  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(2)
  }

  return { results, stderr: '' }
}

// The baseline decides what is allowed, so an unrecognized rule has to reach the
// comparison to fail.
function collectRuleSnapshots(results: ScanArtifact[]): Record<string, RuleSnapshot> {
  const snapshots: Record<string, RuleSnapshot> = {}

  for (const artifact of results) {
    const surface = artifact?.surface
    if (!surface || !Array.isArray(artifact.violations)) continue

    for (const violation of artifact.violations) {
      const id = violation?.id ?? ''
      if (!id) continue

      const count = Array.isArray(violation.nodes) ? violation.nodes.length : 1
      const snapshot = snapshots[id] ?? { total: 0, routes: {} }
      snapshot.total += count
      snapshot.routes[surface] = (snapshot.routes[surface] ?? 0) + count
      snapshots[id] = snapshot
    }
  }

  return snapshots
}

// A scan unit that never loaded, or that rendered an empty state, reports zero
// violations for reasons that have nothing to do with accessibility.
function findUnusableScans(results: ScanArtifact[]): { unloaded: string[]; empty: string[] } {
  const unloaded: string[] = []
  const empty: string[] = []

  for (const artifact of results) {
    const surface = artifact?.surface ?? '(unnamed)'
    if (artifact?.loaded === false) {
      unloaded.push(surface)
    } else if ((artifact?.elementCount ?? 0) < MIN_MEANINGFUL_ELEMENTS) {
      empty.push(surface)
    }
  }

  return { unloaded, empty }
}

// `color-contrast` counts are theme-specific, so a baseline is only meaningful
// alongside the theme it was captured in.
function collectThemes(results: ScanArtifact[]): string[] {
  const themes = new Set<string>()
  for (const artifact of results) {
    if (artifact?.theme) themes.add(artifact.theme)
  }
  return [...themes]
}

// A baselined rule that reports nothing while no scan unit claims to have run it
// looks like an improvement it never earned.
function findPhantomImprovements(
  results: ScanArtifact[],
  baselineRules: Record<string, number>,
  currentCounts: Record<string, number>
): string[] {
  const scanned = new Set<string>()
  for (const artifact of results) {
    for (const rule of artifact?.scannedRules ?? []) scanned.add(rule)
  }

  if (!scanned.size) return []

  return Object.entries(baselineRules)
    .filter(([rule, baseline]) => baseline > 0 && !(currentCounts[rule] ?? 0) && !scanned.has(rule))
    .map(([rule]) => rule)
    .sort()
}

function readBaselines(fp: string): BaselineData | null {
  if (!existsSync(fp)) return null
  try {
    const data = JSON.parse(readFileSync(fp, 'utf8')) as Partial<BaselineData>
    if (data && typeof data === 'object' && data.rules && typeof data.rules === 'object') {
      return { theme: data.theme, rules: data.rules, ruleRoutes: data.ruleRoutes ?? {} }
    }
  } catch {
    // An unreadable metadata file is reported as a missing baseline.
  }
  return null
}

function writeBaselines(
  fp: string,
  updates: Record<string, RuleSnapshot>,
  theme: string | undefined,
  merge = true
): void {
  mkdirSync(path.dirname(fp), { recursive: true })

  const current = (merge && readBaselines(fp)) || { rules: {}, ruleRoutes: {} }

  const nextRules = merge ? { ...current.rules } : {}
  const nextRuleRoutes = merge ? { ...(current.ruleRoutes ?? {}) } : {}

  for (const [rule, snapshot] of Object.entries(updates)) {
    nextRules[rule] = snapshot.total
    nextRuleRoutes[rule] = snapshot.routes
  }

  const next: BaselineData = {
    theme: theme ?? current.theme,
    rules: nextRules,
    ruleRoutes: nextRuleRoutes,
  }
  writeFileSync(fp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
}

function writeSummary(markdown: string): void {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY
  if (summaryFile) {
    try {
      appendFileSync(summaryFile, `${markdown}\n`, 'utf8')
    } catch {
      // A failed summary write must not block the script.
    }
  }
}

export function runAxeRatchet(argv: string[], readViolations = readScanResults): number {
  let args: Args
  try {
    args = parseArgs(argv)
  } catch (e) {
    if (!(e instanceof UsageError)) throw e
    console.error(`Error: ${e.message}`)
    return 2
  }

  const { results, stderr } = readViolations(args.results)

  const { unloaded, empty } = findUnusableScans(results)
  if (unloaded.length) {
    const msg =
      `Scan units failed to load: ${unloaded.join(', ')}. Their zero counts are not ` +
      'comparable, so the ratchet cannot run. Fix the scan before comparing baselines.'
    console.error(msg)
    writeSummary(`### Axe rule ratchet\n${msg}`)
    console.log(`::error title=Unusable scan::${msg}`)
    return 2
  }

  const themes = collectThemes(results)
  if (themes.length > 1) {
    const msg =
      `Scan units rendered in more than one theme: ${themes.join(', ')}. Contrast counts are ` +
      'theme-specific, so a mixed run cannot be compared against one baseline.'
    console.error(msg)
    writeSummary(`### Axe rule ratchet\n${msg}`)
    console.log(`::error title=Mixed themes::${msg}`)
    return 2
  }
  const scanTheme = themes[0]

  if (empty.length) {
    const msg =
      `Scan units rendered fewer than ${MIN_MEANINGFUL_ELEMENTS} elements: ${empty.join(', ')}. ` +
      'A clean result there proves nothing.'
    console.warn(msg)
    console.log(`::warning title=Empty scan::${msg}`)
  }

  const currentSnapshots = collectRuleSnapshots(results)
  const currentCounts: Record<string, number> = {}
  for (const [rule, snapshot] of Object.entries(currentSnapshots)) {
    currentCounts[rule] = snapshot.total
  }

  if (args.init) {
    writeBaselines(args.metadata, currentSnapshots, scanTheme, true)

    const reportedRules = Object.keys(currentCounts).sort()
    const rows = reportedRules
      .map((rule) => `| \`${rule}\` | **${currentCounts[rule]}** |`)
      .join('\n')

    writeSummary(
      [
        `### Axe rule baselines initialized`,
        `Metadata: \`${args.metadata}\``,
        `Theme: \`${scanTheme ?? 'unrecorded'}\``,
        ``,
        `| Rule | Baseline |`,
        `| --- | ---: |`,
        rows,
        ``,
      ].join('\n')
    )

    console.log(
      `Initialized/updated baselines for: ${reportedRules.join(', ') || '(no rules reported)'} ` +
        `(saved to ${args.metadata}).`
    )
    return 0
  }

  const baselineData = readBaselines(args.metadata)
  if (!baselineData) {
    const msg = `No usable baselines in ${args.metadata}. Run with --init to capture them.`
    console.error(msg)
    writeSummary(`### Axe rule ratchet\n${msg}`)
    console.log(`::error title=Missing baselines::${msg}`)
    return 2
  }

  if (baselineData.theme && scanTheme && baselineData.theme !== scanTheme) {
    const msg =
      `The scan rendered in the "${scanTheme}" theme but ${args.metadata} was captured in ` +
      `"${baselineData.theme}". Contrast counts are theme-specific, so these are not comparable.`
    console.error(msg)
    writeSummary(`### Axe rule ratchet\n${msg}`)
    console.log(`::error title=Theme mismatch::${msg}`)
    return 2
  }

  const baselineRules = baselineData.rules
  const baselineRuleRoutes = baselineData.ruleRoutes ?? {}

  const phantom = findPhantomImprovements(results, baselineRules, currentCounts)
  if (phantom.length) {
    const msg =
      `Baselined rules no scan unit reported running: ${phantom.join(', ')}. Their zero counts ` +
      'read as improvements the code may not have earned. Add them to the scan rule set or drop ' +
      'them from the baseline.'
    if (args.decreaseBaselines) {
      console.error(msg)
      writeSummary(`### Axe rule ratchet\n${msg}`)
      console.log(`::error title=Unscanned rules::${msg}`)
      return 2
    }
    console.warn(msg)
    console.log(`::warning title=Unscanned rules::${msg}`)
  }

  // The baseline defines what is tracked, so a rule it never heard of is allowed
  // zero nodes.
  const trackedRules = Array.from(
    new Set([...Object.keys(baselineRules), ...Object.keys(currentSnapshots)])
  ).sort()

  let failed = false
  const tableRows: string[] = []
  const improvedRules: string[] = []
  const decreasedBaselines: Record<string, { from: number; to: number; snapshot: RuleSnapshot }> =
    {}

  for (const rule of trackedRules) {
    const isBaselined = typeof baselineRules[rule] === 'number'
    const baseline = baselineRules[rule] ?? 0
    const current = currentCounts[rule] ?? 0
    const delta = current - baseline
    const currentSnapshot = currentSnapshots[rule] ?? { total: 0, routes: {} }
    const baselineRoutes = baselineRuleRoutes[rule] ?? {}

    tableRows.push(
      `| \`${rule}\`${isBaselined ? '' : ' (unbaselined)'} | **${baseline}** | **${current}** | ` +
        `${delta >= 0 ? '+' : ''}${delta} |`
    )

    if (current > baseline) {
      failed = true
      const baselineHasRoutes = Object.hasOwn(baselineRuleRoutes, rule)
      const routeSummary = describeRouteRegression(
        baselineRoutes,
        currentSnapshot.routes,
        baselineHasRoutes
      )
      const msgParts = [
        isBaselined
          ? `You added ${delta === 1 ? 'a new violation' : `${delta} new violations`} of ${rule}. Please fix it: baseline=${baseline}, current=${current}`
          : `${rule} has no entry in ${args.metadata}, so every violation of it is new. Please fix it: baseline=0 (unbaselined), current=${current}`,
      ]
      if (routeSummary) {
        msgParts.push(
          `Affected routes: ${routeSummary}${isBaselined && !baselineHasRoutes ? ' (baseline missing route breakdown; rerun with --init to capture it)' : ''}`
        )
      }
      const msg = msgParts.join(' ')
      console.error(msg)
      // The annotation level is a warning while the exit code below is still 1, so
      // a regression shows on the PR without turning the run red.
      console.log(`::warning title=New violations::${msg}`)
    } else if (current < baseline) {
      improvedRules.push(rule)
      if (args.decreaseBaselines) {
        decreasedBaselines[rule] = { from: baseline, to: current, snapshot: currentSnapshot }
      }
    }
  }

  const summaryLines = [
    `### Axe rule ratchet`,
    `Metadata: \`${args.metadata}\``,
    `Theme: \`${scanTheme ?? 'unrecorded'}\``,
    ``,
    `| Rule | Baseline | Current | Δ |`,
    `| --- | ---: | ---: | ---: |`,
    ...tableRows,
    ``,
  ]

  if (args.decreaseBaselines && Object.keys(decreasedBaselines).length > 0) {
    if (empty.length) {
      const msg =
        'Refusing to decrease baselines: ' +
        `${empty.join(', ')} scanned as empty, so the improvement may be an unrendered route.`
      console.error(msg)
      summaryLines.push('', msg, '')
    } else {
      const updates: Record<string, RuleSnapshot> = {}
      const details: string[] = []
      const logParts: string[] = []
      for (const [rule, { from, to, snapshot }] of Object.entries(decreasedBaselines)) {
        updates[rule] = snapshot
        details.push(`- \`${rule}\`: ${from} -> ${to}`)
        logParts.push(`${rule}: ${from} -> ${to}`)
      }
      writeBaselines(args.metadata, updates, scanTheme, true)
      summaryLines.push('', 'Baselines decreased for improved rules:', ...details, '')
      console.log(`Baselines decreased for improved rules: ${logParts.join(', ')}`)
    }
  }

  writeSummary(summaryLines.join('\n'))

  if (failed) {
    if (stderr && stderr.trim()) console.error('\nScan stderr:\n', stderr)
    return 1
  }

  console.log(
    improvedRules.length > 0
      ? 'Nice! Some rules improved.'
      : `Stable: No regressions across ${trackedRules.length} rules.`
  )
  return 0
}

function describeRouteRegression(
  baselineRoutes: Record<string, number>,
  currentRoutes: Record<string, number>,
  baselineHasRoutes: boolean
): string {
  if (baselineHasRoutes) {
    const entries = Object.entries(currentRoutes)
      .map(([route, count]) => ({ route, delta: count - (baselineRoutes[route] ?? 0) }))
      .filter(({ delta }) => delta > 0)
      .sort((a, b) => b.delta - a.delta || a.route.localeCompare(b.route))

    if (!entries.length) return ''

    return formatRouteList(
      entries.map(({ route, delta }) => `${route} (+${delta})`),
      MAX_ROUTES
    )
  }

  const currentEntries = Object.entries(currentRoutes)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([route, count]) => `${route} (${count} current)`)

  if (!currentEntries.length) return ''

  return formatRouteList(currentEntries, MAX_ROUTES)
}

function formatRouteList(entries: string[], maxRoutes: number): string {
  if (entries.length <= maxRoutes) {
    return entries.join(', ')
  }
  const remainder = entries.length - maxRoutes
  const plural = remainder === 1 ? 'route' : 'routes'
  return `${entries.slice(0, maxRoutes).join(', ')}, +${remainder} more ${plural}`
}

function main(): void {
  process.exit(runAxeRatchet(process.argv, readScanResults))
}

if (process.argv[1]) {
  const invokedPath = pathToFileURL(path.resolve(process.argv[1])).href
  if (import.meta.url === invokedPath) {
    main()
  }
}

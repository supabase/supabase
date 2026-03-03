/* eslint-disable turbo/no-undeclared-env-vars */
/**
 * Ratchet ESLint violations for selected rules.
 *
 * Examples:
 *   # Initialize baselines for two rules
 *   tsx scripts/ratchet-eslint-rules.ts --init \
 *     --rule react-hooks/exhaustive-deps --rule no-console
 *
 *   # Compare current counts vs baselines
 *   tsx scripts/ratchet-eslint-rules.ts \
 *     --rule react-hooks/exhaustive-deps --rule no-console
 *
	 # Decrease baselines when improvements occur
 *   tsx scripts/ratchet-eslint-rules.ts \
	 *   --rule react-hooks/exhaustive-deps --rule no-console \
	 *   --decrease-baselines
 *
 * Flags:
 *   --metadata <path>     Path to baseline file (default .github/eslint-rule-baselines.json)
 *   --init                Write current counts for the provided --rule(s) into metadata and exit 0
 *   --eslint "<cmd>"      ESLint command to run (default "npx eslint"). Do not pass untrusted input.
 *   --eslint-args "<...>" Extra args/paths for ESLint (e.g., "."). Do not pass untrusted input.
 *   --rule <id>[,<id>...] Rule id(s). Repeat flag or comma-separate. REQUIRED.
 *   --decrease-baselines  When improvements occur, lower stored baselines to match the new counts.
 *
 * Notes:
 * - Counts occurrences regardless of severity (warn/error).
 * - Fails if any selected rule has currentCount > baselineCount.
 */

import { spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

interface Args {
  metadata: string
  init: boolean
  eslint: string
  eslintArgs: string
  decreaseBaselines: boolean
  rules: string[]
}

interface ESLintMessage {
  ruleId?: string | null
}

interface ESLintResult {
  filePath?: string
  messages?: ESLintMessage[]
}

interface ESLintExecutionResult {
  results: ESLintResult[]
  stderr: string
}

interface BaselineData {
  rules: Record<string, number>
  ruleFiles?: Record<string, Record<string, number>>
}

interface RuleSnapshot {
  total: number
  files: Record<string, number>
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    metadata: '.github/eslint-rule-baselines.json',
    init: false,
    eslint: 'npx eslint',
    eslintArgs: '',
    decreaseBaselines: false,
    rules: [],
  }

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--init') {
      args.init = true
    } else if (a === '--metadata') {
      args.metadata = argv[++i]
    } else if (a === '--eslint') {
      args.eslint = argv[++i]
    } else if (a === '--eslint-args') {
      args.eslintArgs = argv[++i]
    } else if (a === '--rule') {
      const val = (argv[++i] ?? '').trim()
      if (val) {
        args.rules.push(
          ...val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      }
    } else if (a === '--decrease-baselines') {
      args.decreaseBaselines = true
    } else {
      console.warn(`Unknown argument: ${a}`)
    }
  }

  if (args.rules.length === 0) {
    console.error('Error: You must provide at least one --rule <rule-id>.')
    console.error('Example: --rule exhaustive-deps --rule no-console')
    process.exit(2)
  }

  const dedupedRules = new Set(args.rules)
  args.rules = Array.from(dedupedRules)

  return args
}

/**
 * SECURITY:
 * Directly spawns a command from its arguments. Should not be called with
 * untrusted input.
 */
function dangerouslyRunEsLint(eslintCmd: string, eslintArgs: string): ESLintExecutionResult {
  const fullCmd = `${eslintCmd} ${eslintArgs || ''} --format json`.trim()
  const proc = spawnSync(fullCmd, {
    shell: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    maxBuffer: 32 * 1024 * 1024, // allow large ESLint JSON payloads
  })

  const stdout = typeof proc.stdout === 'string' ? proc.stdout : ''
  const stderr = typeof proc.stderr === 'string' ? proc.stderr : ''

  if (!stdout.trim()) {
    console.error('ESLint did not produce JSON output. stderr:\n', stderr)
    process.exit(2)
  }

  let results: ESLintResult[]
  try {
    results = JSON.parse(stdout) as ESLintResult[]
  } catch (e) {
    console.error('Failed to parse ESLint JSON output:', e)
    console.error('Raw output (truncated to 4k):\n', stdout.slice(0, 4096))
    process.exit(2)
  }

  return { results, stderr }
}

function normalizeFilePath(filePath?: string | null): string | null {
  if (!filePath) return null
  const rel = path.relative(process.cwd(), filePath)
  const normalized = rel || path.basename(filePath)
  return normalized.split(path.sep).join('/')
}

function collectRuleSnapshots(
  results: ESLintResult[],
  ruleIds: string[]
): Record<string, RuleSnapshot> {
  const checkedIds = new Set(ruleIds)
  const snapshots: Record<string, RuleSnapshot> = {}

  for (const id of ruleIds) {
    snapshots[id] = { total: 0, files: {} }
  }

  for (const file of results) {
    if (!file || !Array.isArray(file.messages)) continue
    const normalizedPath = normalizeFilePath(file.filePath)
    for (const msg of file.messages) {
      const id = msg?.ruleId ?? ''
      if (id && checkedIds.has(id)) {
        const snapshot = snapshots[id] ?? { total: 0, files: {} }
        snapshot.total += 1
        if (normalizedPath) {
          snapshot.files[normalizedPath] = (snapshot.files[normalizedPath] ?? 0) + 1
        }
        snapshots[id] = snapshot
      }
    }
  }

  return snapshots
}

function readBaselines(fp: string): BaselineData {
  if (!existsSync(fp)) return { rules: {}, ruleFiles: {} }
  try {
    const data = JSON.parse(readFileSync(fp, 'utf8')) as Partial<BaselineData>
    if (data && typeof data === 'object' && data.rules && typeof data.rules === 'object') {
      return { rules: data.rules, ruleFiles: data.ruleFiles ?? {} }
    }
  } catch {
    // ignore invalid metadata files and fall back to blank baselines
  }
  return { rules: {}, ruleFiles: {} }
}

function writeBaselines(fp: string, updates: Record<string, RuleSnapshot>, merge = true): void {
  const dir = path.dirname(fp)
  mkdirSync(dir, { recursive: true })

  let current: BaselineData = { rules: {}, ruleFiles: {} }
  if (merge && existsSync(fp)) {
    current = readBaselines(fp)
  }

  const nextRules = merge ? { ...current.rules } : {}
  const nextRuleFiles = merge ? { ...(current.ruleFiles ?? {}) } : {}

  for (const [rule, snapshot] of Object.entries(updates)) {
    nextRules[rule] = snapshot.total
    nextRuleFiles[rule] = snapshot.files
  }

  const next: BaselineData = { rules: nextRules, ruleFiles: nextRuleFiles }
  writeFileSync(fp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
}

function writeSummary(markdown: string): void {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY
  if (summaryFile) {
    try {
      appendFileSync(summaryFile, `${markdown}\n`, 'utf8')
    } catch {
      // ignore summary write errors because they shouldn't block the script
    }
  }
}

export function runRatchet(argv: string[], runEslint = dangerouslyRunEsLint): number {
  const args = parseArgs(argv)

  // SECURITY:
  // Offloaded to user. Must document that they should not pass untrusted input
  // via --eslint or --eslint-args.
  const { results, stderr } = runEslint(args.eslint, args.eslintArgs)

  // Filter out test files.
  const filteredResults = results.filter((result) => !result.filePath?.includes('.test.'))

  const currentSnapshots = collectRuleSnapshots(filteredResults, args.rules)
  const currentCounts: Record<string, number> = {}
  for (const rule of args.rules) {
    currentCounts[rule] = currentSnapshots[rule]?.total ?? 0
  }

  if (args.init) {
    writeBaselines(args.metadata, currentSnapshots, true)

    const rows = Object.entries(currentCounts)
      .map(([rule, count]) => `| \`${rule}\` | **${count}** |`)
      .join('\n')

    writeSummary(
      [
        `### ESLint rule baselines initialized`,
        `Metadata: \`${args.metadata}\``,
        ``,
        `| Rule | Baseline |`,
        `| --- | ---: |`,
        rows,
        ``,
      ].join('\n')
    )

    console.log(
      `Initialized/updated baselines for: ${args.rules.join(', ')} (saved to ${args.metadata}).`
    )
    return 0
  }

  const baselineData = readBaselines(args.metadata)
  const baselineRules = baselineData.rules || {}
  const baselineRuleFiles = baselineData.ruleFiles || {}

  const missing = args.rules.filter((r) => typeof baselineRules[r] !== 'number')
  if (missing.length) {
    const msg = `Missing baselines for: ${missing.join(', ')} in ${args.metadata}. Run with --init to set them.`
    console.error(msg)
    writeSummary(`### ESLint rule ratchet\n${msg}`)
    console.log(`::error title=Missing baselines::${msg}`)
    return 2
  }

  let failed = false
  const tableRows: string[] = []
  const improvedRules: string[] = []
  const decreasedBaselines: Record<string, { from: number; to: number; snapshot: RuleSnapshot }> =
    {}
  for (const rule of args.rules) {
    const baseline = baselineRules[rule] ?? 0
    const current = currentCounts[rule] ?? 0
    const delta = current - baseline
    const currentSnapshot = currentSnapshots[rule] ?? { total: 0, files: {} }
    const baselineFiles = baselineRuleFiles[rule] ?? {}

    tableRows.push(
      `| \`${rule}\` | **${baseline}** | **${current}** | ${delta >= 0 ? '+' : '-'}${delta} |`
    )

    if (current > baseline) {
      failed = true
      const delta = current - baseline
      const baselineHasFiles = Object.hasOwn(baselineRuleFiles, rule)
      const fileSummary = describeFileRegression(
        baselineFiles,
        currentSnapshot.files,
        baselineHasFiles
      )
      const msgParts = [
        `You added ${delta === 1 ? 'a new violation' : `${delta} new violations`} of ${rule}. Please fix it: baseline=${baseline}, current=${current}`,
      ]
      if (fileSummary) {
        msgParts.push(
          `Affected files: ${fileSummary}${baselineHasFiles ? '' : ' (baseline missing file breakdown; rerun with --init to capture it)'}`
        )
      }
      const msg = msgParts.join(' ')
      console.error(msg)
      console.log(`::error title=New violations::${msg}`)
    } else if (current < baseline) {
      improvedRules.push(rule)
      if (args.decreaseBaselines) {
        decreasedBaselines[rule] = { from: baseline, to: current, snapshot: currentSnapshot }
      }
    }
  }

  const summaryLines = [
    `### ESLint rule ratchet`,
    `Metadata: \`${args.metadata}\``,
    ``,
    `| Rule | Baseline | Current | Δ |`,
    `| --- | ---: | ---: | ---: |`,
    ...tableRows,
    ``,
  ]

  if (args.decreaseBaselines && Object.keys(decreasedBaselines).length > 0) {
    const updates: Record<string, RuleSnapshot> = {}
    const details: string[] = []
    const logParts: string[] = []
    for (const [rule, { from, to, snapshot }] of Object.entries(decreasedBaselines)) {
      updates[rule] = snapshot
      details.push(`- \`${rule}\`: ${from} -> ${to}`)
      logParts.push(`${rule}: ${from} -> ${to}`)
    }
    writeBaselines(args.metadata, updates, true)
    summaryLines.push('', 'Baselines decreased for improved rules:', ...details, '')
    console.log(`Baselines decreased for improved rules: ${logParts.join(', ')}`)
  }

  writeSummary(summaryLines.join('\n'))

  if (failed) {
    if (stderr && stderr.trim()) console.error('\nESLint stderr:\n', stderr)
    return 1
  } else {
    console.log(
      improvedRules.length > 0
        ? 'Nice! Some rules improved.'
        : 'Stable: No regressions for selected rules.'
    )
    return 0
  }
}

function main(): void {
  const exitCode = runRatchet(process.argv, dangerouslyRunEsLint)
  process.exit(exitCode)
}

if (process.argv[1]) {
  const invokedPath = pathToFileURL(path.resolve(process.argv[1])).href
  if (import.meta.url === invokedPath) {
    main()
  }
}

function describeFileRegression(
  baselineFiles: Record<string, number>,
  currentFiles: Record<string, number>,
  baselineHasFiles: boolean
): string {
  const MAX_FILES = 5
  if (baselineHasFiles) {
    const entries = Object.entries(currentFiles)
      .map(([file, count]) => ({
        file,
        delta: count - (baselineFiles[file] ?? 0),
      }))
      .filter(({ delta }) => delta > 0)
      .sort((a, b) => b.delta - a.delta || a.file.localeCompare(b.file))

    if (!entries.length) return ''

    return formatFileList(
      entries.map(({ file, delta }) => `${file} (+${delta})`),
      MAX_FILES
    )
  }

  const currentEntries = Object.entries(currentFiles)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([file, count]) => `${file} (${count} current)`)

  if (!currentEntries.length) return ''

  return formatFileList(currentEntries, MAX_FILES)
}

function formatFileList(entries: string[], maxFiles: number): string {
  if (entries.length <= maxFiles) {
    return entries.join(', ')
  }
  const remainder = entries.length - maxFiles
  const plural = remainder === 1 ? 'file' : 'files'
  return `${entries.slice(0, maxFiles).join(', ')}, +${remainder} more ${plural}`
}

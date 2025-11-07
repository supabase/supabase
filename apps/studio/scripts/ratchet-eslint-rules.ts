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
  messages?: ESLintMessage[]
}

interface ESLintExecutionResult {
  results: ESLintResult[]
  stderr: string
}

interface BaselineData {
  rules: Record<string, number>
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

function countRules(results: ESLintResult[], ruleIds: string[]): Record<string, number> {
  const checkedIds = new Set(ruleIds)
  const counts: Record<string, number> = {}

  for (const id of ruleIds) {
    counts[id] = 0
  }

  for (const file of results) {
    if (!file || !Array.isArray(file.messages)) continue
    for (const msg of file.messages) {
      const id = msg?.ruleId ?? ''
      if (id && checkedIds.has(id)) {
        counts[id] += 1
      }
    }
  }
  return counts
}

function readBaselines(fp: string): BaselineData {
  if (!existsSync(fp)) return { rules: {} }
  try {
    const data = JSON.parse(readFileSync(fp, 'utf8')) as Partial<BaselineData>
    if (data && typeof data === 'object' && data.rules && typeof data.rules === 'object') {
      return { rules: data.rules }
    }
  } catch {
    // ignore invalid metadata files and fall back to blank baselines
  }
  return { rules: {} }
}

function writeBaselines(fp: string, updates: Record<string, number>, merge = true): void {
  const dir = path.dirname(fp)
  mkdirSync(dir, { recursive: true })

  let current: BaselineData = { rules: {} }
  if (merge && existsSync(fp)) {
    current = readBaselines(fp)
  }

  const next: BaselineData = { rules: { ...current.rules, ...updates } }
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

function main(): void {
  const args = parseArgs(process.argv)

  // SECURITY:
  // Offloaded to user. Must document that they should not pass untrusted input
  // via --eslint or --eslint-args.
  const { results, stderr } = dangerouslyRunEsLint(args.eslint, args.eslintArgs)
  const currentCounts = countRules(results, args.rules)

  if (args.init) {
    writeBaselines(args.metadata, currentCounts, true)

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
    process.exit(0)
  }

  const baselines = readBaselines(args.metadata).rules || {}

  const missing = args.rules.filter((r) => typeof baselines[r] !== 'number')
  if (missing.length) {
    const msg = `Missing baselines for: ${missing.join(', ')} in ${args.metadata}. Run with --init to set them.`
    console.error(msg)
    writeSummary(`### ESLint rule ratchet\n${msg}`)
    console.log(`::error title=Missing baselines::${msg}`)
    process.exit(2)
  }

  let failed = false
  const tableRows: string[] = []
  const improvedRules: string[] = []
  const decreasedBaselines: Record<string, { from: number; to: number }> = {}
  for (const rule of args.rules) {
    const baseline = baselines[rule] ?? 0
    const current = currentCounts[rule] ?? 0
    const delta = current - baseline

    tableRows.push(
      `| \`${rule}\` | **${baseline}** | **${current}** | ${delta >= 0 ? '+' : '-'}${delta} |`
    )

    if (current > baseline) {
      failed = true
      const delta = current - baseline
      const msg = `You added ${delta === 1 ? 'a new violation' : `${delta} new violations`} of ${rule}. Please fix it: baseline=${baseline}, current=${current}`
      console.error(msg)
      console.log(`::error title=New violations::${msg}`)
    } else if (current < baseline) {
      improvedRules.push(rule)
      if (args.decreaseBaselines) {
        decreasedBaselines[rule] = { from: baseline, to: current }
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
    const updates: Record<string, number> = {}
    const details: string[] = []
    const logParts: string[] = []
    for (const [rule, { from, to }] of Object.entries(decreasedBaselines)) {
      updates[rule] = to
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
    process.exit(1)
  } else {
    console.log(
      improvedRules.length > 0
        ? 'Nice! Some rules improved.'
        : 'Stable: No regressions for selected rules.'
    )
    process.exit(0)
  }
}

main()

/**
 * Ratchet ESLint violations for selected rules.
 *
 * Examples:
 *   # Initialize baselines for two rules
 *   node scripts/ratchet-eslint-rules.js --init \
 *     --rule exhaustive-deps --rule no-console
 *
 *   # Compare current counts vs baselines
 *   node scripts/ratchet-eslint-rules.js \
 *     --rule exhaustive-deps --rule no-console
 *
 * Flags:
 *   --metadata <path>     Path to baseline file (default .github/eslint-rule-baselines.json)
 *   --init                Write current counts for the provided --rule(s) into metadata and exit 0
 *   --eslint "<cmd>"      ESLint command to run (default "npx eslint")
 *   --eslint-args "<...>" Extra args/paths for ESLint (e.g., ".")
 *   --rule <id>[,<id>...] Rule id(s). Repeat flag or comma-separate. REQUIRED.
 *
 * Notes:
 * - Counts occurrences regardless of severity (warn/error).
 * - Fails if any selected rule has currentCount > baselineCount.
 */

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

function parseArgs(argv) {
  const args = {
    metadata: '.github/eslint-rule-baselines.json',
    init: false,
    eslint: 'npx eslint',
    eslintArgs: '',
    rules: [],
  }

  for (let i = 2; i < argv.length; i++) {
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
      const val = (argv[++i] || '').trim()
      if (val)
        args.rules.push(
          ...val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
    } else {
      console.warn(`Unknown argument: ${a}`)
    }
  }

  // Fail if no rules are provided
  if (args.rules.length === 0) {
    console.error('Error: You must provide at least one --rule <rule-id>.')
    console.error('Example: --rule exhaustive-deps --rule no-console')
    process.exit(2)
  }

  // De-duplicate and preserve order
  args.rules = [...new Set(args.rules)]

  return args
}

function runESLint(eslintCmd, eslintArgs) {
  const fullCmd = `${eslintCmd} ${eslintArgs || ''} --format json`.trim()
  const proc = spawnSync(fullCmd, {
    shell: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    maxBuffer: 32 * 1024 * 1024, // allow large ESLint JSON payloads
  })

  const stdout = proc.stdout || ''
  const stderr = proc.stderr || ''

  if (!stdout.trim()) {
    console.error('ESLint did not produce JSON output. stderr:\n', stderr)
    process.exit(2)
  }

  let results
  try {
    results = JSON.parse(stdout)
  } catch (e) {
    console.error('Failed to parse ESLint JSON output:', e)
    console.error('Raw output (truncated to 4k):\n', stdout.slice(0, 4096))
    process.exit(2)
  }

  return { results, stderr }
}

function countRules(results, ruleIds) {
  const expanded = new Set(ruleIds)

  const counts = Object.fromEntries(ruleIds.map((id) => [id, 0]))

  for (const file of results) {
    if (!file || !Array.isArray(file.messages)) continue
    for (const msg of file.messages) {
      const id = msg?.ruleId || ''
      if (expanded.has(id)) {
        if (counts[id] != null) counts[id] += 1
      }
    }
  }
  return counts
}

function readBaselines(fp) {
  if (!fs.existsSync(fp)) return { rules: {} }
  try {
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'))
    if (data && typeof data === 'object' && data.rules && typeof data.rules === 'object') {
      return { rules: data.rules }
    }
  } catch {}
  return { rules: {} }
}

function writeBaselines(fp, updates, merge = true) {
  const dir = path.dirname(fp)
  fs.mkdirSync(dir, { recursive: true })

  let current = { rules: {} }
  if (merge && fs.existsSync(fp)) {
    current = readBaselines(fp)
  }

  const next = { rules: { ...current.rules, ...updates } }
  fs.writeFileSync(fp, JSON.stringify(next, null, 2) + '\n', 'utf8')
}

function writeSummary(markdown) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY
  if (summaryFile) {
    try {
      fs.appendFileSync(summaryFile, markdown + '\n', 'utf8')
    } catch {}
  }
}

;(function main() {
  const args = parseArgs(process.argv)

  const { results, stderr } = runESLint(args.eslint, args.eslintArgs)
  const currentCounts = countRules(results, args.rules)

  if (args.init) {
    writeBaselines(args.metadata, currentCounts, /*merge*/ true)

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
  const tableRows = []
  for (const rule of args.rules) {
    const baseline = baselines[rule] ?? 0
    const current = currentCounts[rule] ?? 0
    const delta = current - baseline

    tableRows.push(
      `| \`${rule}\` | **${baseline}** | **${current}** | ${delta >= 0 ? '+' : ''}${delta} |`
    )

    if (current > baseline) {
      failed = true
      const msg = `ESLint violations regressed for ${rule}: baseline=${baseline}, current=${current}`
      console.error(msg)
      console.log(`::error title=Rule regressed::${msg}`)
    }
  }

  writeSummary(
    [
      `### ESLint rule ratchet`,
      `Metadata: \`${args.metadata}\``,
      ``,
      `| Rule | Baseline | Current | Δ |`,
      `| --- | ---: | ---: | ---: |`,
      ...tableRows,
      ``,
    ].join('\n')
  )

  if (failed) {
    if (stderr && stderr.trim()) console.error('\nESLint stderr:\n', stderr)
    process.exit(1)
  } else {
    const improved = args.rules.some((r) => (currentCounts[r] ?? 0) < (baselines[r] ?? 0))
    console.log(
      improved ? 'Nice! Some rules improved.' : 'Stable: No regressions for selected rules.'
    )
    process.exit(0)
  }
})()

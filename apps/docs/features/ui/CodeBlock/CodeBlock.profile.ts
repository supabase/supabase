/**
 * Build-time profiling for code block rendering, off unless
 * `DOCS_BUILD_PROFILE=1`.
 *
 * Static export renders 8 pages per worker on a single thread, each against its
 * own 60s timeout, so what matters is how much of a worker's time and memory a
 * phase holds — not how fast one block is in isolation. Each worker reports its
 * running totals periodically, so the last line for a given pid is that
 * worker's final tally; read the workers together rather than individually.
 *
 * Memory is reported alongside time on purpose. Twoslash is fast per block but
 * every worker keeps its own TypeScript language service and the declaration
 * files it resolved, so a time-only profile can make it look cheap while it is
 * still what pushes a worker over.
 *
 * Usage: `DOCS_BUILD_PROFILE=1 pnpm --filter docs build`, then grep the output
 * for `[docs-profile]`.
 *
 * Read the two kinds of phase differently. `twoslash` and `shiki-tokenize` are
 * synchronous, so their totals are real blocking time and are directly
 * comparable. `shiki-load` is async and many blocks await the same load
 * concurrently, so its total counts the same waiting repeatedly and can far
 * exceed wall clock — treat it as "was anything waiting on a grammar", not as
 * a cost.
 */

type Phase = 'twoslash' | 'shiki-load' | 'shiki-tokenize'

const SYNC_PHASES = ['twoslash', 'shiki-tokenize'] as const satisfies ReadonlyArray<Phase>

type Stat = { calls: number; totalMs: number; errors: number }

const enabled = process.env.DOCS_BUILD_PROFILE === '1'

const stats = new Map<string, Stat>()
const startedAt = Date.now()
let peakRss = 0
let gcMs = 0

function statFor(phase: Phase, lang: string) {
  const key = `${phase}|${lang}`
  let stat = stats.get(key)
  if (!stat) {
    stat = { calls: 0, totalMs: 0, errors: 0 }
    stats.set(key, stat)
  }
  return stat
}

function record(phase: Phase, lang: string, elapsedMs: number, failed: boolean) {
  const stat = statFor(phase, lang)
  stat.calls += 1
  stat.totalMs += elapsedMs
  if (failed) stat.errors += 1

  const rss = process.memoryUsage.rss()
  if (rss > peakRss) peakRss = rss
}

export function measureSync<T>(phase: Phase, lang: string, run: () => T): T {
  if (!enabled) return run()
  const started = performance.now()
  try {
    const result = run()
    record(phase, lang, performance.now() - started, false)
    return result
  } catch (err) {
    record(phase, lang, performance.now() - started, true)
    throw err
  }
}

export async function measureAsync<T>(
  phase: Phase,
  lang: string,
  run: () => Promise<T>
): Promise<T> {
  if (!enabled) return run()
  const started = performance.now()
  try {
    const result = await run()
    record(phase, lang, performance.now() - started, false)
    return result
  } catch (err) {
    record(phase, lang, performance.now() - started, true)
    throw err
  }
}

function totalsFor(phase: Phase) {
  const totals: Stat = { calls: 0, totalMs: 0, errors: 0 }
  for (const [key, stat] of stats) {
    if (!key.startsWith(`${phase}|`)) continue
    totals.calls += stat.calls
    totals.totalMs += stat.totalMs
    totals.errors += stat.errors
  }
  return totals
}

function format(phase: Phase, { calls, totalMs, errors }: Stat) {
  return `${phase} calls=${calls} ms=${Math.round(totalMs)} errors=${errors}`
}

let reportedCalls = 0

function flush() {
  if (stats.size === 0) return

  const phases: ReadonlyArray<Phase> = ['twoslash', 'shiki-tokenize', 'shiki-load']
  const calls = phases.reduce((sum, phase) => sum + totalsFor(phase).calls, 0)
  if (calls === reportedCalls) return
  reportedCalls = calls

  const mb = (bytes: number) => Math.round(bytes / 1024 / 1024)
  const prefix = `[docs-profile] pid=${process.pid}`
  const blockingMs = SYNC_PHASES.reduce((sum, phase) => sum + totalsFor(phase).totalMs, 0)

  console.log(
    `${prefix} wall=${Math.round((Date.now() - startedAt) / 1000)}s ` +
      `blockingMs=${Math.round(blockingMs)} ` +
      phases.map((phase) => format(phase, totalsFor(phase))).join(' ') +
      ` gcMs=${Math.round(gcMs)} peakRssMb=${mb(peakRss)}`
  )

  const byCost = [...stats.entries()].sort(([, a], [, b]) => b.totalMs - a.totalMs)
  for (const [key, stat] of byCost) {
    const [phase, lang] = key.split('|')
    console.log(`${prefix} lang=${lang} ${format(phase as Phase, stat)}`)
  }
}

if (enabled) {
  // Next tears down export workers without running exit handlers, so the
  // summary has to be emitted while the worker is still alive. Each flush
  // prints cumulative totals and skips when nothing changed, so the last line
  // for a given pid is that worker's final tally.
  setInterval(flush, 5_000).unref()
  process.on('exit', flush)

  // Node only emits gc entries while an observer is subscribed, so this has to
  // be registered up front rather than read at flush time.
  import('node:perf_hooks')
    .then(({ PerformanceObserver }) => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) gcMs += entry.duration
      })
      observer.observe({ entryTypes: ['gc'] })
    })
    .catch(() => {
      // GC timing is a nice-to-have; the rest of the profile still works.
    })
}

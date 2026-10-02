/**
 * Evaluate every guide against the docs style guide and write one report.
 *
 * Usage:
 *   node scripts/style-eval/evaluate-all.mjs [--concurrency 8] [--limit N]
 *
 * Output: style-eval-report.json at the app root.
 */
import { readdir, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import { scores } from './scores.mjs'
import { DOCS_ROOT, MODEL, STYLE_GUIDE_FILES, evaluatePage, loadApiKey, loadStyleGuide } from './evaluate-page.mjs'

const arg = (flag, fallback) => {
  const index = process.argv.indexOf(flag)
  return index === -1 ? fallback : Number(process.argv[index + 1])
}

const CONCURRENCY = arg('--concurrency', 8)
const LIMIT = arg('--limit', Infinity)

const apiKey = loadApiKey()
if (!apiKey) {
  console.error('Set AI_GATEWAY_API_KEY, in apps/docs/.env.local or in your shell.')
  process.exit(1)
}

const styleGuide = await loadStyleGuide()

const GUIDES = join(DOCS_ROOT, 'content', 'guides')
const slugs = (await readdir(GUIDES, { recursive: true }))
  .filter((file) => extname(file) === '.mdx' && !basename(file).startsWith('_'))
  .map((file) => `guides/${file.replace(/\.mdx$/, '')}`)
  .sort()
  .slice(0, LIMIT)

console.log(`Evaluating ${slugs.length} guides at concurrency ${CONCURRENCY}.`)

const startedAt = Date.now()

const pages = []
const failures = []
let done = 0

async function worker(queue) {
  for (const slug of queue) {
    try {
      const result = await evaluatePage({ slug, styleGuide, apiKey })
      pages.push(result)
    } catch (error) {
      failures.push({ slug, error: error.message })
    }
    done += 1
    if (done % 25 === 0 || done === slugs.length) {
      console.log(`  ${done}/${slugs.length} (${failures.length} failed)`)
    }
  }
}

// Round-robin the slugs into per-worker queues so every worker gets a mix of
// long and short pages rather than one worker drawing all the long ones.
const queues = Array.from({ length: CONCURRENCY }, (_, i) => slugs.filter((_, j) => j % CONCURRENCY === i))
await Promise.all(queues.map(worker))

// The rung strings are long, so the report carries the short label and keeps
// the full criteria once in `rubrics`.
const shortRung = (rung) => rung.split(':')[0]
const mean = (values) => Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10

const rubricNames = Object.keys(scores)
const byRubric = Object.fromEntries(
  rubricNames.map((name) => {
    const percents = pages.map((page) => page.scores[name].percent)
    const distribution = {}
    for (const page of pages) {
      const label = shortRung(page.scores[name].rung)
      distribution[label] = (distribution[label] ?? 0) + 1
    }
    return [
      name,
      {
        mean: mean(percents),
        min: Math.min(...percents),
        max: Math.max(...percents),
        distribution,
      },
    ]
  })
)

const overall = (page) => mean(rubricNames.map((name) => page.scores[name].percent))

const byCategory = {}
for (const page of pages) {
  const category = page.route.split('/')[3]
  ;(byCategory[category] ??= []).push(overall(page))
}

const reportPages = pages
  .map((page) => ({
    route: page.route,
    source: page.source,
    overall: overall(page),
    scores: Object.fromEntries(
      rubricNames.map((name) => [
        name,
        { percent: page.scores[name].percent, rung: shortRung(page.scores[name].rung) },
      ])
    ),
  }))
  .sort((a, b) => a.overall - b.overall)

const totalCost = pages.reduce((sum, page) => sum + Number(page.cost ?? 0), 0)
const elapsedSeconds = Math.round((Date.now() - startedAt) / 100) / 10

// A human sample for judging whether the scores mean anything. Each entry links
// to the published page so a reader can open it and disagree with the score.
const withUrl = (page) => ({
  overall: page.overall,
  route: page.route,
  url: `https://supabase.com${page.route}`,
  scores: page.scores,
})
const spotCheck = {
  lowest: reportPages.slice(0, 15).map(withUrl),
  highest: reportPages.slice(-15).reverse().map(withUrl),
}

const report = {
  generatedAt: new Date().toISOString(),
  model: MODEL,
  styleGuide: STYLE_GUIDE_FILES.map((file) => `apps/docs/${file}`),
  summary: {
    pagesEvaluated: pages.length,
    pagesFailed: failures.length,
    inputTokens: pages.reduce((sum, page) => sum + (page.usage?.inputTokens ?? 0), 0),
    cost: `$${totalCost.toFixed(4)}`,
    elapsedSeconds,
    concurrency: CONCURRENCY,
    pagesPerSecond: Math.round((pages.length / elapsedSeconds) * 10) / 10,
    byRubric,
    byCategory: Object.fromEntries(
      Object.entries(byCategory)
        .map(([category, values]) => [category, { pages: values.length, mean: mean(values) }])
        .sort(([, a], [, b]) => a.mean - b.mean)
    ),
  },
  spotCheck,
  rubrics: Object.fromEntries(
    rubricNames.map((name) => [name, { instructions: scores[name].instructions, criteria: scores[name].criteria }])
  ),
  pages: reportPages,
  failures,
}

const destination = join(DOCS_ROOT, 'style-eval-report.json')
await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`)

console.log(`\nWrote ${destination}`)
console.log(
  `  ${pages.length} evaluated, ${failures.length} failed, ${report.summary.cost}, ${elapsedSeconds}s at concurrency ${CONCURRENCY}`
)
for (const [name, stats] of Object.entries(byRubric)) {
  console.log(`  ${name.padEnd(20)} mean ${String(stats.mean).padStart(5)}%`)
}

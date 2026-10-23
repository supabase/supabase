/**
 * Generates the embedded State of Startups survey dataset.
 *
 * The published microsite ships fully static: no live Supabase at build or
 * runtime. This script is the one place that touches a database. It derives
 * the exact set of (column, aggregation, filters) slices the narrative renders
 * by walking the narrative data itself, queries a LOCAL survey Supabase (the
 * `state-of-startups` repo's stack) through the generic aggregation RPCs, and
 * writes a single committed JSON of pre-aggregated distributions keyed by the
 * shared surveyKey().
 *
 * Because the slice list is derived from the narrative (not hand-maintained),
 * adding a chart/stat/cohort to the narrative automatically gets its data on
 * the next run — there is no parallel list to keep in sync.
 *
 * Usage (with the local survey stack running), run via tsx from apps/www:
 *   SURVEY_DB_URL=http://127.0.0.1:55321 \
 *   SURVEY_DB_KEY=sb_publishable_xxx \
 *   npx tsx scripts/generate-state-of-startups-data.ts
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

import { mergeFilters, surveyKey } from '../app/state-of-startups/lib/survey-key'
import type { Aggregation, SurveyFilters } from '../app/state-of-startups/lib/survey-key'
import surveyData from '../data/surveys/state-of-startups-2026'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'data', 'surveys', 'state-of-startups-data.json')

// This is a standalone, manually-run generator (not a turbo task), so these
// env vars don't affect any build output and need not be declared in turbo.json.
// eslint-disable-next-line turbo/no-undeclared-env-vars
const URL = process.env.SURVEY_DB_URL ?? 'http://127.0.0.1:55321'
// eslint-disable-next-line turbo/no-undeclared-env-vars
const KEY = process.env.SURVEY_DB_KEY ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
const YEARS = [2025, 2026] as const

const RPC: Record<Aggregation, string> = {
  single: 'get_single_select_stats',
  multi: 'get_multi_select_stats',
  boolean: 'get_boolean_stats',
}

interface Tuple {
  column: string
  aggregation: Aggregation
  filters?: SurveyFilters
}

// Manual consolidations: free-text survey options that should be counted as a
// single entry. The merged percentage is authoritative (provided by the survey
// owner) because a distinct-respondent union cannot be derived by summing the
// individual option counts. Source labels are matched case-insensitively.
const MULTI_MERGES: Record<
  string,
  { into: string; from: string[]; pct: Record<number, number> }[]
> = {
  ai_coding_tools: [
    { into: 'ChatGPT / Codex', from: ['chatgpt', 'codex', 'openai'], pct: { 2025: 11, 2026: 13 } },
  ],
}

function applyMerges(
  year: number,
  column: string,
  dist: { rows: { label: string; count: number }[]; respondentCount: number }
) {
  const merges = MULTI_MERGES[column]
  if (!merges) return dist
  let rows = dist.rows
  for (const m of merges) {
    const fam = new Set(m.from.map((s) => s.toLowerCase()))
    rows = rows.filter((r) => !fam.has(r.label.trim().toLowerCase()))
    const count = Math.round(((m.pct[year] ?? 0) / 100) * dist.respondentCount)
    if (count > 0) rows.push({ label: m.into, count })
  }
  rows.sort((a, b) => b.count - a.count)
  return { ...dist, rows }
}

/** Walk the narrative and emit every (column, aggregation, filters) it renders:
 *  top-line items, section stats and bar charts (each also under every cohort
 *  toggle option), cross-tab series per axis cohort, and channel-mix per
 *  cohort. Deduped by surveyKey. */
function collectTuples(): Tuple[] {
  const byKey = new Map<string, Tuple>()
  const push = (column: string, aggregation: Aggregation, filters?: SurveyFilters) => {
    const t: Tuple = { column, aggregation, filters }
    byKey.set(surveyKey(0, column, aggregation, filters), t)
  }
  const addQuery = (
    qy: { column: string; aggregation: Aggregation; filters?: SurveyFilters },
    extra?: SurveyFilters
  ) => push(qy.column, qy.aggregation, mergeFilters(qy.filters, extra))
  type TLQuery = { column: string; aggregation: Aggregation; filters?: SurveyFilters }
  const addTopLine = (item: {
    kind?: string
    query?: TLQuery
    a?: { query: TLQuery }
    b?: { query: TLQuery }
  }) => {
    if (item.kind === 'compare' && item.a && item.b) {
      addQuery(item.a.query)
      addQuery(item.b.query)
    } else if (item.query) {
      addQuery(item.query)
    }
  }

  surveyData.topLineHero.forEach(addTopLine)
  surveyData.topLineSecondary.items.forEach(addTopLine)

  for (const chapter of surveyData.pageChapters) {
    for (const section of chapter.sections) {
      const cohortExtras: (SurveyFilters | undefined)[] = [undefined]
      if (section.cohortToggle) {
        for (const opt of section.cohortToggle.options) {
          if (opt.filter !== null) cohortExtras.push({ [section.cohortToggle.key]: opt.filter })
        }
      }

      for (const stat of section.stats) {
        if (!stat.query) continue // static stat card; no distribution to fetch
        for (const extra of cohortExtras) addQuery(stat.query, extra)
      }

      for (const chart of section.charts) {
        if (chart.kind === 'cross-tab') {
          for (const cohort of chart.cohorts) {
            for (const series of chart.series) {
              push(series.query.column, series.query.aggregation, {
                [chart.axisColumn]: cohort.filter,
              })
            }
          }
        } else if (chart.kind === 'channel-mix') {
          for (const cohort of chart.cohorts) {
            push(chart.column, 'multi', { [chart.cohortColumn]: cohort.filter })
          }
        } else {
          for (const extra of cohortExtras)
            push(chart.column, chart.aggregation, mergeFilters(chart.filters, extra))
        }
      }
    }
  }

  return [...byKey.values()]
}

const client = createClient(URL, KEY)

async function fetchDistribution(year: number, t: Tuple) {
  const [statsRes, rcRes] = await Promise.all([
    client.rpc(RPC[t.aggregation], {
      survey_year: year,
      column_name: t.column,
      filters: t.filters ?? {},
    }),
    client.rpc('get_respondent_count_for_column', {
      survey_year: year,
      column_name: t.column,
      filters: t.filters ?? {},
    }),
  ])
  if (statsRes.error || rcRes.error) return null // column absent for this year, etc.
  const rows = ((statsRes.data ?? []) as { label: unknown; count: unknown }[]).map((r) => ({
    label: String(r.label),
    count: Number(r.count ?? 0),
  }))
  return applyMerges(year, t.column, { rows, respondentCount: Number(rcRes.data ?? 0) })
}

async function main() {
  const tuples = collectTuples()
  const meta: { generatedFrom: string; years: Record<string, number>; slices: number } = {
    generatedFrom: URL,
    years: {},
    slices: 0,
  }

  for (const year of YEARS) {
    const rc = await client.rpc('get_respondent_count_for_column', {
      survey_year: year,
      column_name: 'role',
      filters: {},
    })
    meta.years[year] = Number(rc.data ?? 0)
  }

  // Bounded concurrency: the local stack drops requests under a large parallel
  // fan-out, which would silently skip narrative slices. A small pool keeps it
  // fast without overwhelming PostgREST.
  const work = YEARS.flatMap((year) => tuples.map((t) => ({ year, t })))
  const distributions: Record<string, unknown> = {}
  let skipped = 0
  const POOL = 8
  for (let i = 0; i < work.length; i += POOL) {
    const batch = work.slice(i, i + POOL)
    const settled = await Promise.all(
      batch.map(async ({ year, t }) => {
        const dist = await fetchDistribution(year, t)
        return dist ? ([surveyKey(year, t.column, t.aggregation, t.filters), dist] as const) : null
      })
    )
    for (const entry of settled) {
      if (entry) distributions[entry[0]] = entry[1]
      else skipped++
    }
  }
  meta.slices = Object.keys(distributions).length

  writeFileSync(OUT, JSON.stringify({ meta, distributions }, null, 2) + '\n')
  console.log(`wrote ${OUT}`)
  console.log(
    `  ${meta.slices} distributions from ${tuples.length} narrative slices, ${skipped} skipped`
  )
  console.log(`  respondents: 2025=${meta.years[2025]} 2026=${meta.years[2026]}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

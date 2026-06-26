/**
 * Generates the embedded State of Startups survey dataset.
 *
 * The published microsite ships fully static: no live Supabase at build or
 * runtime. This script is the one place that touches a database. It queries a
 * LOCAL survey Supabase (the `state-of-startups` repo's stack) through the
 * generic aggregation RPCs and writes a single committed JSON of
 * pre-aggregated distributions, keyed by (year, column, aggregation, filters).
 *
 * Every chart, stat card, cross-tab, channel-mix, and cohort toggle in the
 * narrative reads one of these distributions. A distribution is:
 *   { rows: [{ label, count }], respondentCount }
 * from which a component derives "% of respondents who picked X".
 *
 * Usage (with the local survey stack running):
 *   SURVEY_DB_URL=http://127.0.0.1:55321 \
 *   SURVEY_DB_KEY=sb_publishable_xxx \
 *   node apps/www/scripts/generate-state-of-startups-data.mjs
 *
 * The slice list below is derived from the narrative in
 * apps/www/data/surveys/state-of-startups-2026.tsx. When the narrative gains a
 * new filtered slice (cohort toggle option, cross-tab, channel-mix), add it to
 * FILTERED_SLICES and re-run.
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'data', 'surveys', 'state-of-startups-data.json')

const URL = process.env.SURVEY_DB_URL ?? 'http://127.0.0.1:55321'
const KEY = process.env.SURVEY_DB_KEY ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
const YEARS = [2025, 2026]

// Age bands (en-dash, as stored). Mirror of the narrative constants.
const AGE_UNDER_40 = ['18–21', '22–29', '30–39']
const NON_FOUNDERS = [
  'Engineer',
  'Product Management',
  'Marketing',
  'Sales',
  'Legal or Ops',
  'Other',
]
// AI-codebase cohort filter values (hyphen, as stored).
const AI_BANDS = ['0%', '1-10%', '11-25%', '26-50%', '51-75%', '76-100%']

// ---- base distributions: every (column, aggregation) the narrative renders ----
const BASE_SLICES = [
  // single-select
  ['founder_count', 'single'],
  ['person_age', 'single'],
  ['location', 'single'],
  ['location_north_america', 'single'],
  ['ai_generated_codebase_percent', 'single'],
  ['currently_monetizing', 'single'],
  ['biggest_challenge', 'single'],
  ['building_ai_agents', 'single'],
  ['building_multi_agent_systems', 'single'],
  ['mcp_adoption', 'single'],
  ['dev_community_built', 'single'],
  ['sales_primary_responsible', 'single'],
  ['dedicated_sales_function', 'single'],
  ['world_outlook', 'single'],
  ['role', 'single'],
  // multi-select
  ['ai_coding_tools', 'multi'],
  ['subscriptions', 'multi'],
  ['ai_models_used', 'multi'],
  ['databases', 'multi'],
  ['auth_provider', 'multi'],
  ['cloud_providers', 'multi'],
  ['frontend_stack', 'multi'],
  ['ai_agents_problems', 'multi'],
  ['prompt_management', 'multi'],
  ['ai_evaluation_testing', 'multi'],
  ['ai_observability', 'multi'],
  ['sales_tools', 'multi'],
  ['observability', 'multi'],
  ['growth_tools', 'multi'],
  ['initial_paying_customers', 'multi'],
  ['pricing', 'multi'],
  ['market_model', 'multi'],
  ['regular_social_media_use', 'multi'],
  ['events', 'multi'],
  // boolean
  ['founders_are_technical', 'boolean'],
  ['previous_company', 'boolean'],
]

// ---- filtered distributions: cohort toggles, cross-tabs, channel-mix, filtered stats ----
const FILTERED_SLICES = [
  // Ch1 geo: NA metros restricted to North America
  ['location_north_america', 'single', { location: 'North America' }],
  // Ch3 ai-codebase cohort toggle (person_age)
  ['ai_generated_codebase_percent', 'single', { person_age: AGE_UNDER_40 }],
  ['ai_generated_codebase_percent', 'single', { person_age: '40–49' }],
  ['ai_generated_codebase_percent', 'single', { person_age: '50–59' }],
  ['ai_generated_codebase_percent', 'single', { person_age: '60+' }],
  // Ch3 cost-of-vibes + Ch9 optimism-gap cross-tabs (per AI band)
  ...AI_BANDS.flatMap((b) => [
    ['currently_monetizing', 'single', { ai_generated_codebase_percent: b }],
    ['biggest_challenge', 'single', { ai_generated_codebase_percent: b }],
    ['world_outlook', 'single', { ai_generated_codebase_percent: b }],
  ]),
  // Ch7 community-moat channel-mix + filtered stats (dev_community_built)
  ['initial_paying_customers', 'multi', { dev_community_built: 'Yes' }],
  ['initial_paying_customers', 'multi', { dev_community_built: 'No' }],
  // Ch9 outlook cohort toggle (role)
  ['world_outlook', 'single', { role: 'Founder / Co-founder' }],
  ['world_outlook', 'single', { role: NON_FOUNDERS }],
]

const RPC = {
  single: 'get_single_select_stats',
  multi: 'get_multi_select_stats',
  boolean: 'get_boolean_stats',
}

// Canonical key. MUST stay byte-identical to surveyKey() in the runtime
// (apps/www/app/state-of-startups/lib/survey-keys.ts).
function filterToken(filters) {
  if (!filters) return ''
  const keys = Object.keys(filters).sort()
  if (keys.length === 0) return ''
  return JSON.stringify(keys.map((k) => [k, filters[k]]))
}
function surveyKey(year, column, aggregation, filters) {
  return `${year}|${column}|${aggregation}|${filterToken(filters)}`
}

const client = createClient(URL, KEY)

async function fetchDistribution(year, column, aggregation, filters) {
  const { data, error } = await client.rpc(RPC[aggregation], {
    survey_year: year,
    column_name: column,
    filters: filters ?? {},
  })
  if (error) return null // column absent for this year, etc.

  const rows = (data ?? []).map((r) => ({ label: String(r.label), count: Number(r.count ?? 0) }))

  const { data: rc, error: rcErr } = await client.rpc('get_respondent_count_for_column', {
    survey_year: year,
    column_name: column,
    filters: filters ?? {},
  })
  if (rcErr) return null
  return { rows, respondentCount: Number(rc ?? 0) }
}

async function main() {
  const dataset = {}
  const meta = { generatedFrom: URL, years: {}, slices: 0 }

  // per-year respondent totals (role is answered by everyone)
  for (const year of YEARS) {
    const rc = await client.rpc('get_respondent_count_for_column', {
      survey_year: year,
      column_name: 'role',
      filters: {},
    })
    meta.years[year] = Number(rc.data ?? 0)
  }

  const allSlices = [
    ...BASE_SLICES.map(([c, a]) => [c, a, undefined]),
    ...FILTERED_SLICES,
  ]

  let ok = 0
  let skipped = 0
  for (const [column, aggregation, filters] of allSlices) {
    for (const year of YEARS) {
      const dist = await fetchDistribution(year, column, aggregation, filters)
      const key = surveyKey(year, column, aggregation, filters)
      if (dist === null) {
        skipped++
        continue
      }
      dataset[key] = dist
      ok++
    }
  }

  meta.slices = ok
  const out = { meta, distributions: dataset }
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`wrote ${OUT}`)
  console.log(`  ${ok} distributions, ${skipped} skipped (column absent that year)`)
  console.log(`  respondents: 2025=${meta.years[2025]} 2026=${meta.years[2026]}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

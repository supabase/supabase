import { createClient } from '@supabase/supabase-js'

import type {
  ChartDataItem,
  StatAggregation,
  StatColumnData,
  StatColumnRow,
} from '../components/survey-data-context'

const CARRY_OVER_RPCS = [
  'get_role_stats',
  'get_location_stats',
  'get_funding_stage_stats',
  'get_accelerator_stats',
  'get_industry_stats',
  'get_biggest_challenge_stats',
  'get_world_outlook_stats',
  'get_databases_stats',
  'get_ai_coding_tools_stats',
  'get_ai_models_stats',
  'get_initial_paying_customers_stats',
  'get_sales_tools_stats',
  'get_new_ideas_stats',
  'get_regular_social_media_use_stats',
] as const

const NEW_IN_2026_RPCS = [
  'get_ai_generated_codebase_percent_stats',
  'get_auth_provider_stats',
  'get_subscriptions_stats',
  'get_building_ai_agents_stats',
  'get_mcp_adoption_stats',
] as const

// Columns referenced by stat cards across the narrative. Preloaded via the
// generic `get_<aggregation>_stats` RPCs so the stat cards can compute live
// percentages for both 2025 and 2026 without an extra round trip in the
// browser. Adding a new stat to the narrative? Add its column here too.
const STAT_PRELOAD_QUERIES: Array<{ column: string; aggregation: StatAggregation }> = [
  // single-select
  { column: 'founder_count', aggregation: 'single' },
  { column: 'person_age', aggregation: 'single' },
  { column: 'team_size', aggregation: 'single' },
  { column: 'startup_age', aggregation: 'single' },
  { column: 'funding_stage', aggregation: 'single' },
  { column: 'location', aggregation: 'single' },
  { column: 'role', aggregation: 'single' },
  { column: 'industry', aggregation: 'single' },
  { column: 'biggest_challenge', aggregation: 'single' },
  { column: 'world_outlook', aggregation: 'single' },
  { column: 'building_ai_agents', aggregation: 'single' },
  { column: 'ai_generated_codebase_percent', aggregation: 'single' },
  { column: 'mcp_adoption', aggregation: 'single' },
  { column: 'building_multi_agent_systems', aggregation: 'single' },
  { column: 'dev_community_built', aggregation: 'single' },
  { column: 'dedicated_sales_function', aggregation: 'single' },
  { column: 'describe_your_online_persona', aggregation: 'single' },
  // multi-select
  { column: 'ai_coding_tools', aggregation: 'multi' },
  { column: 'subscriptions', aggregation: 'multi' },
  { column: 'ai_models_used', aggregation: 'multi' },
  { column: 'databases', aggregation: 'multi' },
  { column: 'backend_stack', aggregation: 'multi' },
  { column: 'frontend_stack', aggregation: 'multi' },
  { column: 'auth_provider', aggregation: 'multi' },
  { column: 'cloud_providers', aggregation: 'multi' },
  { column: 'ai_agents_problems', aggregation: 'multi' },
  { column: 'ai_evaluation_testing', aggregation: 'multi' },
  { column: 'sales_tools', aggregation: 'multi' },
  { column: 'observability', aggregation: 'multi' },
  { column: 'growth_tools', aggregation: 'multi' },
  { column: 'initial_paying_customers', aggregation: 'multi' },
  { column: 'user_engagement', aggregation: 'multi' },
  { column: 'pricing', aggregation: 'multi' },
  { column: 'market_model', aggregation: 'multi' },
  { column: 'regular_social_media_use', aggregation: 'multi' },
  { column: 'events', aggregation: 'multi' },
  // boolean
  { column: 'founders_are_technical', aggregation: 'boolean' },
  { column: 'previous_company', aggregation: 'boolean' },
]

const STAT_YEARS = [2025, 2026] as const

export type PreloadedSurveyData = Record<string, ChartDataItem[]>
export type PreloadedStatData = Record<string, StatColumnData>

export function transformSurveyRows(rows: any[]): ChartDataItem[] {
  if (!Array.isArray(rows) || rows.length === 0) return []
  const total = rows.reduce((sum, row) => sum + parseInt(row.count ?? row.total ?? '0'), 0)
  return rows.map((row) => {
    const count = parseInt(row.count ?? row.total ?? '0')
    const rawPercentage = total > 0 ? (count / total) * 100 : 0
    return {
      label: row.label || row.value || row[Object.keys(row)[0]],
      value: Math.round(rawPercentage),
      rawValue: rawPercentage,
    }
  })
}

function statKey(year: number, column: string): string {
  return `${year}::${column}`
}

export { statKey }

export async function preloadSurveyData(): Promise<PreloadedSurveyData> {
  const url = process.env.NEXT_PUBLIC_SURVEY_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SURVEY_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.warn('[preloadSurveyData] survey supabase env vars missing — returning empty cache')
    return {}
  }

  const client = createClient(url, anonKey)

  const rpcNames: string[] = [
    ...CARRY_OVER_RPCS,
    ...CARRY_OVER_RPCS.map((name) => `${name}_2026`),
    ...NEW_IN_2026_RPCS.map((name) => `${name}_2026`),
  ]

  const entries = await Promise.all(
    rpcNames.map(async (rpcName) => {
      try {
        const { data, error } = await client.rpc(rpcName, {})
        if (error) {
          console.error(`[preloadSurveyData] ${rpcName} failed:`, error.message)
          return [rpcName, [] as ChartDataItem[]] as const
        }
        return [rpcName, transformSurveyRows(data ?? [])] as const
      } catch (err: any) {
        console.error(`[preloadSurveyData] ${rpcName} threw:`, err?.message ?? err)
        return [rpcName, [] as ChartDataItem[]] as const
      }
    })
  )

  return Object.fromEntries(entries)
}

export async function preloadStatData(): Promise<PreloadedStatData> {
  const url = process.env.NEXT_PUBLIC_SURVEY_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SURVEY_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.warn('[preloadStatData] survey supabase env vars missing — returning empty cache')
    return {}
  }

  const client = createClient(url, anonKey)

  const tasks = STAT_PRELOAD_QUERIES.flatMap(({ column, aggregation }) =>
    STAT_YEARS.map(async (year) => {
      const key = statKey(year, column)
      try {
        const rpcName =
          aggregation === 'multi'
            ? 'get_multi_select_stats'
            : aggregation === 'boolean'
              ? 'get_boolean_stats'
              : 'get_single_select_stats'

        const { data, error } = await client.rpc(rpcName, {
          survey_year: year,
          column_name: column,
        })

        if (error) {
          // Column doesn't exist for this year (e.g. new-in-2026 column on 2025).
          // Silently skip; stat card will fall back to its static value or "—".
          return null
        }

        const rows: StatColumnRow[] = (data ?? []).map((r: any) => ({
          label: String(r.label),
          count: Number(r.count ?? 0),
        }))

        let respondentCount: number
        if (aggregation === 'multi') {
          const { data: rcData, error: rcError } = await client.rpc(
            'get_respondent_count_for_column',
            { survey_year: year, column_name: column }
          )
          if (rcError) {
            console.error(
              `[preloadStatData] respondent_count(${year},${column}) failed:`,
              rcError.message
            )
            return null
          }
          respondentCount = Number(rcData ?? 0)
        } else {
          respondentCount = rows.reduce((sum, r) => sum + r.count, 0)
        }

        return [key, { rows, respondentCount }] as const
      } catch (err: any) {
        console.error(
          `[preloadStatData] ${aggregation} ${column} ${year} threw:`,
          err?.message ?? err
        )
        return null
      }
    })
  )

  const settled = await Promise.all(tasks)
  return Object.fromEntries(
    settled.filter((e): e is readonly [string, StatColumnData] => e !== null)
  )
}

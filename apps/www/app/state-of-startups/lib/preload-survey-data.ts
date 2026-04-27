import { createClient } from '@supabase/supabase-js'

import type { ChartDataItem } from '../components/survey-data-context'

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

export type PreloadedSurveyData = Record<string, ChartDataItem[]>

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

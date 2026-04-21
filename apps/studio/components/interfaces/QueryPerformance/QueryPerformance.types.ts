import { GetIndexAdvisorResultResponse } from '@/data/database/retrieve-index-advisor-result-query'

export interface QueryPerformanceRow {
  query: string
  prop_total_time: number
  total_time: number
  calls: number
  max_time: number
  mean_time: number
  min_time: number
  rows_read: number
  p95_time?: number
  cache_hit_rate: number
  rolname: string
  application_name?: string
  index_advisor_result?: GetIndexAdvisorResultResponse | null
  _total_cache_hits?: number
  _total_cache_misses?: number
  _count?: number
  first_seen?: string
}

export type QueryPerformancePreset =
  | 'mostFrequentlyInvoked'
  | 'mostTimeConsuming'
  | 'slowestExecutionTime'
  | 'queryHitRate'
  | 'unified'
  | 'slowQueriesCount'
  | 'queryMetrics'

export type QueryPerformanceSort = {
  column:
    | 'query'
    | 'rolname'
    | 'total_time'
    | 'prop_total_time'
    | 'calls'
    | 'avg_rows'
    | 'max_time'
    | 'mean_time'
    | 'min_time'
  order: 'asc' | 'desc'
}

export type QuerySource = 'dashboard' | 'non-dashboard'

export type QueryPerformanceSQLParams = {
  preset: QueryPerformancePreset
  orderBy?: QueryPerformanceSort
  searchQuery?: string
  roles?: string[]
  sources?: QuerySource[]
  minCalls?: number
  minTotalTime?: number
  runIndexAdvisor?: boolean
  filterIndexAdvisor?: boolean
  page?: number
  pageSize?: number
}

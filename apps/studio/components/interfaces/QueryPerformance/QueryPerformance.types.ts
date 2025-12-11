import { GetIndexAdvisorResultResponse } from 'data/database/retrieve-index-advisor-result-query'

export interface QueryPerformanceRow {
  query: string
  prop_total_time: number
  total_time: number
  calls: number
  max_time: number
  mean_time: number
  min_time: number
  rows_read: number
  cache_hit_rate: number
  rolname: string
  index_advisor_result?: GetIndexAdvisorResultResponse | null
  _total_cache_hits?: number
  _total_cache_misses?: number
  _count?: number
}

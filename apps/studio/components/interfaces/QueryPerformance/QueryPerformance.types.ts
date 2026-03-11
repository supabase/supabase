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
  application_name?: string
  index_advisor_result?: GetIndexAdvisorResultResponse | null
  _total_cache_hits?: number
  _total_cache_misses?: number
  _count?: number
}

export interface ChartDataPoint {
  period_start: number
  timestamp: string
  query_latency: number
  mean_time: number
  min_time: number
  max_time: number
  stddev_time: number
  p50_time: number
  p95_time: number
  rows_read: number
  calls: number
  cache_hits: number
  cache_misses: number
}

export interface ParsedLogEntry {
  timestamp?: string
  application_name?: string
  calls?: number
  database_name?: string
  query?: string
  query_id?: number
  total_exec_time?: number
  total_plan_time?: number
  user_name?: string
  mean_exec_time?: number
  mean_plan_time?: number
  min_exec_time?: number
  max_exec_time?: number
  min_plan_time?: number
  max_plan_time?: number
  p50_exec_time?: number
  p95_exec_time?: number
  p50_plan_time?: number
  p95_plan_time?: number
  [key: string]: any
}

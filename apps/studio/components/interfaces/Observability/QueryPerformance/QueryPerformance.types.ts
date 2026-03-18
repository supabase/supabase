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
}

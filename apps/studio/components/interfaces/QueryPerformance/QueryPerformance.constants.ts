export enum QUERY_PERFORMANCE_REPORT_TYPES {
  MOST_TIME_CONSUMING = 'most_time_consuming',
  MOST_FREQUENT = 'most_frequent',
  SLOWEST_EXECUTION = 'slowest_execution',
  UNIFIED = 'unified',
}

export const QUERY_PERFORMANCE_PRESET_MAP = {
  [QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING]: 'mostTimeConsuming',
  [QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT]: 'mostFrequentlyInvoked',
  [QUERY_PERFORMANCE_REPORT_TYPES.SLOWEST_EXECUTION]: 'slowestExecutionTime',
  [QUERY_PERFORMANCE_REPORT_TYPES.UNIFIED]: 'unified',
} as const

export const QUERY_PERFORMANCE_COLUMNS = [
  { id: 'query', name: 'Query', description: undefined, minWidth: 500 },
  { id: 'calls', name: 'Calls', description: undefined, minWidth: 100 },
  { id: 'total_time', name: 'Total time', description: 'latency', minWidth: 150 },
  { id: 'prop_total_time', name: 'Time consumed', description: undefined, minWidth: 150 },
  { id: 'max_time', name: 'Max time', description: undefined, minWidth: 100 },
  { id: 'mean_time', name: 'Mean time', description: undefined, minWidth: 100 },
  { id: 'min_time', name: 'Min time', description: undefined, minWidth: 100 },
  { id: 'avg_rows', name: 'Avg. Rows', description: undefined, minWidth: 100 },
  { id: 'rolname', name: 'Role', description: undefined, minWidth: 120 },
] as const

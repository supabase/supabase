// Remove the enum and preset map since we no longer need multiple report types
// export enum QUERY_PERFORMANCE_REPORT_TYPES { ... }
// export const QUERY_PERFORMANCE_PRESET_MAP = { ... }

export const QUERY_PERFORMANCE_COLUMNS = [
  { id: 'query', name: 'Query', description: undefined, minWidth: 500 },
  { id: 'calls', name: 'Calls', description: undefined, minWidth: 100 },
  { id: 'total_time', name: 'Total time', description: 'latency', minWidth: 150 },
  { id: 'prop_total_time', name: 'Time consumed', description: undefined, minWidth: 150 },
  { id: 'max_time', name: 'Max time', description: undefined, minWidth: 150 },
  { id: 'mean_time', name: 'Mean time', description: undefined, minWidth: 150 },
  { id: 'min_time', name: 'Min time', description: undefined, minWidth: 150 },
  { id: 'avg_rows', name: 'Avg. Rows', description: undefined, minWidth: 100 },
  { id: 'rolname', name: 'Role', description: undefined, minWidth: 120 },
] as const

export const QUERY_PERFORMANCE_REPORTS = {
  unified: QUERY_PERFORMANCE_COLUMNS,
} as const

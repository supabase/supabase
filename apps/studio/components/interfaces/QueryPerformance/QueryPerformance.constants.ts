export enum QUERY_PERFORMANCE_REPORT_TYPES {
  MOST_TIME_CONSUMING = 'most_time_consuming',
  MOST_FREQUENT = 'most_frequent',
  SLOWEST_EXECUTION = 'slowest_execution',
}

export const QUERY_PERFORMANCE_REPORTS = {
  [QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING]: [
    { id: 'query', name: 'Query', description: undefined, minWidth: 600 },
    { id: 'rolname', name: 'Role', description: undefined, minWidth: undefined },
    { id: 'calls', name: 'Calls', description: undefined, minWidth: undefined },
    { id: 'total_time', name: 'Total time', description: 'latency', minWidth: 180 },
    { id: 'prop_total_time', name: 'Time consumed', description: undefined, minWidth: 150 },
  ],
  [QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT]: [
    { id: 'query', name: 'Query', description: undefined, minWidth: 600 },
    { id: 'rolname', name: 'Role', description: undefined, minWidth: undefined },
    { id: 'avg_rows', name: 'Avg. Rows', description: undefined, minWidth: undefined },
    { id: 'calls', name: 'Calls', description: undefined, minWidth: undefined },
    { id: 'max_time', name: 'Max time', description: undefined, minWidth: undefined },
    { id: 'mean_time', name: 'Mean time', description: undefined, minWidth: undefined },
    { id: 'min_time', name: 'Min time', description: undefined, minWidth: undefined },
    { id: 'total_time', name: 'Total time', description: 'latency', minWidth: 180 },
  ],
  [QUERY_PERFORMANCE_REPORT_TYPES.SLOWEST_EXECUTION]: [
    { id: 'query', name: 'Query', description: undefined, minWidth: 600 },
    { id: 'rolname', name: 'Role', description: undefined, minWidth: undefined },
    { id: 'avg_rows', name: 'Avg. Rows', description: undefined, minWidth: undefined },
    { id: 'calls', name: 'Calls', description: undefined, minWidth: undefined },
    { id: 'max_time', name: 'Max time', description: undefined, minWidth: undefined },
    { id: 'mean_time', name: 'Mean time', description: undefined, minWidth: undefined },
    { id: 'min_time', name: 'Min time', description: undefined, minWidth: undefined },
    { id: 'total_time', name: 'Total time', description: 'latency', minWidth: 180 },
  ],
} as const

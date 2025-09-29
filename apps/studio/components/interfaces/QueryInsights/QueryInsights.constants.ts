export type QueryInsightsTableColumn = {
  id: string
  name: string
  minWidth?: number
  width?: number
  resizable?: boolean
}

export type ColumnConfiguration = { id: string; width?: number }

export const QUERY_INSIGHTS_TABLE_COLUMNS: QueryInsightsTableColumn[] = [
  { id: 'query', name: 'Query', minWidth: 600, width: 600, resizable: true },
  { id: 'total_time', name: 'Total time', minWidth: 120, width: 120, resizable: true },
  { id: 'mean_exec_time', name: 'Mean time', minWidth: 120, width: 120, resizable: true },
  { id: 'calls', name: 'Calls', minWidth: 120, width: 120, resizable: true },
  { id: 'rows_read', name: 'Rows read', minWidth: 120, width: 120, resizable: true },
  { id: 'avg_p90', name: 'Avg p90', minWidth: 120, width: 120, resizable: true },
  { id: 'avg_p95', name: 'Avg p95', minWidth: 120, width: 120, resizable: true },
  { id: 'health_score', name: 'Health Score', minWidth: 120, width: 120, resizable: true },
  { id: 'total_cost_before', name: 'Total Cost', minWidth: 120, width: 120, resizable: true },
  { id: 'index_advisor', name: 'Index advisor', minWidth: 160, width: 160, resizable: true },
  { id: 'last_run', name: 'Last run', minWidth: 200, width: 200, resizable: true },
]

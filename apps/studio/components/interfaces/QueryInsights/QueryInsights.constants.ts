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
  { id: 'slowness_rating', name: 'Slowness Rating', minWidth: 140, width: 120, resizable: true },
  { id: 'database', name: 'Database', minWidth: 120, width: 120, resizable: true },
  { id: 'calls', name: 'Calls', minWidth: 100, width: 100, resizable: true },
  { id: 'total_time', name: 'Total time', minWidth: 180, width: 180, resizable: true },
  { id: 'mean_exec_time', name: 'Mean time', minWidth: 150, width: 150, resizable: true },
  { id: 'rows_read', name: 'Rows read', minWidth: 120, width: 120, resizable: true },
  { id: 'badness_score', name: 'Badness score', minWidth: 150, width: 150, resizable: true },
]

import { untrustedSql } from '@supabase/pg-meta'

import { DEFAULT_CELL_ROW_LIMIT } from '@/components/interfaces/Explorer/QueryCell/QueryCell.utils'
import { type ExplorerQueryModel } from '@/components/interfaces/Explorer/QueryEditor'
import { type QueryDisplay, type QueryResult } from '@/components/interfaces/Explorer/types'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import { type QuerySourceBinding } from '@/data/query-sources/query-source-registry'

export const DEFAULT_ASSISTANT_QUERY_TITLE = 'SQL query'

export function getAssistantQueryDisplay({
  view,
  xAxis,
  yAxis,
}: {
  view?: 'table' | 'chart'
  xAxis?: string
  yAxis?: string
}): QueryDisplay {
  const hasChartAxes = Boolean(xAxis || yAxis)

  return {
    view: view ?? 'table',
    chart: hasChartAxes
      ? {
          type: 'bar',
          x_column: xAxis ?? '',
          y_columns: yAxis ? [yAxis] : [],
          cumulative: false,
          scale: 'linear',
          show_labels: false,
        }
      : undefined,
  }
}

export function toAssistantQueryResult(output: unknown): QueryResult | undefined {
  if (!Array.isArray(output)) return undefined

  const rows = output.filter(
    (row): row is Record<string, unknown> =>
      row !== null && typeof row === 'object' && !Array.isArray(row)
  )

  return { rows }
}

export function createAssistantQueryModel(sql: string): ExplorerQueryModel {
  return {
    _tag: 'database',
    uncheckedSql: untrustedSql(sql),
    rowLimit: DEFAULT_CELL_ROW_LIMIT,
  }
}

export function setAssistantQuerySql(query: ExplorerQueryModel, sql: string): ExplorerQueryModel {
  if (query._tag === 'logs') {
    return { ...query, uncheckedSql: untrustedLogSql(sql) }
  }

  return { ...query, uncheckedSql: untrustedSql(sql) }
}

export function changeAssistantQuerySource(
  query: ExplorerQueryModel,
  source: QuerySourceBinding
): ExplorerQueryModel {
  if (source._tag === 'logs') {
    return { ...source, uncheckedSql: untrustedLogSql(query.uncheckedSql) }
  }

  return {
    ...source,
    uncheckedSql: untrustedSql(query.uncheckedSql),
    rowLimit: query._tag === 'database' ? query.rowLimit : DEFAULT_CELL_ROW_LIMIT,
  }
}

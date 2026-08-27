import { untrustedSql } from '@supabase/pg-meta'
import dayjs from 'dayjs'
import isEqual from 'lodash/isEqual'

import { DEFAULT_CELL_ROW_LIMIT } from '@/components/interfaces/Explorer/QueryCell/QueryCell.utils'
import { type ExplorerQueryModel } from '@/components/interfaces/Explorer/QueryEditor'
import { type QueryDisplay, type QueryResult } from '@/components/interfaces/Explorer/types'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import {
  toQuerySourceBinding,
  type QuerySourceBinding,
} from '@/data/query-sources/query-source-registry'

export const DEFAULT_ASSISTANT_QUERY_TITLE = 'SQL query'
export const DEFAULT_ASSISTANT_LOGS_QUERY_TITLE = 'Logs query'

const TIME_COLUMN_RE =
  /^(timestamp|time|date|hour|minute|day|week|month|year|ts|datetime|bucket|interval|period)$/i
const PREFERRED_Y_COLUMN_RE = /^(count|cnt|n|total|sum|avg|average|value|errors?|requests?)$/i
const SKIP_AS_DIMENSION_RE = /(message|sql|query|error|stack|body|payload|detail|hint)/i
const AGGREGATE_SQL_RE = /\b(group\s+by|(?:count|sum|avg|max|min)\s*\()/i

const EMPTY_CHART = {
  type: 'bar' as const,
  x_column: '',
  y_series: [] as string[],
  cumulative: false,
  scale: 'linear' as const,
  show_labels: false,
}

export function isChartableAssistantSql(sql: string): boolean {
  const withoutComments = sql.replace(/--.*$/gm, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ')
  return AGGREGATE_SQL_RE.test(withoutComments)
}

export function getAssistantQueryDisplay({
  view,
  xAxis,
  yAxis,
  sql,
  rows,
}: {
  view?: 'table' | 'chart'
  xAxis?: string
  yAxis?: string
  sql?: string
  rows?: readonly Record<string, unknown>[]
}): QueryDisplay {
  const hasChartAxes = Boolean(xAxis || yAxis)

  if (hasChartAxes) {
    return {
      view: view ?? 'table',
      chart: {
        ...EMPTY_CHART,
        x_column: xAxis ?? '',
        y_series: yAxis ? [yAxis] : [],
      },
    }
  }

  if (rows && rows.length > 0) {
    const inferred = inferAssistantChartDisplay(rows)
    return { ...inferred, view: view ?? inferred.view }
  }

  if (view) return { view, chart: undefined }

  if (sql && isChartableAssistantSql(sql)) {
    return { view: 'chart', chart: undefined }
  }

  return { view: 'table', chart: undefined }
}

export function inferAssistantChartDisplay(rows: readonly Record<string, unknown>[]): QueryDisplay {
  if (rows.length === 0) return { view: 'table', chart: undefined }

  const columns = Object.keys(rows[0] ?? {})
  if (columns.length < 2) return { view: 'table', chart: undefined }

  const sample = rows.slice(0, 20)
  const numericColumns = columns.filter((column) => isNumericColumn(sample, column))
  const timeColumn = columns.find((column) => isTimeLikeColumn(column, sample))
  const xColumn =
    timeColumn ??
    columns.find(
      (column) => !numericColumns.includes(column) && !SKIP_AS_DIMENSION_RE.test(column)
    ) ??
    columns[0]
  const yCandidates = numericColumns.filter((column) => column !== xColumn)
  const yColumn = yCandidates.find((column) => PREFERRED_Y_COLUMN_RE.test(column)) ?? yCandidates[0]

  if (!xColumn || !yColumn || SKIP_AS_DIMENSION_RE.test(xColumn)) {
    return { view: 'table', chart: undefined }
  }

  return {
    view: 'chart',
    chart: {
      ...EMPTY_CHART,
      type: timeColumn ? 'line' : 'bar',
      x_column: xColumn,
      y_series: [yColumn],
    },
  }
}

export function toAssistantQueryResult(output: unknown): QueryResult | undefined {
  return Array.isArray(output) ? { rows: output.filter(isPlainRow) } : undefined
}

export function createAssistantQueryModel(
  sql: string,
  source: QuerySourceBinding = { _tag: 'database' }
): ExplorerQueryModel {
  if (source._tag === 'logs') {
    return { ...source, uncheckedSql: untrustedLogSql(sql) }
  }

  return {
    ...source,
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

export function shouldClearAssistantQueryResult(
  query: ExplorerQueryModel,
  nextSource: QuerySourceBinding
): boolean {
  return !isEqual(toQuerySourceBinding(query), toQuerySourceBinding(nextSource))
}

function isNumericValue(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'bigint') return true
  if (typeof value !== 'string' || value.trim().length === 0) return false
  return Number.isFinite(Number(value))
}

function isNumericColumn(rows: readonly Record<string, unknown>[], column: string): boolean {
  const values = rows.map((row) => row[column]).filter((value) => value != null)
  return values.length > 0 && values.every(isNumericValue)
}

function isTimeLikeColumn(column: string, rows: readonly Record<string, unknown>[]): boolean {
  if (TIME_COLUMN_RE.test(column)) return true

  const values = rows.map((row) => row[column]).filter((value) => value != null)
  if (values.length === 0) return false

  return values.every((value) => {
    if (typeof value !== 'string' || !/[-T:]/.test(value)) return false
    return dayjs(value).isValid()
  })
}

function isPlainRow(row: unknown): row is Record<string, unknown> {
  return row !== null && typeof row === 'object' && !Array.isArray(row)
}

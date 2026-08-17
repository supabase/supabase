import { untrustedSql } from '@supabase/pg-meta'
import { type Snapshot } from 'valtio'

import { type ExplorerQueryModel } from '../QueryEditor'
import { type QueryDisplay } from '../types'
import { type ChartConfig, type QueryCell } from '@/data/content/notebooks/notebook-schema'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import {
  getQuerySourceBinding,
  type QuerySourceBinding,
} from '@/data/query-sources/query-source-registry'

/** Row limit a database cell starts with when it has no saved one to carry over. */
export const DEFAULT_CELL_ROW_LIMIT = 100

/**
 * Valtio snapshots are deep-readonly. Readonly properties assign to mutable ones, so only
 * the array needs rebuilding to turn a snapshot's chart back into a writable config.
 */
type ReadonlyChartConfig = Omit<ChartConfig, 'y_columns'> & {
  readonly y_columns: readonly string[]
}

export const cloneChartConfig = (
  chart: ReadonlyChartConfig | undefined
): ChartConfig | undefined => (chart ? { ...chart, y_columns: [...chart.y_columns] } : undefined)

/** The display state a query cell hands the shared editor. */
// `view` is already defaulted to 'table' by the domain transform, so there is nothing to
// fall back to here — only the chart needs copying out of the snapshot.
export const getCellDisplay = (cell: Snapshot<QueryCell>): QueryDisplay => ({
  view: cell.view,
  chart: cloneChartConfig(cell.chart),
})

/** Fields every query cell carries, copied out of a snapshot so the result is writable. */
const copyQueryCellBase = (cell: Snapshot<QueryCell>) => ({
  id: cell.id,
  title: cell.title,
  view: cell.view,
  chart: cloneChartConfig(cell.chart),
})

/** A writable copy of a query cell, preserving its backend and every backend-specific field. */
export const cloneQueryCell = (cell: Snapshot<QueryCell>): QueryCell =>
  cell._tag === 'log_cell'
    ? {
        ...copyQueryCellBase(cell),
        _tag: 'log_cell',
        unchecked_sql: cell.unchecked_sql,
        time_range: cell.time_range,
      }
    : {
        ...copyQueryCellBase(cell),
        _tag: 'database_cell',
        unchecked_sql: cell.unchecked_sql,
        row_limit: cell.row_limit,
        database_identifier: cell.database_identifier,
      }

/**
 * Applies a source binding to a query cell, carrying the query text across unchanged and
 * rebranding it for the new backend's dialect.
 *
 * NOTE — carrying the text over is very likely not what a user wants when the backend
 * actually changes. Postgres SQL and logs SQL are separate dialects over separate schemas,
 * so a carried-over query will almost always fail to run, and the rebrand asserts a
 * dialect the text was never written in. We keep it for now because it is the
 * least-destructive option and needs no confirmation prompt; revisit once we know whether
 * people switch source to port an existing query or to start a fresh one, at which point
 * clearing the body (behind a confirmation) is the likely answer.
 */
export function changeCellSource(cell: Snapshot<QueryCell>, source: QuerySourceBinding): QueryCell {
  const base = copyQueryCellBase(cell)

  if (source._tag === 'logs') {
    return {
      ...base,
      _tag: 'log_cell',
      unchecked_sql: untrustedLogSql(cell.unchecked_sql),
      time_range: source.time_range,
    }
  }

  return {
    ...base,
    _tag: 'database_cell',
    unchecked_sql: untrustedSql(cell.unchecked_sql),
    row_limit: cell._tag === 'database_cell' ? cell.row_limit : DEFAULT_CELL_ROW_LIMIT,
    database_identifier: source.database_identifier,
  }
}

/**
 * Writes the editor's text back onto a cell, branded for that cell's dialect. Separate
 * from `cloneQueryCell` so the brand stays correlated with the cell tag in one narrowing
 * rather than being re-derived at each call site.
 */
export function setCellSql(cell: Snapshot<QueryCell>, sql: string): QueryCell {
  const base = copyQueryCellBase(cell)

  if (cell._tag === 'log_cell') {
    return {
      ...base,
      _tag: 'log_cell',
      unchecked_sql: untrustedLogSql(sql),
      time_range: cell.time_range,
    }
  }

  return {
    ...base,
    _tag: 'database_cell',
    unchecked_sql: untrustedSql(sql),
    row_limit: cell.row_limit,
    database_identifier: cell.database_identifier,
  }
}

/**
 * Builds the editor's query model from a cell and the editor's live text buffer. Branding
 * the buffer is the editor boundary the safe-SQL model expects; which brand applies is
 * decided by the cell's tag, so the dialect can't drift from the cell it belongs to.
 */
export function toQueryModel(cell: Snapshot<QueryCell>, sql: string): ExplorerQueryModel {
  if (cell._tag === 'log_cell') {
    return { ...getQuerySourceBinding(cell), uncheckedSql: untrustedLogSql(sql) }
  }

  return {
    ...getQuerySourceBinding(cell),
    uncheckedSql: untrustedSql(sql),
    rowLimit: cell.row_limit,
  }
}

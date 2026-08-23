import { untrustedSql } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import {
  changeCellSource,
  cloneQueryCell,
  DEFAULT_CELL_ROW_LIMIT,
  getCellDisplay,
  setCellRowLimit,
  setCellSql,
  toQueryModel,
} from './QueryCell.utils'
import { type ChartConfig, type QueryCell } from '@/data/content/notebooks/notebook-schema'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'

const CHART: ChartConfig = {
  type: 'bar',
  x_column: 'day',
  y_series: ['signups'],
  cumulative: false,
  scale: 'linear',
  show_labels: true,
}

const DATABASE_CELL: QueryCell = {
  _tag: 'database_cell',
  _id: 'cell-1',
  title: 'Signups',
  view: 'chart',
  chart: CHART,
  unchecked_sql: untrustedSql('select * from auth.users'),
  row_limit: 50,
  database_identifier: 'replica-1',
}

const LOG_CELL: QueryCell = {
  _tag: 'log_cell',
  _id: 'cell-2',
  title: 'Edge errors',
  view: 'table',
  chart: CHART,
  unchecked_sql: untrustedLogSql('select timestamp from logs'),
  time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
}

describe('changeCellSource', () => {
  it('keeps the query when only the database changes', () => {
    const next = changeCellSource(DATABASE_CELL, {
      _tag: 'database',
      database_identifier: 'replica-2',
    })

    expect(next).toEqual({ ...DATABASE_CELL, database_identifier: 'replica-2' })
  })

  it('keeps the query when only the log time range changes', () => {
    const time_range = { _tag: 'relative_time_range', unit: 'day', amount: 7 } as const
    const next = changeCellSource(LOG_CELL, { _tag: 'logs', time_range })

    expect(next).toEqual({ ...LOG_CELL, time_range })
  })

  it('carries the query text over when moving from the database to logs', () => {
    const time_range = { _tag: 'relative_time_range', unit: 'hour', amount: 1 } as const
    const next = changeCellSource(DATABASE_CELL, { _tag: 'logs', time_range })

    expect(next).toEqual({
      _tag: 'log_cell',
      _id: 'cell-1',
      title: 'Signups',
      view: 'chart',
      chart: CHART,
      unchecked_sql: 'select * from auth.users',
      time_range,
    })
  })

  it('carries the query text over and restores a default row limit when moving from logs to the database', () => {
    const next = changeCellSource(LOG_CELL, { _tag: 'database', database_identifier: undefined })

    expect(next).toEqual({
      _tag: 'database_cell',
      _id: 'cell-2',
      title: 'Edge errors',
      view: 'table',
      chart: CHART,
      unchecked_sql: 'select timestamp from logs',
      row_limit: DEFAULT_CELL_ROW_LIMIT,
      database_identifier: undefined,
    })
  })

  it('applies the selected database when moving from logs to the database', () => {
    const next = changeCellSource(LOG_CELL, {
      _tag: 'database',
      database_identifier: 'replica-2',
    })

    expect(next).toMatchObject({ _tag: 'database_cell', database_identifier: 'replica-2' })
  })

  it('preserves the chart across a backend change so display settings survive', () => {
    const next = changeCellSource(DATABASE_CELL, {
      _tag: 'logs',
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
    })

    expect(next.chart).toEqual(CHART)
    expect(next.chart).not.toBe(DATABASE_CELL.chart)
  })
})

describe('setCellSql', () => {
  it('writes the text back onto a database cell without touching its source', () => {
    expect(setCellSql(DATABASE_CELL, 'select 1')).toEqual({
      ...DATABASE_CELL,
      unchecked_sql: 'select 1',
    })
  })

  it('writes the text back onto a log cell without touching its time range', () => {
    expect(setCellSql(LOG_CELL, 'select 2')).toEqual({ ...LOG_CELL, unchecked_sql: 'select 2' })
  })
})

describe('setCellRowLimit', () => {
  it('writes the row limit onto a database cell without touching its query', () => {
    expect(setCellRowLimit(DATABASE_CELL, 500)).toEqual({ ...DATABASE_CELL, row_limit: 500 })
  })

  it('leaves a log cell unchanged, since it has no row limit concept', () => {
    expect(setCellRowLimit(LOG_CELL, 500)).toEqual(LOG_CELL)
  })
})

describe('cloneQueryCell', () => {
  it('copies the chart series array rather than aliasing it', () => {
    const clone = cloneQueryCell(DATABASE_CELL)

    expect(clone).toEqual(DATABASE_CELL)
    expect(clone.chart?.y_series).not.toBe(DATABASE_CELL.chart?.y_series)
  })
})

describe('getCellDisplay', () => {
  it('keeps a configured chart while the table view is selected', () => {
    expect(getCellDisplay({ ...DATABASE_CELL, view: 'table' })).toEqual({
      view: 'table',
      chart: CHART,
    })
  })

  it('reports no chart when a cell has never configured one', () => {
    expect(getCellDisplay({ ...DATABASE_CELL, view: 'table', chart: undefined })).toEqual({
      view: 'table',
      chart: undefined,
    })
  })
})

describe('toQueryModel', () => {
  it('tags a database cell with its row limit and database', () => {
    expect(toQueryModel(DATABASE_CELL, 'select 3')).toEqual({
      _tag: 'database',
      uncheckedSql: 'select 3',
      database_identifier: 'replica-1',
      rowLimit: 50,
    })
  })

  it('tags a log cell with its time range and no row limit', () => {
    expect(toQueryModel(LOG_CELL, 'select 4')).toEqual({
      _tag: 'logs',
      uncheckedSql: 'select 4',
      time_range: LOG_CELL.time_range,
    })
  })
})

import { untrustedSql } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import {
  changeAssistantQuerySource,
  createAssistantQueryModel,
  getAssistantQueryDisplay,
  setAssistantQuerySql,
  toAssistantQueryResult,
} from './AssistantQueryCell.utils'
import { DEFAULT_CELL_ROW_LIMIT } from '@/components/interfaces/Explorer/QueryCell/QueryCell.utils'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'

describe('getAssistantQueryDisplay', () => {
  it('defaults to a table view with no chart when axes are missing', () => {
    expect(getAssistantQueryDisplay({})).toEqual({ view: 'table', chart: undefined })
  })

  it('builds a bar chart config from axis hints', () => {
    expect(getAssistantQueryDisplay({ view: 'chart', xAxis: 'day', yAxis: 'signups' })).toEqual({
      view: 'chart',
      chart: {
        type: 'bar',
        x_column: 'day',
        y_series: ['signups'],
        cumulative: false,
        scale: 'linear',
        show_labels: false,
      },
    })
  })

  it('keeps an empty y-axis list when only the x-axis is provided', () => {
    expect(getAssistantQueryDisplay({ xAxis: 'day' }).chart?.y_series).toEqual([])
  })
})

describe('toAssistantQueryResult', () => {
  it('returns undefined when the output is not an array of row objects', () => {
    expect(toAssistantQueryResult(undefined)).toBeUndefined()
    expect(toAssistantQueryResult('error')).toBeUndefined()
    expect(toAssistantQueryResult({ rows: [] })).toBeUndefined()
  })

  it('keeps row objects and drops primitives, arrays, and nulls', () => {
    expect(toAssistantQueryResult([{ id: 1 }, null, ['x'], 4, { id: 2 }])).toEqual({
      rows: [{ id: 1 }, { id: 2 }],
    })
  })

  it('accepts an empty array as a successful empty result', () => {
    expect(toAssistantQueryResult([])).toEqual({ rows: [] })
  })
})

describe('assistant query model', () => {
  it('starts as a database query with the notebook default row limit', () => {
    expect(createAssistantQueryModel('select 1')).toEqual({
      _tag: 'database',
      uncheckedSql: untrustedSql('select 1'),
      rowLimit: DEFAULT_CELL_ROW_LIMIT,
    })
  })

  it('rebrands the live SQL for the current backend', () => {
    const database = createAssistantQueryModel('select 1')
    expect(setAssistantQuerySql(database, 'select 2').uncheckedSql).toBe(untrustedSql('select 2'))

    const logs = changeAssistantQuerySource(database, {
      _tag: 'logs',
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
    })
    expect(logs._tag).toBe('logs')
    expect(setAssistantQuerySql(logs, 'select 3').uncheckedSql).toBe(untrustedLogSql('select 3'))
  })

  it('carries the SQL across a source change and restores the default row limit onto logs → database', () => {
    const logs = changeAssistantQuerySource(createAssistantQueryModel('select 1'), {
      _tag: 'logs',
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
    })
    const database = changeAssistantQuerySource(logs, { _tag: 'database' })

    expect(database).toEqual({
      _tag: 'database',
      uncheckedSql: untrustedSql('select 1'),
      rowLimit: DEFAULT_CELL_ROW_LIMIT,
    })
  })
})

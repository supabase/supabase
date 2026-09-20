import { describe, expect, it } from 'vitest'

import {
  createDefaultSourceBinding,
  getQuerySource,
  getQuerySourceBinding,
  QUERY_SOURCES,
  querySourceBindingSchema,
  toQuerySourceBinding,
} from './query-source-registry'
import { timeRangeSchema } from '@/data/content/notebooks/notebook-schema'

describe('query source registry', () => {
  it('registers database and logs sources with their execution endpoints', () => {
    expect(QUERY_SOURCES.map(({ _tag }) => _tag)).toEqual(['database', 'logs'])
    expect(getQuerySource('database').endpoint).toBe('/platform/pg-meta/{ref}/query')
    expect(getQuerySource('logs').endpoint).toBe(
      '/platform/projects/{ref}/analytics/endpoints/logs.all.otel'
    )
  })

  it('creates independent, valid default bindings', () => {
    const first = createDefaultSourceBinding('logs')
    const second = createDefaultSourceBinding('logs')

    expect(querySourceBindingSchema.parse(first)).toEqual({
      _tag: 'logs',
      time_range: { _tag: 'relative_time_range', amount: 1, unit: 'hour' },
    })
    expect(first.time_range).not.toBe(second.time_range)
    expect(querySourceBindingSchema.parse(createDefaultSourceBinding('database'))).toEqual({
      _tag: 'database',
    })
  })

  it('rejects parameters that do not match the selected source', () => {
    expect(() =>
      querySourceBindingSchema.parse({ _tag: 'logs', database_identifier: 'replica-1' })
    ).toThrow()

    expect(() =>
      querySourceBindingSchema.parse({
        _tag: 'database',
        time_range: { _tag: 'relative_time_range', amount: 1, unit: 'hour' },
      })
    ).toThrow()

    expect(() =>
      querySourceBindingSchema.parse({
        _tag: 'logs',
        time_range: { _tag: 'relative_time_range', amount: 2, unit: 'fortnight' },
      })
    ).toThrow()
  })
})

describe('getQuerySourceBinding', () => {
  it('projects a database cell onto its binding', () => {
    expect(
      getQuerySourceBinding({ _tag: 'database_cell', database_identifier: 'replica-1' })
    ).toEqual({ _tag: 'database', database_identifier: 'replica-1' })
  })

  it('projects a log cell onto its binding', () => {
    expect(
      getQuerySourceBinding({
        _tag: 'log_cell',
        time_range: { _tag: 'relative_time_range', unit: 'day', amount: 3 },
      })
    ).toEqual({ _tag: 'logs', time_range: { _tag: 'relative_time_range', unit: 'day', amount: 3 } })
  })

  it('copies the time range rather than aliasing the cell it came from', () => {
    const time_range = { _tag: 'relative_time_range', unit: 'hour', amount: 6 } as const
    const binding = getQuerySourceBinding({ _tag: 'log_cell', time_range })

    expect(binding).toEqual({ _tag: 'logs', time_range })
    if (binding._tag !== 'logs') throw new Error('expected a logs binding')
    expect(binding.time_range).not.toBe(time_range)
  })

  it('accepts the coarser relative units the wire schema allows', () => {
    expect(
      getQuerySourceBinding({
        _tag: 'log_cell',
        time_range: { _tag: 'relative_time_range', unit: 'month', amount: 2 },
      })
    ).toEqual({
      _tag: 'logs',
      time_range: { _tag: 'relative_time_range', unit: 'month', amount: 2 },
    })
  })
})

describe('toQuerySourceBinding', () => {
  it('projects a backend-tagged carrier such as a query draft', () => {
    expect(toQuerySourceBinding({ _tag: 'database', database_identifier: 'replica-1' })).toEqual({
      _tag: 'database',
      database_identifier: 'replica-1',
    })

    const time_range = timeRangeSchema.parse({
      _tag: 'absolute_time_range',
      start: '2025-01-01T00:00:00.000Z',
      end: '2025-01-02T00:00:00.000Z',
    })
    expect(toQuerySourceBinding({ _tag: 'logs', time_range })).toEqual({ _tag: 'logs', time_range })
  })
})

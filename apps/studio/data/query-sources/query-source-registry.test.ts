import { describe, expect, it } from 'vitest'

import {
  cellSourceSchema,
  createDefaultCellSource,
  getQuerySource,
  QUERY_SOURCES,
} from './query-source-registry'

describe('query source registry', () => {
  it('registers database and logs sources with their execution endpoints', () => {
    expect(QUERY_SOURCES.map(({ id }) => id)).toEqual(['database', 'logs'])
    expect(getQuerySource('database').endpoint).toBe('/platform/pg-meta/{ref}/query')
    expect(getQuerySource('logs').endpoint).toBe(
      '/platform/projects/{ref}/analytics/endpoints/logs.all.otel'
    )
  })

  it('creates independent, valid default cell bindings', () => {
    const first = createDefaultCellSource('logs')
    const second = createDefaultCellSource('logs')

    expect(cellSourceSchema.parse(first)).toEqual({
      id: 'logs',
      type: 'logs',
      parameters: {
        time_range: { _tag: 'relative_time_range', amount: 1, unit: 'hour' },
      },
    })
    expect(first.parameters.time_range).not.toBe(second.parameters.time_range)
    expect(cellSourceSchema.parse(createDefaultCellSource('database'))).toEqual({
      id: 'database',
      type: 'database',
      parameters: {},
    })
  })

  it('rejects parameters that do not match the selected source type', () => {
    expect(() =>
      cellSourceSchema.parse({
        id: 'logs',
        type: 'logs',
        parameters: { identifier: 'replica-1' },
      })
    ).toThrow()

    expect(() =>
      cellSourceSchema.parse({
        id: 'database',
        type: 'database',
        parameters: { time_range: { _tag: 'relative_time_range', amount: 1, unit: 'hour' } },
      })
    ).toThrow()

    expect(() =>
      cellSourceSchema.parse({
        id: 'logs',
        type: 'logs',
        parameters: { time_range: { _tag: 'relative_time_range', amount: 2, unit: 'fortnight' } },
      })
    ).toThrow()
  })

  it('refuses a cell source carrying an invalid absolute range', () => {
    expect(() =>
      cellSourceSchema.parse({
        id: 'logs',
        type: 'logs',
        parameters: {
          time_range: {
            _tag: 'absolute_time_range',
            start: '2025-01-02T00:00:00.000Z',
            end: '2025-01-01T00:00:00.000Z',
          },
        },
      })
    ).toThrow()
  })
})

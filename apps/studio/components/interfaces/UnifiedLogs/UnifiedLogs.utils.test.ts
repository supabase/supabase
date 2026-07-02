import { describe, expect, it } from 'vitest'

import { buildUnifiedLogsUrl } from './UnifiedLogs.utils'

describe('buildUnifiedLogsUrl', () => {
  const parse = (url: string) => {
    const [path, query] = url.split('?')
    return { path, params: new URLSearchParams(query) }
  }

  it('targets the project logs route with a log_type filter', () => {
    const { path, params } = parse(buildUnifiedLogsUrl({ projectRef: 'abc', logType: 'postgres' }))
    expect(path).toBe('/project/abc/logs')
    expect(params.get('filter')).toBe('log_type:eq:postgres')
    expect(params.has('date')).toBe(false)
  })

  it('preserves multi-word log types once decoded', () => {
    const { params } = parse(buildUnifiedLogsUrl({ projectRef: 'abc', logType: 'edge function' }))
    expect(params.get('filter')).toBe('log_type:eq:edge function')
  })

  it('adds the date range as an epoch-ms pair when start and end are provided', () => {
    const start = new Date('2026-05-08T00:00:00.000Z')
    const end = new Date('2026-05-08T01:00:00.000Z')
    const { params } = parse(
      buildUnifiedLogsUrl({ projectRef: 'abc', logType: 'auth', start, end })
    )
    expect(params.get('date')).toBe(`${start.valueOf()}-${end.valueOf()}`)
  })

  it('accepts ISO strings for the date range', () => {
    const start = '2026-05-08T00:00:00.000Z'
    const end = '2026-05-08T01:00:00.000Z'
    const { params } = parse(
      buildUnifiedLogsUrl({ projectRef: 'abc', logType: 'auth', start, end })
    )
    expect(params.get('date')).toBe(`${new Date(start).valueOf()}-${new Date(end).valueOf()}`)
  })

  it('omits the date range when only one bound is provided', () => {
    const { params } = parse(
      buildUnifiedLogsUrl({ projectRef: 'abc', logType: 'storage', start: new Date() })
    )
    expect(params.has('date')).toBe(false)
  })
})

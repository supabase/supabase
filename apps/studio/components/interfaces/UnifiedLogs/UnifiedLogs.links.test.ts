import { describe, expect, it } from 'vitest'

import { getUserLogsHref, getUserLogsRange, getUserLogsSearch } from './UnifiedLogs.links'

const NOW = Date.parse('2026-01-02T10:00:00.000Z')
const USER_ID = '6f1c1a8e-4a0b-4c1e-9b1e-2f3a4b5c6d7e'

describe('user logs links', () => {
  it('covers the last 24 hours', () => {
    const [start, end] = getUserLogsRange(NOW)
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000)
    expect(end.getTime()).toBe(NOW)
  })

  it('builds a list search with defaults and no url-only params', () => {
    const range = getUserLogsRange(NOW)
    const search = getUserLogsSearch({ userId: USER_ID, range })
    expect(search.user).toBe(USER_ID)
    expect(search.date?.map((d) => d.getTime())).toEqual(range.map((d) => d.getTime()))
    expect(search.show_connection_logs).toBe(true)
    expect(search).not.toHaveProperty('live')
    expect(search).not.toHaveProperty('uuid')
  })

  it('links to the logs page, optionally opening a log', () => {
    const range = getUserLogsRange(NOW)
    const href = getUserLogsHref({ projectRef: 'ref', userId: USER_ID, range })
    expect(href.startsWith('/project/ref/logs?')).toBe(true)
    const params = new URL(href, 'https://x').searchParams
    expect(params.get('user')).toBe(USER_ID)
    expect(params.get('date')).toBe(`${range[0].getTime()}-${range[1].getTime()}`)
    expect(params.has('id')).toBe(false)

    const withLog = getUserLogsHref({ projectRef: 'ref', userId: USER_ID, range, logId: 'log-1' })
    expect(new URL(withLog, 'https://x').searchParams.get('id')).toBe('log-1')
  })
})

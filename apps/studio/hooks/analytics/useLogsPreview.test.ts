import { describe, expect, it } from 'vitest'

import { mergeOtelPageAttributes } from './useLogsPreview'
import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'

const row = (id: string, timestamp: number): LogData => ({
  id,
  timestamp,
  event_message: `message ${id}`,
})

describe('mergeOtelPageAttributes', () => {
  it('merges attribute columns onto the matching row', () => {
    const merged = mergeOtelPageAttributes(
      [row('a', 1_000), row('b', 2_000)],
      [
        { id: 'a', method: 'GET', path: '/rest/v1/todos' },
        { id: 'b', method: 'POST', path: '/auth/v1/token' },
      ]
    )

    expect(merged[0]).toMatchObject({ id: 'a', method: 'GET', path: '/rest/v1/todos' })
    expect(merged[1]).toMatchObject({ id: 'b', method: 'POST', path: '/auth/v1/token' })
  })

  // The list query normalizes `timestamp` to microseconds for the renderers and
  // the pagination cursor; the attribute query doesn't select it. A merge that
  // let the second response win here would silently break both.
  it('never overwrites the row timestamp or event_message', () => {
    const [merged] = mergeOtelPageAttributes(
      [row('a', 1_755_000_000_000_000)],
      [{ id: 'a', timestamp: 'clobbered', event_message: 'clobbered', method: 'GET' }]
    )

    expect(merged.timestamp).toBe(1_755_000_000_000_000)
    expect(merged.event_message).toBe('message a')
    expect(merged.method).toBe('GET')
  })

  it('passes through rows the attribute query did not return', () => {
    const merged = mergeOtelPageAttributes(
      [row('a', 1_000), row('b', 2_000)],
      [{ id: 'a', method: 'GET' }]
    )

    expect(merged[0]).toMatchObject({ method: 'GET' })
    expect(merged[1]).toEqual(row('b', 2_000))
  })

  it('returns the rows untouched when hydration produced nothing usable', () => {
    const rows = [row('a', 1_000)]

    expect(mergeOtelPageAttributes(rows, [])).toBe(rows)
    expect(mergeOtelPageAttributes(rows, [{ method: 'GET' }])).toBe(rows)
  })
})

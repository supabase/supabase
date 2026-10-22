import { describe, expect, it } from 'vitest'

import { parseTimeRange, serializeTimeRange } from './Logs.timeRange'

const range: [Date, Date] = [new Date('2026-09-22T02:00:00Z'), new Date('2026-09-22T03:00:00Z')]

describe('serializeTimeRange / parseTimeRange', () => {
  it('round-trips a date range', () => {
    expect(parseTimeRange(serializeTimeRange(range))).toEqual(range)
  })

  it.each([
    undefined,
    null,
    '',
    'invalid',
    '2026-09-22T02:00:00Z',
    'invalid – 2026-09-22T03:00:00Z',
    '2026-09-22T03:00:00Z – 2026-09-22T02:00:00Z',
    '2026-09-22T02:00:00Z – 2026-09-22T03:00:00Z – 2026-09-22T04:00:00Z',
  ])('rejects an invalid or incomplete range: %s', (value) => {
    expect(parseTimeRange(value)).toBeUndefined()
  })
})

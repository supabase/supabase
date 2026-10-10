import { afterEach, describe, expect, it, vi } from 'vitest'

import { getUnifiedLogsPageRange, LIVE_MODE_OVERLAP_MS } from './unified-logs-infinite-query'

const RANGE_START = '2026-09-29T11:00:00.000Z'
const RANGE_END = '2026-09-29T12:00:00.000Z'
const NOW = new Date('2026-09-29T12:30:00.000Z')

const search = { date: [new Date(RANGE_START), new Date(RANGE_END)] } as any
const ms = (iso: string) => new Date(iso).getTime()

describe('getUnifiedLogsPageRange', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses the selected search range for the first page', () => {
    expect(getUnifiedLogsPageRange(search, null, NOW)).toEqual({
      isoTimestampStart: RANGE_START,
      isoTimestampEnd: RANGE_END,
    })
  })

  it('ends a next page at the oldest loaded row, keeping the range start', () => {
    const cursor = ms('2026-09-29T11:40:00.000Z')
    expect(getUnifiedLogsPageRange(search, { cursor, direction: 'next' }, NOW)).toEqual({
      isoTimestampStart: RANGE_START,
      isoTimestampEnd: '2026-09-29T11:40:00.000Z',
    })
  })

  it('falls back to the search range for a next page without a usable cursor', () => {
    for (const cursor of [undefined, null, NaN]) {
      expect(getUnifiedLogsPageRange(search, { cursor, direction: 'next' } as any, NOW)).toEqual({
        isoTimestampStart: RANGE_START,
        isoTimestampEnd: RANGE_END,
      })
    }
  })

  it('starts a live-mode poll just before the newest loaded row and ends it now', () => {
    const cursor = ms('2026-09-29T11:59:30.000Z')
    expect(getUnifiedLogsPageRange(search, { cursor, direction: 'prev' }, NOW)).toEqual({
      isoTimestampStart: new Date(cursor - LIVE_MODE_OVERLAP_MS).toISOString(),
      isoTimestampEnd: NOW.toISOString(),
    })
  })

  it('never starts a live-mode poll before the search range', () => {
    const cursor = ms(RANGE_START) + 1000
    expect(getUnifiedLogsPageRange(search, { cursor, direction: 'prev' }, NOW)).toEqual({
      isoTimestampStart: RANGE_START,
      isoTimestampEnd: NOW.toISOString(),
    })
  })

  it('falls back to the range start for a live-mode poll without a usable cursor', () => {
    for (const cursor of [undefined, null, NaN]) {
      expect(getUnifiedLogsPageRange(search, { cursor, direction: 'prev' } as any, NOW)).toEqual({
        isoTimestampStart: RANGE_START,
        isoTimestampEnd: NOW.toISOString(),
      })
    }
  })

  it('bounds a live-mode poll on the default last-hour range too', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    const cursor = NOW.getTime() - 10_000
    expect(getUnifiedLogsPageRange({} as any, { cursor, direction: 'prev' }, NOW)).toEqual({
      isoTimestampStart: new Date(cursor - LIVE_MODE_OVERLAP_MS).toISOString(),
      isoTimestampEnd: NOW.toISOString(),
    })
  })
})

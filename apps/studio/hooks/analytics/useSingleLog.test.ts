import { describe, expect, it } from 'vitest'

import { resolveSingleLogWindow } from './useSingleLog'

// A single log is looked up by `id`, which is not part of the logs table's sort
// key — the time bound is what stops the query scanning the whole selected
// range, so these bounds are load-bearing for query cost, not just correctness.
describe('resolveSingleLogWindow', () => {
  const searchRange = {
    iso_timestamp_start: '2026-08-01T00:00:00.000Z',
    iso_timestamp_end: '2026-08-08T00:00:00.000Z',
  }

  it('brackets ±1 minute around the row timestamp, ignoring the wider search range', () => {
    const timestampMicros = Date.UTC(2026, 7, 5, 12, 30, 0) * 1000

    expect(resolveSingleLogWindow(timestampMicros, searchRange)).toEqual({
      isoTimestampStart: '2026-08-05T12:29:00.000Z',
      isoTimestampEnd: '2026-08-05T12:31:00.000Z',
    })
  })

  // A deep-linked log (?log=<id>) that isn't in a loaded page has no timestamp
  // client-side, so the previous whole-range behavior has to remain reachable.
  it('falls back to the search range when the timestamp is unknown', () => {
    for (const missing of [undefined, null, NaN]) {
      expect(resolveSingleLogWindow(missing, searchRange)).toEqual({
        isoTimestampStart: searchRange.iso_timestamp_start,
        isoTimestampEnd: searchRange.iso_timestamp_end,
      })
    }
  })

  it('falls back to empty bounds when neither a timestamp nor a range is available', () => {
    expect(resolveSingleLogWindow(undefined, undefined)).toEqual({
      isoTimestampStart: '',
      isoTimestampEnd: '',
    })
  })
})

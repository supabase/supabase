import { expect, it } from 'vitest'

import { logWindowLabel } from './query-source'

it('labels the log window the query runs against', () => {
  expect(logWindowLabel()).toBe('Last 24 hours')
  expect(
    logWindowLabel({
      iso_timestamp_start: '2026-10-23T00:00:00Z',
      iso_timestamp_end: '2026-10-23T06:00:00Z',
    })
  ).toBe('6h window')
  expect(
    logWindowLabel({
      iso_timestamp_start: '2026-10-23T00:00:00Z',
      iso_timestamp_end: '2026-10-23T00:15:00Z',
    })
  ).toBe('15 min window')
})

import { describe, expect, it } from 'vitest'

import {
  getLivePollDelay,
  hasNoNewRows,
  LIVE_POLL_BASE_INTERVAL_MS,
  LIVE_POLL_MAX_INTERVAL_MS,
} from './LiveButton.utils'

describe('getLivePollDelay', () => {
  it('polls at the base interval when the last poll found rows', () => {
    expect(getLivePollDelay(0)).toBe(LIVE_POLL_BASE_INTERVAL_MS)
  })

  it('doubles the delay after each empty poll', () => {
    expect(getLivePollDelay(1)).toBe(20_000)
    expect(getLivePollDelay(2)).toBe(40_000)
  })

  it('caps the delay at the maximum interval', () => {
    expect(getLivePollDelay(3)).toBe(LIVE_POLL_MAX_INTERVAL_MS)
    expect(getLivePollDelay(50)).toBe(LIVE_POLL_MAX_INTERVAL_MS)
  })

  it('falls back to the base interval for negative or invalid counts', () => {
    for (const count of [-1, NaN, Infinity]) {
      expect(getLivePollDelay(count)).toBe(LIVE_POLL_BASE_INTERVAL_MS)
    }
  })

  it('rounds fractional counts down', () => {
    expect(getLivePollDelay(1.9)).toBe(20_000)
  })
})

describe('hasNoNewRows', () => {
  const pollResult = (pages: unknown) => ({ data: { pages } })

  it('is true when the newest page has no rows', () => {
    expect(hasNoNewRows(pollResult([{ data: [] }, { data: [{ id: 'a' }] }]))).toBe(true)
  })

  it('is true when the newest page only re-reads rows already loaded', () => {
    const pages = [
      { data: [{ id: 'b' }, { id: 'a' }] },
      { data: [{ id: 'b' }] },
      { data: [{ id: 'a' }] },
    ]
    expect(hasNoNewRows(pollResult(pages))).toBe(true)
  })

  it('is false when the newest page has a row not loaded yet', () => {
    expect(
      hasNoNewRows(pollResult([{ data: [{ id: 'c' }, { id: 'b' }] }, { data: [{ id: 'b' }] }]))
    ).toBe(false)
    expect(hasNoNewRows(pollResult([{ data: [{ id: 'b' }] }, { data: [] }]))).toBe(false)
  })

  it('is false for missing or malformed results', () => {
    for (const result of [
      undefined,
      null,
      {},
      { data: null },
      pollResult(undefined),
      pollResult([]),
      pollResult([null]),
      pollResult([{ data: 'rows' }]),
      pollResult([{ data: [] }, null]),
      pollResult([{ data: [{ id: 1 }] }, { data: [{ id: 1 }] }]),
    ]) {
      expect(hasNoNewRows(result)).toBe(false)
    }
  })
})

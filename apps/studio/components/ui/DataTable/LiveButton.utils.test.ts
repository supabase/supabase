import { describe, expect, it } from 'vitest'

import {
  getLivePollDelay,
  isEmptyLivePoll,
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

describe('isEmptyLivePoll', () => {
  const pollResult = (pages: unknown) => ({ data: { pages } })

  it('is true when the newest page has no rows', () => {
    expect(isEmptyLivePoll(pollResult([{ data: [] }, { data: [{ id: 'a' }] }]))).toBe(true)
  })

  it('is false when the newest page has rows', () => {
    expect(isEmptyLivePoll(pollResult([{ data: [{ id: 'b' }] }, { data: [] }]))).toBe(false)
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
    ]) {
      expect(isEmptyLivePoll(result)).toBe(false)
    }
  })
})

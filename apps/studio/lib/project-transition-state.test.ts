import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearPersistedTransitionStartTime,
  getPersistedTransitionStartTime,
  getRemainingTransitionTimeMs,
  minutesToMilliseconds,
} from './project-transition-state'

describe('project-transition-state', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  describe('getPersistedTransitionStartTime', () => {
    it('stores the current time when no start time exists', () => {
      const startTime = getPersistedTransitionStartTime('transition-key', 1_000)

      expect(startTime).toBe(1_000)
      expect(window.localStorage.getItem('transition-key')).toBe('1000')
    })

    it('reuses an existing stored start time', () => {
      window.localStorage.setItem('transition-key', '2_000'.replace('_', ''))

      const startTime = getPersistedTransitionStartTime('transition-key', 1_000)

      expect(startTime).toBe(2_000)
      expect(window.localStorage.getItem('transition-key')).toBe('2000')
    })

    it('replaces malformed stored values with the current time', () => {
      window.localStorage.setItem('transition-key', 'not-a-number')

      const startTime = getPersistedTransitionStartTime('transition-key', 3_000)

      expect(startTime).toBe(3_000)
      expect(window.localStorage.getItem('transition-key')).toBe('3000')
    })
  })

  it('removes a persisted transition start time', () => {
    window.localStorage.setItem('transition-key', '1000')

    clearPersistedTransitionStartTime('transition-key')

    expect(window.localStorage.getItem('transition-key')).toBeNull()
  })

  it('returns the remaining threshold time and clamps at zero', () => {
    expect(
      getRemainingTransitionTimeMs({
        startTimeMs: 1_000,
        thresholdMs: minutesToMilliseconds(10),
        now: 4_000,
      })
    ).toBe(minutesToMilliseconds(10) - 3_000)

    expect(
      getRemainingTransitionTimeMs({
        startTimeMs: 1_000,
        thresholdMs: minutesToMilliseconds(10),
        now: minutesToMilliseconds(10) + 5_000,
      })
    ).toBe(0)
  })
})

import { describe, expect, it } from 'vitest'

import { computeVersionFate } from './VersionHistory.utils'

// Each case below mirrors a worked example from the design handoff's
// operator-notation reference matrix (one noncurrent version list per policy
// shape), oldest version at chronoIndex 0.

describe('computeVersionFate', () => {
  it('returns kept when no policy is configured', () => {
    expect(
      computeVersionFate({
        daysOld: 90,
        chronoIndex: 0,
        noncurrentCount: 1,
        expiryDays: null,
        cap: null,
        mode: 'and',
      })
    ).toEqual({ type: 'kept' })
  })

  describe('age only', () => {
    const base = { chronoIndex: 0, noncurrentCount: 3, expiryDays: 30, cap: null, mode: 'and' as const }

    it('gives every version a determined countdown', () => {
      expect(computeVersionFate({ ...base, daysOld: 3 })).toEqual({ type: 'expires-in', days: 27 })
      expect(computeVersionFate({ ...base, daysOld: 28 })).toEqual({ type: 'expires-in', days: 2 })
    })

    it('flips to expiring-now once the window has passed', () => {
      expect(computeVersionFate({ ...base, daysOld: 31 })).toEqual({ type: 'expiring-now' })
    })
  })

  describe('cap only', () => {
    const base = { expiryDays: null, cap: 3, mode: 'and' as const }

    it('keeps everything except the one at the cap boundary', () => {
      expect(
        computeVersionFate({ ...base, daysOld: 3, chronoIndex: 2, noncurrentCount: 3 })
      ).toEqual({ type: 'kept' })
      expect(
        computeVersionFate({ ...base, daysOld: 163, chronoIndex: 1, noncurrentCount: 3 })
      ).toEqual({ type: 'kept' })
      expect(
        computeVersionFate({ ...base, daysOld: 216, chronoIndex: 0, noncurrentCount: 3 })
      ).toEqual({ type: 'expires-on-next-upload' })
    })
  })

  describe('both — AND', () => {
    const base = { expiryDays: 30, cap: 3, mode: 'and' as const }

    it('keeps every version under the cap regardless of age', () => {
      expect(
        computeVersionFate({ ...base, daysOld: 45, chronoIndex: 1, noncurrentCount: 2 })
      ).toEqual({ type: 'kept' })
      expect(
        computeVersionFate({ ...base, daysOld: 70, chronoIndex: 0, noncurrentCount: 2 })
      ).toEqual({ type: 'kept' })
    })

    it('gives a countdown only once the cap is exceeded, since age is then the sole gate', () => {
      expect(
        computeVersionFate({ ...base, daysOld: 12, chronoIndex: 0, noncurrentCount: 4 })
      ).toEqual({ type: 'expires-in', days: 18 })
    })

    it('is expiring-now once both conditions are met', () => {
      expect(
        computeVersionFate({ ...base, daysOld: 34, chronoIndex: 0, noncurrentCount: 4 })
      ).toEqual({ type: 'expiring-now' })
      // Still within the cap: kept even though very old — AND needs both.
      expect(
        computeVersionFate({ ...base, daysOld: 28, chronoIndex: 1, noncurrentCount: 4 })
      ).toEqual({ type: 'kept' })
    })
  })

  describe('either — OR', () => {
    const base = { expiryDays: 30, cap: 3, mode: 'or' as const }

    it('lets age alone trigger removal, even well under the cap', () => {
      expect(
        computeVersionFate({ ...base, daysOld: 12, chronoIndex: 1, noncurrentCount: 2 })
      ).toEqual({ type: 'expires-in', days: 18 })
      expect(
        computeVersionFate({ ...base, daysOld: 34, chronoIndex: 0, noncurrentCount: 2 })
      ).toEqual({ type: 'expiring-now' })
    })

    it('lets the cap alone trigger removal, even for a young version', () => {
      expect(
        computeVersionFate({ ...base, daysOld: 1, chronoIndex: 3, noncurrentCount: 4 })
      ).toEqual({ type: 'expires-in', days: 29 })
      expect(
        computeVersionFate({ ...base, daysOld: 3, chronoIndex: 2, noncurrentCount: 4 })
      ).toEqual({ type: 'expires-in', days: 27 })
      expect(
        computeVersionFate({ ...base, daysOld: 6, chronoIndex: 1, noncurrentCount: 4 })
      ).toEqual({ type: 'expires-on-next-upload' })
      expect(
        computeVersionFate({ ...base, daysOld: 9, chronoIndex: 0, noncurrentCount: 4 })
      ).toEqual({ type: 'expiring-now' })
    })
  })
})

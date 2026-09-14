import { describe, expect, it } from 'vitest'

import {
  getRetentionTightening,
  RETENTION_TIGHTENING_DESCRIPTION,
  toNullableNumber,
} from './BucketVersioningFields.utils'

const params = (overrides: Partial<Parameters<typeof getRetentionTightening>[0]> = {}) => ({
  initialVersioningState: 'enabled' as const,
  isVersioningEnabled: true,
  initialRetentionDays: 30,
  initialMaxVersions: 10,
  nextRetentionDays: 30,
  nextMaxVersions: 10,
  ...overrides,
})

describe('getRetentionTightening', () => {
  it('reports no tightening when nothing changed', () => {
    expect(getRetentionTightening(params())).toBe('none')
  })

  it('detects a shorter retention window', () => {
    expect(getRetentionTightening(params({ nextRetentionDays: 7 }))).toBe('days')
  })

  it('detects a lower version cap', () => {
    expect(getRetentionTightening(params({ nextMaxVersions: 3 }))).toBe('versions')
  })

  it('detects both bounds tightening at once', () => {
    expect(getRetentionTightening(params({ nextRetentionDays: 7, nextMaxVersions: 3 }))).toBe(
      'both'
    )
  })

  it('does not warn when a bound is raised', () => {
    expect(getRetentionTightening(params({ nextRetentionDays: 90, nextMaxVersions: 20 }))).toBe(
      'none'
    )
  })

  it('does not warn when a bound is cleared, which retains more rather than less', () => {
    expect(getRetentionTightening(params({ nextRetentionDays: null, nextMaxVersions: null }))).toBe(
      'none'
    )
  })

  it('does not warn when a bound is newly added where none existed', () => {
    expect(
      getRetentionTightening(params({ initialRetentionDays: null, nextRetentionDays: 7 }))
    ).toBe('none')
  })

  it('does not warn while the initial bounds are still loading', () => {
    expect(
      getRetentionTightening(
        params({ initialRetentionDays: undefined, initialMaxVersions: undefined })
      )
    ).toBe('none')
  })

  it('does not warn when versioning is being turned off', () => {
    // Suspending stops new versions from being created but never expires the
    // ones already retained, so there is nothing to lose.
    expect(
      getRetentionTightening(params({ isVersioningEnabled: false, nextRetentionDays: 7 }))
    ).toBe('none')
  })

  it('does not warn when versioning is being enabled for the first time', () => {
    expect(
      getRetentionTightening(
        params({
          initialVersioningState: 'disabled',
          initialRetentionDays: null,
          initialMaxVersions: null,
          nextRetentionDays: 7,
        })
      )
    ).toBe('none')
  })

  it('does not warn when re-enabling a suspended bucket', () => {
    // A suspended bucket can be retaining versions, but its stored bounds are
    // cleared while suspended, so there is no previous value to tighten from.
    expect(
      getRetentionTightening(params({ initialVersioningState: 'suspended', nextRetentionDays: 7 }))
    ).toBe('none')
  })

  it('has a description for every tightening kind it can report', () => {
    for (const kind of ['days', 'versions', 'both'] as const) {
      expect(RETENTION_TIGHTENING_DESCRIPTION[kind], kind).toBeTruthy()
    }
  })
})

describe('toNullableNumber', () => {
  it('maps the empty sentinel to null', () => {
    expect(toNullableNumber('')).toBeNull()
  })

  it('preserves zero rather than treating it as empty', () => {
    expect(toNullableNumber(0)).toBe(0)
  })

  it('passes numbers through', () => {
    expect(toNullableNumber(30)).toBe(30)
  })
})

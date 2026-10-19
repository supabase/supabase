import { describe, expect, it } from 'vitest'

import {
  appVersionAtLeast,
  compareAppVersions,
  isOrioleDbVersionAtLeast,
  parseAppVersionKey,
} from './useSelectedProject.utils'

describe('parseAppVersionKey', () => {
  it('parses a dbVersion string into a version key', () => {
    expect(parseAppVersionKey('supabase-postgres-17.9.9.999-orioledb')).toEqual([17, 9, 9, 999])
  })

  it('parses dbVersion strings with an arch prefix', () => {
    expect(parseAppVersionKey('supabase-postgres-arm64-17.9.0.019')).toEqual([17, 9, 0, 19])
    expect(parseAppVersionKey('supabase-postgres-x86_64-17.9.0.019')).toEqual([17, 9, 0, 19])
  })

  it('returns null for non-conforming strings', () => {
    expect(parseAppVersionKey('CUSTOM_AMI_SENTINEL')).toBeNull()
    expect(parseAppVersionKey('not-a-version')).toBeNull()
  })

  it('returns null for null or undefined input', () => {
    expect(parseAppVersionKey(null)).toBeNull()
    expect(parseAppVersionKey(undefined)).toBeNull()
  })
})

describe('compareAppVersions', () => {
  it('returns a negative number when a is older than b', () => {
    expect(
      compareAppVersions('supabase-postgres-17.8.9.999', 'supabase-postgres-17.9.0.019')
    ).toBeLessThan(0)
  })

  it('returns zero when versions are equal', () => {
    expect(compareAppVersions('supabase-postgres-17.9.0.019', 'supabase-postgres-17.9.0.019')).toBe(
      0
    )
  })

  it('returns a positive number when a is newer than b', () => {
    expect(
      compareAppVersions('supabase-postgres-17.11.0.001', 'supabase-postgres-17.9.0.019')
    ).toBeGreaterThan(0)
  })

  it('compares numerically rather than by segment digit-width', () => {
    // Regression case for the digit-concatenation bug in lib/helpers.ts'
    // getSemanticVersion, where '15.1.1.2' (-> '15112') compares as less than
    // '14.1.0.44' (-> '141044') despite being the newer version.
    expect(
      compareAppVersions('supabase-postgres-15.1.1.2', 'supabase-postgres-14.1.0.44')
    ).toBeGreaterThan(0)
  })

  it('throws on unparseable input', () => {
    expect(() => compareAppVersions('not-a-version', 'supabase-postgres-17.9.0.019')).toThrow()
    expect(() => compareAppVersions('supabase-postgres-17.9.0.019', 'not-a-version')).toThrow()
  })
})

describe('appVersionAtLeast', () => {
  it('returns true when the version is above or equal to the threshold', () => {
    expect(appVersionAtLeast('supabase-postgres-17.9.9.999', 'supabase-postgres-17.9.0.019')).toBe(
      true
    )
    expect(appVersionAtLeast('supabase-postgres-17.9.0.019', 'supabase-postgres-17.9.0.019')).toBe(
      true
    )
  })

  it('returns false when the version is below the threshold', () => {
    expect(appVersionAtLeast('supabase-postgres-17.8.9.999', 'supabase-postgres-17.9.0.019')).toBe(
      false
    )
  })

  it('returns false for an unparseable version instead of throwing', () => {
    expect(appVersionAtLeast('not-a-version', 'supabase-postgres-17.9.0.019')).toBe(false)
  })
})

describe('isOrioleDbVersionAtLeast', () => {
  it('returns true when the engine version is above the threshold', () => {
    expect(
      isOrioleDbVersionAtLeast(
        'supabase-postgres-17.11.0.002-orioledb',
        'supabase-postgres-17.11.0.001-orioledb'
      )
    ).toBe(true)
    expect(
      isOrioleDbVersionAtLeast(
        'supabase-postgres-17.12.0.001-orioledb',
        'supabase-postgres-17.11.0.001-orioledb'
      )
    ).toBe(true)
  })

  it('returns true when the engine version equals the threshold', () => {
    expect(
      isOrioleDbVersionAtLeast(
        'supabase-postgres-17.11.0.001-orioledb',
        'supabase-postgres-17.11.0.001-orioledb'
      )
    ).toBe(true)
  })

  it('returns false when the engine version is below the threshold', () => {
    expect(
      isOrioleDbVersionAtLeast(
        'supabase-postgres-17.10.9.999-orioledb',
        'supabase-postgres-17.11.0.001-orioledb'
      )
    ).toBe(false)
    // wal-g (scheduled backup) support landed at 17.9.0.019, which is still
    // below the Public Beta cutoff — these projects remain alpha.
    expect(
      isOrioleDbVersionAtLeast(
        'supabase-postgres-17.9.0.019-orioledb',
        'supabase-postgres-17.11.0.001-orioledb'
      )
    ).toBe(false)
  })

  it('returns false for a non-OrioleDB dbVersion', () => {
    expect(
      isOrioleDbVersionAtLeast(
        'supabase-postgres-17.11.0.001',
        'supabase-postgres-17.11.0.001-orioledb'
      )
    ).toBe(false)
  })

  it('returns false for undefined dbVersion', () => {
    expect(isOrioleDbVersionAtLeast(undefined, 'supabase-postgres-17.11.0.001-orioledb')).toBe(
      false
    )
  })

  it('returns false for a non-OrioleDB threshold', () => {
    expect(
      isOrioleDbVersionAtLeast(
        'supabase-postgres-17.11.0.001-orioledb',
        'supabase-postgres-17.11.0.001'
      )
    ).toBe(false)
  })
})

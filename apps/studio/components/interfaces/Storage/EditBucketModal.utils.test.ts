import { describe, expect, it } from 'vitest'

import {
  getNextVersioningState,
  getVersioningFormDefaults,
  isSuspendingVersioning,
  type BucketVersioningSettings,
} from './EditBucketModal.utils'
import { PROJECT_VERSIONING_DEFAULTS } from './StorageVersioning.constants'

const settings = (overrides: Partial<BucketVersioningSettings> = {}): BucketVersioningSettings => ({
  versioning: 'disabled',
  versionExpiryDays: null,
  maxNoncurrentVersions: null,
  expirationMode: 'and',
  ...overrides,
})

describe('getVersioningFormDefaults', () => {
  it('prefills the project defaults for a bucket that has never been versioned', () => {
    expect(getVersioningFormDefaults(settings())).toEqual({
      enable_versioning: false,
      version_expiry_days: PROJECT_VERSIONING_DEFAULTS.versionExpiryDays,
      max_noncurrent_versions: PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions,
      expiration_mode: 'and',
    })
  })

  it('ignores any stray stored policy on a never-versioned bucket', () => {
    // Defense in depth: a bucket reporting `disabled` should not surface policy
    // numbers the user never set, whatever the API happens to return alongside.
    const defaults = getVersioningFormDefaults(
      settings({ versionExpiryDays: 1, maxNoncurrentVersions: 1 })
    )
    expect(defaults.version_expiry_days).toBe(PROJECT_VERSIONING_DEFAULTS.versionExpiryDays)
    expect(defaults.max_noncurrent_versions).toBe(PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions)
  })

  it('shows the stored policy for an actively versioned bucket', () => {
    expect(
      getVersioningFormDefaults(
        settings({
          versioning: 'enabled',
          versionExpiryDays: 60,
          maxNoncurrentVersions: 5,
          expirationMode: 'or',
        })
      )
    ).toEqual({
      enable_versioning: true,
      version_expiry_days: 60,
      max_noncurrent_versions: 5,
      expiration_mode: 'or',
    })
  })

  it('leaves an unset condition unset rather than filling in a default', () => {
    // Prefilling here would silently add a bound the user never chose, which on
    // save could expire versions they expected to keep.
    const defaults = getVersioningFormDefaults(
      settings({ versioning: 'enabled', versionExpiryDays: 60, maxNoncurrentVersions: null })
    )
    expect(defaults.version_expiry_days).toBe(60)
    expect(defaults.max_noncurrent_versions).toBe('')
  })

  it('shows a suspended bucket with the switch off but its policy intact', () => {
    const defaults = getVersioningFormDefaults(
      settings({ versioning: 'suspended', versionExpiryDays: 14, maxNoncurrentVersions: 3 })
    )
    expect(defaults.enable_versioning).toBe(false)
    expect(defaults.version_expiry_days).toBe(14)
    expect(defaults.max_noncurrent_versions).toBe(3)
  })
})

describe('getNextVersioningState', () => {
  it('enables versioning from any starting state', () => {
    expect(getNextVersioningState('disabled', true)).toBe('enabled')
    expect(getNextVersioningState('suspended', true)).toBe('enabled')
    expect(getNextVersioningState('enabled', true)).toBe('enabled')
  })

  it('suspends rather than disables a bucket that has been versioned', () => {
    // S3 has no path back to `disabled` — retained versions outlive the toggle.
    expect(getNextVersioningState('enabled', false)).toBe('suspended')
  })

  it('keeps an already-suspended bucket suspended', () => {
    expect(getNextVersioningState('suspended', false)).toBe('suspended')
  })

  it('leaves a never-versioned bucket disabled', () => {
    expect(getNextVersioningState('disabled', false)).toBe('disabled')
  })
})

describe('isSuspendingVersioning', () => {
  it('is true only when an actively versioning bucket is being turned off', () => {
    expect(isSuspendingVersioning('enabled', false)).toBe(true)
  })

  it('is false when versioning stays on', () => {
    expect(isSuspendingVersioning('enabled', true)).toBe(false)
  })

  it('is false for an already-suspended bucket, which has nothing left to stop', () => {
    expect(isSuspendingVersioning('suspended', false)).toBe(false)
  })

  it('is false for a bucket that was never versioned', () => {
    expect(isSuspendingVersioning('disabled', false)).toBe(false)
  })
})

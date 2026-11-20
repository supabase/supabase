import { describe, expect, it } from 'vitest'

import {
  getBucketVersioningState,
  hasVersioningHistory,
  isVersioningActive,
  willRetainVersionOnWrite,
} from './StorageVersioning.constants'
import type { Bucket } from '@/data/storage/buckets-query'

const bucket = (versioning_status?: Bucket['versioning_status']) =>
  ({ id: 'bucket', name: 'bucket', versioning_status }) as Bucket

describe('getBucketVersioningState', () => {
  it('maps the API statuses', () => {
    expect(getBucketVersioningState(bucket('ENABLED'))).toBe('enabled')
    expect(getBucketVersioningState(bucket('SUSPENDED'))).toBe('suspended')
    expect(getBucketVersioningState(bucket('DISABLED'))).toBe('disabled')
  })

  it('treats a bucket that never reported a status as disabled', () => {
    expect(getBucketVersioningState(bucket(undefined))).toBe('disabled')
    expect(getBucketVersioningState(undefined)).toBe('disabled')
  })
})

describe('isVersioningActive', () => {
  it('only lets an enabled bucket soft-delete', () => {
    expect(isVersioningActive(bucket('ENABLED'))).toBe(true)
    expect(isVersioningActive(bucket('SUSPENDED'))).toBe(false)
    expect(isVersioningActive(bucket('DISABLED'))).toBe(false)
    expect(isVersioningActive(undefined)).toBe(false)
  })
})

describe('hasVersioningHistory', () => {
  it('keeps a suspended bucket in, since it can still be retaining versions', () => {
    expect(hasVersioningHistory(bucket('ENABLED'))).toBe(true)
    expect(hasVersioningHistory(bucket('SUSPENDED'))).toBe(true)
    expect(hasVersioningHistory(bucket('DISABLED'))).toBe(false)
    expect(hasVersioningHistory(undefined)).toBe(false)
  })
})

describe('willRetainVersionOnWrite', () => {
  it('always retains on an enabled bucket, whatever the object reports', () => {
    expect(willRetainVersionOnWrite({ versioningState: 'enabled', isObjectVersioned: true })).toBe(
      true
    )
    expect(willRetainVersionOnWrite({ versioningState: 'enabled', isObjectVersioned: false })).toBe(
      true
    )
    expect(
      willRetainVersionOnWrite({ versioningState: 'enabled', isObjectVersioned: undefined })
    ).toBe(true)
  })

  it('retains on a suspended bucket only for an object that predates the suspension', () => {
    expect(
      willRetainVersionOnWrite({ versioningState: 'suspended', isObjectVersioned: true })
    ).toBe(true)
    expect(
      willRetainVersionOnWrite({ versioningState: 'suspended', isObjectVersioned: false })
    ).toBe(false)
  })

  it('falls back to no retention when the listing omits the field', () => {
    // An older storage build may not send `is_versioned`; "replace in place" is the safe read.
    expect(
      willRetainVersionOnWrite({ versioningState: 'suspended', isObjectVersioned: undefined })
    ).toBe(false)
    expect(
      willRetainVersionOnWrite({ versioningState: 'suspended', isObjectVersioned: null })
    ).toBe(false)
  })

  it('never retains on a disabled bucket', () => {
    expect(willRetainVersionOnWrite({ versioningState: 'disabled', isObjectVersioned: true })).toBe(
      false
    )
    expect(
      willRetainVersionOnWrite({ versioningState: 'disabled', isObjectVersioned: false })
    ).toBe(false)
  })
})

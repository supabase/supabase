import { expectTypeOf, it } from 'vitest'
import type { Database } from '../database/adapter'
import type { normalizeLifecycleConfiguration } from '../lifecycle/configuration'
import type { Storage } from '../storage'
import {
  type BucketLifecycleConfiguration,
  type LifecycleRule,
  type NoncurrentVersionExpiration,
} from './lifecycle'

it('requires expiration and filter in normalized rules', () => {
  expectTypeOf<
    LifecycleRule['noncurrentVersionExpiration']
  >().toEqualTypeOf<NoncurrentVersionExpiration>()
  expectTypeOf<{ status: 'Enabled'; filter: {} }>().not.toExtend<LifecycleRule>()
  expectTypeOf<{
    status: 'Enabled'
    noncurrentVersionExpiration: NoncurrentVersionExpiration
  }>().not.toExtend<LifecycleRule>()
  expectTypeOf<{
    status: 'Enabled'
    legacyPrefix: ''
    noncurrentVersionExpiration: NoncurrentVersionExpiration
  }>().not.toExtend<LifecycleRule>()
})

it('requires normalized configuration at the write boundaries', () => {
  expectTypeOf<
    ReturnType<typeof normalizeLifecycleConfiguration>
  >().toEqualTypeOf<BucketLifecycleConfiguration>()
  expectTypeOf<
    Parameters<Database['putLifecycleConfiguration']>[1]
  >().toEqualTypeOf<BucketLifecycleConfiguration>()
  expectTypeOf<
    Parameters<Storage['putBucketLifecycle']>[1]
  >().toEqualTypeOf<BucketLifecycleConfiguration>()
})

it('returns normalized configuration at the read boundaries', () => {
  expectTypeOf<
    Awaited<ReturnType<Database['findLifecycleBucket']>>['lifecycle_configuration']
  >().toEqualTypeOf<BucketLifecycleConfiguration | null>()
  expectTypeOf<
    Awaited<ReturnType<Storage['getBucketLifecycle']>>
  >().toEqualTypeOf<BucketLifecycleConfiguration | null>()
})

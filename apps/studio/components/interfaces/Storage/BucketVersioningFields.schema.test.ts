import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  bucketVersioningFormFields,
  S3_MAX_NONCURRENT_VERSIONS,
  superRefineBucketVersioning,
  type BucketVersioningFormValues,
} from './BucketVersioningFields.schema'

const values = (
  overrides: Partial<BucketVersioningFormValues> = {}
): BucketVersioningFormValues => ({
  enable_versioning: true,
  version_expiry_days: 30,
  max_noncurrent_versions: 10,
  expiration_mode: 'and',
  ...overrides,
})

/** Runs the refine in isolation and returns the issues it produced. */
const refine = (formValues: BucketVersioningFormValues) => {
  const result = z
    .custom<BucketVersioningFormValues>()
    .superRefine(superRefineBucketVersioning)
    .safeParse(formValues)

  if (result.success) return []
  return result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

describe('superRefineBucketVersioning', () => {
  it('accepts a valid policy', () => {
    expect(refine(values())).toEqual([])
  })

  it('skips validation entirely when versioning is off', () => {
    // Out-of-range values are irrelevant while the fields are hidden, so stale
    // numbers must not block an unrelated bucket-settings save.
    expect(refine(values({ enable_versioning: false, version_expiry_days: -5 }))).toEqual([])
  })

  it('treats empty values as "no condition set" rather than zero', () => {
    expect(refine(values({ version_expiry_days: '', max_noncurrent_versions: '' }))).toEqual([])
  })

  it('rejects a retention window below one day', () => {
    expect(refine(values({ version_expiry_days: 0 })).map((i) => i.path)).toEqual([
      'version_expiry_days',
    ])
  })

  it('rejects a version cap with no expiration age, which S3 will not accept', () => {
    const issues = refine(values({ version_expiry_days: '', max_noncurrent_versions: 10 }))
    expect(issues).toHaveLength(1)
    expect(issues[0].path).toBe('max_noncurrent_versions')
    expect(issues[0].message).toMatch(/expiration age/i)
  })

  it('rejects a version cap below one', () => {
    expect(refine(values({ max_noncurrent_versions: 0 })).map((i) => i.path)).toEqual([
      'max_noncurrent_versions',
    ])
  })

  it('rejects exceeding the S3 ceiling of 100 versions', () => {
    const issues = refine(values({ max_noncurrent_versions: S3_MAX_NONCURRENT_VERSIONS + 1 }))
    expect(issues).toHaveLength(1)
    expect(issues[0].message).toContain(String(S3_MAX_NONCURRENT_VERSIONS))
  })

  it('accepts exactly the S3 ceiling', () => {
    expect(refine(values({ max_noncurrent_versions: S3_MAX_NONCURRENT_VERSIONS }))).toEqual([])
  })

  it('reports both fields independently', () => {
    const issues = refine(values({ version_expiry_days: 0, max_noncurrent_versions: 0 }))
    expect(issues.map((i) => i.path).sort()).toEqual([
      'max_noncurrent_versions',
      'version_expiry_days',
    ])
  })
})

describe('bucketVersioningFormFields', () => {
  const schema = z.object(bucketVersioningFormFields)

  it('defaults to versioning off with no conditions set', () => {
    expect(schema.parse({})).toEqual({
      enable_versioning: false,
      version_expiry_days: '',
      max_noncurrent_versions: '',
      expiration_mode: 'and',
    })
  })

  it('coerces numeric strings from the input element', () => {
    const parsed = schema.parse({ version_expiry_days: '45', max_noncurrent_versions: '5' })
    expect(parsed.version_expiry_days).toBe(45)
    expect(parsed.max_noncurrent_versions).toBe(5)
  })

  it('preserves the empty sentinel instead of coercing it to zero', () => {
    // `Number('')` is 0, so a bare coercion would turn "no condition" into
    // "expire immediately". The union literal has to win.
    expect(schema.parse({ version_expiry_days: '' }).version_expiry_days).toBe('')
  })

  it('rejects a fractional retention window', () => {
    expect(schema.safeParse({ version_expiry_days: 1.5 }).success).toBe(false)
  })

  it('rejects an unknown expiration mode', () => {
    expect(schema.safeParse({ expiration_mode: 'xor' }).success).toBe(false)
  })
})

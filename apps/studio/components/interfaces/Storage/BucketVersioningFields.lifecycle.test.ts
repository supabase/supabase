import { describe, expect, it } from 'vitest'

import {
  AGE_RULE_ID,
  COUNT_RULE_ID,
  fromLifecycleRules,
  hasLifecyclePolicyChanged,
  toLifecycleRules,
} from './BucketVersioningFields.lifecycle'

const form = {
  enable_versioning: true as const,
  version_expiry_days: 30 as '' | number,
  max_noncurrent_versions: 10 as '' | number,
  expiration_mode: 'and' as const,
}

describe('toLifecycleRules', () => {
  it('sends no rules when neither condition is set', () => {
    expect(
      toLifecycleRules({ ...form, version_expiry_days: '', max_noncurrent_versions: '' })
    ).toEqual([])
  })

  it('sends an age-only rule when no cap is set', () => {
    expect(toLifecycleRules({ ...form, max_noncurrent_versions: '' })).toEqual([
      {
        id: AGE_RULE_ID,
        status: 'Enabled',
        filter: {},
        noncurrent_version_expiration: { noncurrent_days: 30 },
      },
    ])
  })

  it('combines both conditions into one rule for "and"', () => {
    expect(toLifecycleRules(form)).toEqual([
      {
        id: AGE_RULE_ID,
        status: 'Enabled',
        filter: {},
        noncurrent_version_expiration: { noncurrent_days: 30, newer_noncurrent_versions: 10 },
      },
    ])
  })

  it('splits "or" into an age rule and a capped rule at the minimum age', () => {
    const rules = toLifecycleRules({ ...form, expiration_mode: 'or' })

    expect(rules).toHaveLength(2)
    expect(rules[0]).toEqual({
      id: AGE_RULE_ID,
      status: 'Enabled',
      filter: {},
      noncurrent_version_expiration: { noncurrent_days: 30 },
    })
    expect(rules[1]).toEqual({
      id: COUNT_RULE_ID,
      status: 'Enabled',
      filter: {},
      noncurrent_version_expiration: { noncurrent_days: 1, newer_noncurrent_versions: 10 },
    })
  })

  it('drops a cap with no age, which the API cannot express', () => {
    expect(toLifecycleRules({ ...form, version_expiry_days: '' })).toEqual([])
  })
})

describe('fromLifecycleRules', () => {
  it('reports no policy when nothing is stored', () => {
    expect(fromLifecycleRules(null)).toEqual({
      versionExpiryDays: null,
      maxNoncurrentVersions: null,
      expirationMode: 'and',
    })
  })

  it('reads a combined rule back as "and"', () => {
    expect(
      fromLifecycleRules({
        rules: [
          {
            id: AGE_RULE_ID,
            status: 'Enabled',
            filter: {},
            noncurrent_version_expiration: { noncurrent_days: 30, newer_noncurrent_versions: 10 },
          },
        ],
      })
    ).toEqual({ versionExpiryDays: 30, maxNoncurrentVersions: 10, expirationMode: 'and' })
  })

  it('reads the two-rule form back as "or"', () => {
    expect(
      fromLifecycleRules({
        rules: [
          {
            id: AGE_RULE_ID,
            status: 'Enabled',
            filter: {},
            noncurrent_version_expiration: { noncurrent_days: 30 },
          },
          {
            id: COUNT_RULE_ID,
            status: 'Enabled',
            filter: {},
            noncurrent_version_expiration: { noncurrent_days: 1, newer_noncurrent_versions: 10 },
          },
        ],
      })
    ).toEqual({ versionExpiryDays: 30, maxNoncurrentVersions: 10, expirationMode: 'or' })
  })

  it('ignores disabled rules', () => {
    expect(
      fromLifecycleRules({
        rules: [
          {
            id: AGE_RULE_ID,
            status: 'Disabled',
            filter: {},
            noncurrent_version_expiration: { noncurrent_days: 30 },
          },
        ],
      })
    ).toEqual({ versionExpiryDays: null, maxNoncurrentVersions: null, expirationMode: 'and' })
  })

  it('ignores rules with an action it cannot model', () => {
    expect(fromLifecycleRules({ rules: [{ id: 'other', status: 'Enabled', filter: {} }] })).toEqual(
      {
        versionExpiryDays: null,
        maxNoncurrentVersions: null,
        expirationMode: 'and',
      }
    )
  })

  it('round-trips the "and" form', () => {
    expect(fromLifecycleRules({ rules: toLifecycleRules(form) })).toEqual({
      versionExpiryDays: 30,
      maxNoncurrentVersions: 10,
      expirationMode: 'and',
    })
  })

  it('round-trips the "or" form', () => {
    const rules = toLifecycleRules({ ...form, expiration_mode: 'or' })

    expect(fromLifecycleRules({ rules })).toEqual({
      versionExpiryDays: 30,
      maxNoncurrentVersions: 10,
      expirationMode: 'or',
    })
  })
})

describe('hasLifecyclePolicyChanged', () => {
  const stored = {
    versionExpiryDays: 30,
    maxNoncurrentVersions: 10,
    expirationMode: 'and' as const,
  }

  it('is false when nothing moved', () => {
    expect(hasLifecyclePolicyChanged(stored, form)).toBe(false)
  })

  it('is true when the age changed', () => {
    expect(hasLifecyclePolicyChanged(stored, { ...form, version_expiry_days: 60 })).toBe(true)
  })

  it('is true when the cap was cleared', () => {
    expect(hasLifecyclePolicyChanged(stored, { ...form, max_noncurrent_versions: '' })).toBe(true)
  })

  it('is true when the mode changed and both conditions are set', () => {
    expect(hasLifecyclePolicyChanged(stored, { ...form, expiration_mode: 'or' })).toBe(true)
  })

  it('ignores the mode when only one condition is set', () => {
    const ageOnly = {
      versionExpiryDays: 30,
      maxNoncurrentVersions: null,
      expirationMode: 'and' as const,
    }

    expect(
      hasLifecyclePolicyChanged(ageOnly, {
        ...form,
        max_noncurrent_versions: '',
        expiration_mode: 'or',
      })
    ).toBe(false)
  })
})

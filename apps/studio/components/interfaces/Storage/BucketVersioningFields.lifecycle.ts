import type { BucketVersioningFormValues } from './BucketVersioningFields.schema'
import type { ExpirationMode } from './StorageVersioning.constants'
import type { BucketLifecycle } from '@/data/storage/bucket-lifecycle-query'
import type { BucketLifecycleRuleInput } from '@/data/storage/bucket-lifecycle-update-mutation'

/** Lets a round trip recognize the rules the dashboard wrote, rather than guess from shape. */
export const AGE_RULE_ID = 'supabase-noncurrent-age'
export const COUNT_RULE_ID = 'supabase-noncurrent-count'

/**
 * S3 honors `newer_noncurrent_versions` only alongside `noncurrent_days`, so "either
 * condition" becomes two rules, the second pinned at the shortest age the API accepts.
 */
const MIN_NONCURRENT_DAYS = 1

export interface LifecycleFormPolicy {
  versionExpiryDays: number | null
  maxNoncurrentVersions: number | null
  expirationMode: ExpirationMode
}

export const toLifecycleRules = (
  values: Pick<
    BucketVersioningFormValues,
    'enable_versioning' | 'version_expiry_days' | 'max_noncurrent_versions' | 'expiration_mode'
  >
): BucketLifecycleRuleInput[] => {
  const days = values.version_expiry_days === '' ? null : values.version_expiry_days
  const versions = values.max_noncurrent_versions === '' ? null : values.max_noncurrent_versions

  if (days === null && versions === null) return []

  if (days !== null && versions !== null && values.expiration_mode === 'or') {
    return [
      {
        id: AGE_RULE_ID,
        status: 'Enabled',
        filter: {},
        noncurrent_version_expiration: { noncurrent_days: days },
      },
      {
        id: COUNT_RULE_ID,
        status: 'Enabled',
        filter: {},
        noncurrent_version_expiration: {
          noncurrent_days: MIN_NONCURRENT_DAYS,
          newer_noncurrent_versions: versions,
        },
      },
    ]
  }

  // The form's validation already rejects a count with no age.
  if (days === null) return []

  return [
    {
      id: AGE_RULE_ID,
      status: 'Enabled',
      filter: {},
      noncurrent_version_expiration: {
        noncurrent_days: days,
        ...(versions === null ? {} : { newer_noncurrent_versions: versions }),
      },
    },
  ]
}

/** A blind write would drop any rule `fromLifecycleRules` could not model. */
export const hasLifecyclePolicyChanged = (
  stored: LifecycleFormPolicy,
  values: Pick<
    BucketVersioningFormValues,
    'version_expiry_days' | 'max_noncurrent_versions' | 'expiration_mode'
  >
) => {
  const days = values.version_expiry_days === '' ? null : values.version_expiry_days
  const versions = values.max_noncurrent_versions === '' ? null : values.max_noncurrent_versions

  if (stored.versionExpiryDays !== days) return true
  if (stored.maxNoncurrentVersions !== versions) return true
  // The mode only means anything when both conditions are set.
  return days !== null && versions !== null && stored.expirationMode !== values.expiration_mode
}

/** Rules this can't model — extra, disabled, or non-expiration — are ignored, not guessed at. */
export const fromLifecycleRules = (lifecycle?: BucketLifecycle | null): LifecycleFormPolicy => {
  const enabledRules = (lifecycle?.rules ?? []).filter(
    (rule) => rule.status === 'Enabled' && rule.noncurrent_version_expiration !== undefined
  )

  if (enabledRules.length === 0) {
    return { versionExpiryDays: null, maxNoncurrentVersions: null, expirationMode: 'and' }
  }

  const ageOnlyRule = enabledRules.find(
    (rule) => rule.noncurrent_version_expiration?.newer_noncurrent_versions === undefined
  )
  const cappedRule = enabledRules.find(
    (rule) => rule.noncurrent_version_expiration?.newer_noncurrent_versions !== undefined
  )

  if (ageOnlyRule !== undefined && cappedRule !== undefined) {
    return {
      versionExpiryDays: ageOnlyRule.noncurrent_version_expiration?.noncurrent_days ?? null,
      maxNoncurrentVersions:
        cappedRule.noncurrent_version_expiration?.newer_noncurrent_versions ?? null,
      expirationMode: 'or',
    }
  }

  const rule = cappedRule ?? ageOnlyRule
  return {
    versionExpiryDays: rule?.noncurrent_version_expiration?.noncurrent_days ?? null,
    maxNoncurrentVersions: rule?.noncurrent_version_expiration?.newer_noncurrent_versions ?? null,
    expirationMode: 'and',
  }
}

import type { BucketVersioningFormValues } from './BucketVersioningFields.schema'
import type { ExpirationMode } from './StorageVersioning.constants'
import type { BucketLifecycle } from '@/data/storage/bucket-lifecycle-query'
import type { BucketLifecycleRuleInput } from '@/data/storage/bucket-lifecycle-update-mutation'

/**
 * Storage keys its rules by id, and replacing the configuration means sending
 * every rule we want to keep. Naming ours lets a round trip recognize what the
 * dashboard wrote, rather than guessing from the rule's shape.
 */
export const AGE_RULE_ID = 'supabase-noncurrent-age'
export const COUNT_RULE_ID = 'supabase-noncurrent-count'

/**
 * S3 has no count-only condition: `newer_noncurrent_versions` is only honored
 * alongside `noncurrent_days`. "Either condition" is therefore two rules — one
 * expiring purely by age, one expiring beyond the cap at the shortest age the
 * API accepts. That floor is why the two modes aren't symmetrical.
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

  // The count condition is meaningless without an age, and the form's own
  // validation already rejects that combination.
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

/**
 * Replacing the configuration sends every rule we want to keep, so a blind write
 * would drop anything `fromLifecycleRules` could not model. Only write when the
 * user actually moved one of the three fields the form owns.
 */
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

/**
 * Reads back whatever Storage has stored, including configurations the dashboard
 * did not write. Anything it can't model — extra rules, disabled rules, actions
 * other than noncurrent expiration — is ignored rather than guessed at.
 */
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

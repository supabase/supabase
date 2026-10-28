import { PROJECT_VERSIONING_DEFAULTS } from '@/components/interfaces/Storage/StorageVersioning.constants'
import type { BucketLifecycleRule } from '@/data/storage/bucket-lifecycle-query'
import type { BucketLifecycleRuleInput } from '@/data/storage/bucket-lifecycle-update-mutation'

export type LifecycleRuleStatus = BucketLifecycleRuleInput['status']

/** The editable fields of a single rule, in the API's own terms. */
export interface LifecycleRuleValues {
  id: string
  status: LifecycleRuleStatus
  noncurrentDays: number
  newerNoncurrentVersions: number | null
}

const isRuleStatus = (status: string): status is LifecycleRuleStatus =>
  status === 'Enabled' || status === 'Disabled'

/**
 * The response is looser than the request body: newer Storage versions may return actions
 * other than noncurrent version expiration, or statuses the body doesn't accept. Those can't
 * be sent back, so they come out as `null`.
 */
export const toRuleInput = (rule: BucketLifecycleRule): BucketLifecycleRuleInput | null => {
  const expiration = rule.noncurrent_version_expiration
  if (expiration === undefined || !isRuleStatus(rule.status)) return null

  return {
    ...(rule.id ? { id: rule.id } : {}),
    status: rule.status,
    filter: {},
    noncurrent_version_expiration: {
      noncurrent_days: expiration.noncurrent_days,
      ...(expiration.newer_noncurrent_versions === undefined
        ? {}
        : { newer_noncurrent_versions: expiration.newer_noncurrent_versions }),
    },
  }
}

const isWritableRule = (rule: BucketLifecycleRule) => toRuleInput(rule) !== null

/**
 * The update endpoint replaces the whole configuration, so a write that had to drop a rule
 * it couldn't re-send would silently delete it.
 */
export const canWriteRules = (rules: BucketLifecycleRule[]) => rules.every(isWritableRule)

export const fromRuleValues = (values: LifecycleRuleValues): BucketLifecycleRuleInput => {
  const id = values.id.trim()
  return {
    // A blank ID is omitted so Storage generates one; the API rejects empty strings.
    ...(id.length > 0 ? { id } : {}),
    status: values.status,
    filter: {},
    noncurrent_version_expiration: {
      noncurrent_days: values.noncurrentDays,
      ...(values.newerNoncurrentVersions === null
        ? {}
        : { newer_noncurrent_versions: values.newerNoncurrentVersions }),
    },
  }
}

/**
 * Every other rule is re-sent unchanged, because the update endpoint replaces the whole list.
 * `index` null appends, otherwise `nextRule` replaces the rule at that position.
 */
export const withRule = <T>(
  rules: BucketLifecycleRule[],
  index: number | null,
  nextRule: T
): (BucketLifecycleRuleInput | T)[] => {
  const inputs = rules.flatMap<BucketLifecycleRuleInput | T>((rule, i) => {
    if (i === index) return [nextRule]
    const input = toRuleInput(rule)
    return input === null ? [] : [input]
  })
  return index === null ? [...inputs, nextRule] : inputs
}

export const upsertRule = (
  rules: BucketLifecycleRule[],
  index: number | null,
  values: LifecycleRuleValues
): BucketLifecycleRuleInput[] => withRule(rules, index, fromRuleValues(values))

/** An empty result removes the configuration, since the mutation sends DELETE for it. */
export const removeRule = (
  rules: BucketLifecycleRule[],
  index: number
): BucketLifecycleRuleInput[] =>
  rules.flatMap((rule, i) => {
    const input = i === index ? null : toRuleInput(rule)
    return input === null ? [] : [input]
  })

export const setRuleStatus = (
  rules: BucketLifecycleRule[],
  index: number,
  status: LifecycleRuleStatus
): BucketLifecycleRuleInput[] =>
  rules.flatMap((rule, i) => {
    const input = toRuleInput(rule)
    if (input === null) return []
    return [i === index ? { ...input, status } : input]
  })

export const toRuleValues = (rule?: BucketLifecycleRule): LifecycleRuleValues => ({
  id: rule?.id ?? '',
  status: rule !== undefined && isRuleStatus(rule.status) ? rule.status : 'Enabled',
  noncurrentDays:
    rule?.noncurrent_version_expiration?.noncurrent_days ??
    PROJECT_VERSIONING_DEFAULTS.versionExpiryDays,
  newerNoncurrentVersions: rule?.noncurrent_version_expiration?.newer_noncurrent_versions ?? null,
})

/** Other rule IDs in the bucket, for the uniqueness check while editing `index`. */
export const getOtherRuleIds = (rules: BucketLifecycleRule[], index: number | null) =>
  rules.flatMap((rule, i) => (i !== index && rule.id ? [rule.id] : []))

export const describeRule = (rule: BucketLifecycleRule) => {
  const expiration = rule.noncurrent_version_expiration
  if (expiration === undefined) return 'Unsupported action'

  const days = `${expiration.noncurrent_days} ${expiration.noncurrent_days === 1 ? 'day' : 'days'}`
  if (expiration.newer_noncurrent_versions === undefined) {
    return `Expire noncurrent versions after ${days}`
  }
  return `Expire noncurrent versions after ${days}, keeping the newest ${expiration.newer_noncurrent_versions}`
}

export interface LifecycleRequestPreview {
  method: 'PUT' | 'DELETE'
  path: string
  /** Pretty-printed JSON; omitted for DELETE, which the API sends with no body. */
  body?: string
}

export const buildLifecycleRequestPreview = ({
  projectRef,
  bucketId,
  rules,
}: {
  projectRef: string
  bucketId: string
  rules: unknown[]
}): LifecycleRequestPreview => {
  const path = `/platform/storage/${projectRef}/buckets/${bucketId}/lifecycle`
  if (rules.length === 0) return { method: 'DELETE', path }
  return { method: 'PUT', path, body: JSON.stringify({ rules }, null, 2) }
}

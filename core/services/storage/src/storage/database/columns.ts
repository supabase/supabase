import { quoteIdentifier } from '@internal/database'

export interface SelectColumnPolicy {
  readonly excludeUserMetadata?: boolean
  readonly excludeMultipartMetadata?: boolean
  readonly excludeBucketType?: boolean
  readonly syntheticBucketType?: boolean
}

function policy(rules: SelectColumnPolicy = {}) {
  return Object.freeze(rules)
}

export const SelectColumnPolicy = Object.freeze({
  none: policy(),
  objectWithoutUserMetadata: policy({
    excludeUserMetadata: true,
  }),
  multipartWithoutUserMetadata: policy({
    excludeUserMetadata: true,
  }),
  multipartWithoutMetadata: policy({
    excludeMultipartMetadata: true,
  }),
  multipartWithoutUserOrMultipartMetadata: policy({
    excludeUserMetadata: true,
    excludeMultipartMetadata: true,
  }),
  bucketWithoutType: policy({ excludeBucketType: true }),
  syntheticBucket: policy({ syntheticBucketType: true }),
})

const DEFAULT_SELECT_COLUMNS = '"id"'
const SYNTHETIC_BUCKET_TYPE = `'STANDARD' AS "type"`

const selectColumnsCache = new Map<SelectColumnPolicy, Map<string, string>>()

export function selectColumns(
  columns: string,
  policy: SelectColumnPolicy = SelectColumnPolicy.none
): string {
  let policyCache = selectColumnsCache.get(policy)
  const cached = policyCache?.get(columns)

  if (cached !== undefined) {
    return cached
  }

  const selected: string[] = []
  let addSyntheticBucketType = false
  let requestedRealBucketColumn = false

  for (const value of columns.split(',')) {
    const column = value.trim()
    if (column.length === 0) {
      requestedRealBucketColumn ||= policy.syntheticBucketType === true
      continue
    }

    if (column === 'user_metadata' && policy.excludeUserMetadata) {
      continue
    }
    if (column === 'metadata' && policy.excludeMultipartMetadata) {
      continue
    }
    if (column === 'type') {
      if (policy.syntheticBucketType) {
        addSyntheticBucketType = true
        continue
      }
      if (policy.excludeBucketType) {
        continue
      }
    }

    requestedRealBucketColumn = true
    selected.push(column === '*' ? '*' : quoteIdentifier(column))
  }

  if (addSyntheticBucketType) {
    if (selected.length === 0 && requestedRealBucketColumn) {
      selected.push(DEFAULT_SELECT_COLUMNS)
    }
    selected.push(SYNTHETIC_BUCKET_TYPE)
  }

  const sql = selected.length ? selected.join(', ') : DEFAULT_SELECT_COLUMNS

  if (policyCache === undefined) {
    policyCache = new Map()
    selectColumnsCache.set(policy, policyCache)
  }
  policyCache.set(columns, sql)

  return sql
}

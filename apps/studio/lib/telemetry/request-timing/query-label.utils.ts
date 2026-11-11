// Query keys mix a resource name with values that identify a user, project or organization
// (refs, slugs, schema and table names, search text, SQL). A label must never carry those, so
// it is built from an allowlist-shaped reading of the key, not by trusting positions.

// Lowercase words joined by hyphens, e.g. `edge-functions`. No digits, so ids and UUIDs fail.
const RESOURCE_NAME = /^[a-z]+(-[a-z]+)*$/
const MAX_SEGMENT_LENGTH = 40
// Project refs are 20 lowercase letters, which would otherwise pass as a resource name
const PROJECT_REF_SHAPE = /^[a-z]{20}$/

// Keys under these start `[scope, <ref or slug>, <resource>, ...]`
const SCOPES_WITH_IDENTIFIER = new Set(['projects', 'project', 'organizations'])

export const UNLABELED_QUERY = 'unlabeled'

function asResourceName(segment: unknown): string | undefined {
  if (typeof segment !== 'string') return undefined
  if (segment.length > MAX_SEGMENT_LENGTH) return undefined
  if (!RESOURCE_NAME.test(segment) || PROJECT_REF_SHAPE.test(segment)) return undefined
  return segment
}

/**
 * Low-cardinality label for a query key: `projects/tables`, `organizations/usage`, `profile`.
 * Only the leading resource name is used, and the identifier that follows `projects`,
 * `project` and `organizations` is skipped.
 */
export function getQueryLabel(queryKey: readonly unknown[]): string {
  const scope = asResourceName(queryKey[0])
  if (!scope) return UNLABELED_QUERY

  if (!SCOPES_WITH_IDENTIFIER.has(scope)) return scope

  const resource = asResourceName(queryKey[2])
  return resource ? `${scope}/${resource}` : scope
}

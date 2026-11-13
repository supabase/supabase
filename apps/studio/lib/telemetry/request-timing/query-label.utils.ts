import { QUERY_LABEL_VOCABULARY } from './query-label-vocabulary'

// Keys under these start `[scope, <ref or slug>, <resource>, ...]`
const SCOPES_WITH_IDENTIFIER = new Set(['projects', 'project', 'organizations'])

export const UNLABELED_QUERY = 'unlabeled'

// Query keys mix resource names with values that identify a user, project or organization
// (refs, slugs, schema and table names, search text, SQL). A label may only contain names from
// the vocabulary, so a value is never reported just because it looks like a name.
function asResourceName(segment: unknown): string | undefined {
  if (typeof segment !== 'string') return undefined
  return QUERY_LABEL_VOCABULARY.has(segment) ? segment : undefined
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

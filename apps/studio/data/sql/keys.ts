import type { QueryKey } from '@tanstack/react-query'

import type { RoleImpersonationState } from '@/lib/role-impersonation'

type ResultQueryIdentity = {
  sql?: string
  roleImpersonationState?: RoleImpersonationState
}

type ResultRowIdentity = Omit<ResultQueryIdentity, 'sql'> & {
  table: { schema: string; name: string }
  identifiers: Record<string, unknown>
}

export const sqlKeys = {
  query: (projectRef: string | undefined, queryKey: QueryKey) =>
    ['projects', projectRef, 'query', ...queryKey] as const,
  // Encrypted connection strings can rotate on project refresh without changing the database.
  editableResult: (
    projectRef: string | undefined,
    { sql, roleImpersonationState }: ResultQueryIdentity
  ) => ['projects', projectRef, 'query-result-editing', { sql, roleImpersonationState }] as const,
  resultRow: (
    projectRef: string | undefined,
    { table, identifiers, roleImpersonationState }: ResultRowIdentity
  ) =>
    [
      'projects',
      projectRef,
      'query-result-row',
      { table, identifiers, roleImpersonationState },
    ] as const,
}

import { getDefaultPrivilegesStateFallback, getDefaultPrivilegesStateSql } from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'

import { privilegeKeys } from './keys'
import { unguarded } from '@/data/fetchers'
import { executeSqlWithCatalogFallback } from '@/data/sql/catalog-fallback-query'
import type { StudioError } from '@/lib/errors/studio-errors'

export type DefaultPrivilegesVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
}

export async function getDefaultPrivilegesState(
  { projectRef, connectionString, schema }: DefaultPrivilegesVariables,
  signal?: AbortSignal
): Promise<boolean> {
  if (!projectRef) throw new Error('projectRef is required')

  const sql = getDefaultPrivilegesStateSql({ schema })

  const { result } = await executeSqlWithCatalogFallback(
    {
      projectRef,
      connectionString,
      sqlOrigin: 'studio',
      queryName: 'default-privileges-state',
      sql,
      queryKey: ['default-privileges-state'],
      grant: unguarded.migrating,
    },
    (query) => getDefaultPrivilegesStateFallback(query, { schema }),
    signal
  )

  const grantCount = (result[0] as { grant_count: number }).grant_count

  return grantCount === 3
}

export type DefaultPrivilegesData = Awaited<ReturnType<typeof getDefaultPrivilegesState>>
export type DefaultPrivilegesError = StudioError

export const defaultPrivilegesQueryOptions = (
  { projectRef, connectionString, schema }: DefaultPrivilegesVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return queryOptions({
    queryKey: privilegeKeys.defaultPrivileges(projectRef, schema),
    queryFn: ({ signal }) =>
      getDefaultPrivilegesState(
        {
          projectRef,
          connectionString,
          schema,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
  })
}

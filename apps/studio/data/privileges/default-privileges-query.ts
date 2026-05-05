import { getDefaultPrivilegesStateSql } from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'

import { privilegeKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { ResponseError } from '@/types'

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

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['default-privileges-state'],
    },
    signal
  )

  const grantCount = (result[0] as { grant_count: number }).grant_count

  return grantCount === 3
}

export type DefaultPrivilegesData = Awaited<ReturnType<typeof getDefaultPrivilegesState>>
export type DefaultPrivilegesError = ResponseError

export const defaultPrivilegesQueryOptions = (
  { projectRef, connectionString, schema }: DefaultPrivilegesVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- connection string doesn't change the result of the query
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

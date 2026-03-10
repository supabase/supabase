import { queryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'

import { privilegeKeys } from './keys'
import { getDefaultPrivilegesStateSql } from './privileges.sql'

export type DefaultPrivilegesVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getDefaultPrivilegesState(
  { projectRef, connectionString }: DefaultPrivilegesVariables,
  signal?: AbortSignal
): Promise<boolean> {
  if (!projectRef) throw new Error('projectRef is required')

  const sql = getDefaultPrivilegesStateSql()

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['default-privileges-state'],
    },
    signal
  )

  const revokeCount = (result[0] as { revoke_count: number }).revoke_count
  return revokeCount === 0
}

export type DefaultPrivilegesData = Awaited<ReturnType<typeof getDefaultPrivilegesState>>
export type DefaultPrivilegesError = ResponseError

export const defaultPrivilegesQueryOptions = (
  { projectRef, connectionString }: DefaultPrivilegesVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- connection string doesn't change the result of the query
    queryKey: privilegeKeys.defaultPrivileges(projectRef),
    queryFn: ({ signal }) =>
      getDefaultPrivilegesState(
        {
          projectRef,
          connectionString,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
  })
}

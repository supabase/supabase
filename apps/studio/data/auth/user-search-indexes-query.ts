import pgMeta from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { executeSql, type ExecuteSqlError } from 'data/sql/execute-sql-query'
import { UseCustomQueryOptions } from 'types'
import { authKeys } from './keys'

type UsersIndexStatusesVariables = {
  projectRef?: string
  connectionString?: string | null
}
type UsersIndexStatusesData = {
  index_name: string
  is_valid: boolean
  is_ready: boolean
}[]
export type UsersIndexStatusesError = ExecuteSqlError

export async function getUserIndexStatuses(
  { projectRef, connectionString }: UsersIndexStatusesVariables,
  signal?: AbortSignal
): Promise<UsersIndexStatusesData> {
  const sql = pgMeta.getIndexStatusesSQL()

  const { result } = await executeSql<UsersIndexStatusesData>(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['index-statuses'],
    },
    signal
  )

  return result
}

export const useUserIndexStatusesQuery = <TData = UsersIndexStatusesData>(
  { projectRef, connectionString }: UsersIndexStatusesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<UsersIndexStatusesData, UsersIndexStatusesError, TData> = {}
) =>
  useQuery<UsersIndexStatusesData, UsersIndexStatusesError, TData>({
    queryKey: authKeys.usersIndexStatuses(projectRef),
    queryFn: ({ signal }) =>
      getUserIndexStatuses(
        {
          projectRef,
          connectionString,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

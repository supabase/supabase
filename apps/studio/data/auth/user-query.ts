import { useQuery } from '@tanstack/react-query'

import { executeSql, type ExecuteSqlError } from 'data/sql/execute-sql-query'
import { getUserSQL } from 'data/sql/queries/get-user'
import { UseCustomQueryOptions } from 'types'
import { authKeys } from './keys'
import { User } from './users-infinite-query'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type UserVariables = {
  projectRef?: string
  connectionString?: string | null
  userId?: string | null
}

export async function getUser(
  { projectRef, connectionString, userId }: UserVariables,
  signal?: AbortSignal
) {
  if (!userId) throw new Error('UserID is required')
  if (!UUID_REGEX.test(userId)) throw new Error('Invalid user ID format')

  const sql = getUserSQL(userId)
  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: [`user-${userId}`] },
    signal
  )

  const user = result[0] as User | undefined
  return user
}

export type UserData = Awaited<ReturnType<typeof getUser>>
export type UserError = ExecuteSqlError

export const useUserQuery = <TData = UserData>(
  { projectRef, connectionString, userId }: UserVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<UserData, UserError, TData> = {}
) =>
  useQuery<UserData, UserError, TData>({
    queryKey: authKeys.user(projectRef, userId),
    queryFn: ({ signal }) => getUser({ projectRef, connectionString, userId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

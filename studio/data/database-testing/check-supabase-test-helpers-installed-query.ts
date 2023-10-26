import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { databaseTestingKeys } from './keys'
import { ResponseError } from 'types'
import { executeSql } from 'data/sql/execute-sql-query'

export type CheckSupabaseTestHelpersInstalledVariables = {
  projectRef?: string
  connectionString?: string
}

export async function checkSupabaseTestHelpersInstalled({
  projectRef,
  connectionString,
}: CheckSupabaseTestHelpersInstalledVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `select * from pgtle.available_extensions() where name = 'basejump-supabase_test_helpers';`,
    queryKey: ['check-test-helpers-installed'],
  })
  return result.length === 1
}

export type CheckSupabaseTestHelpersInstalledData = Awaited<
  ReturnType<typeof checkSupabaseTestHelpersInstalled>
>
export type CheckSupabaseTestHelpersInstalledError = ResponseError

export const useCheckSupabaseTestHelpersInstalledQuery = <
  TData = CheckSupabaseTestHelpersInstalledData
>(
  { projectRef, connectionString }: CheckSupabaseTestHelpersInstalledVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<
    CheckSupabaseTestHelpersInstalledData,
    CheckSupabaseTestHelpersInstalledError,
    TData
  > = {}
) =>
  useQuery<CheckSupabaseTestHelpersInstalledData, CheckSupabaseTestHelpersInstalledError, TData>(
    databaseTestingKeys.isSupabaseTestHelpersInstalled(projectRef),
    () => checkSupabaseTestHelpersInstalled({ projectRef, connectionString }),
    {
      retry: false,
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof connectionString !== 'undefined',
      ...options,
    }
  )

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { databaseTestingKeys } from './keys'
import { ResponseError } from 'types'
import { executeSql } from 'data/sql/execute-sql-query'

export type CheckDbDevInstalledVariables = {
  projectRef?: string
  connectionString?: string
}

export async function checkDbDevInstalled({
  projectRef,
  connectionString,
}: CheckDbDevInstalledVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `select * from pg_extension where extname = 'supabase-dbdev';`,
    queryKey: ['check-dbdev-installed'],
  })
  return result.length === 1
}

export type CheckDbDevInstalledData = Awaited<ReturnType<typeof checkDbDevInstalled>>
export type CheckDbDevInstalledError = ResponseError

export const useCheckDbDevInstalledQuery = <TData = CheckDbDevInstalledData>(
  { projectRef, connectionString }: CheckDbDevInstalledVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<CheckDbDevInstalledData, CheckDbDevInstalledError, TData> = {}
) =>
  useQuery<CheckDbDevInstalledData, CheckDbDevInstalledError, TData>(
    databaseTestingKeys.isDbDevInstalled(projectRef),
    () => checkDbDevInstalled({ projectRef, connectionString }),
    {
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof connectionString !== 'undefined',
      ...options,
    }
  )

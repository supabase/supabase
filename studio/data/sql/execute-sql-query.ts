import { QueryKey, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import md5 from 'blueimp-md5'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { sqlKeys } from './keys'

export type ExecuteSqlVariables = {
  projectRef?: string
  connectionString?: string
  sql: string
  queryKey?: QueryKey
}

export async function executeSql(
  { projectRef, connectionString, sql }: ExecuteSqlVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()

  if (connectionString) {
    headers.set('x-connection-encrypted', connectionString)
  }

  const response = await post(
    `${API_URL}/pg-meta/${projectRef}/query`,
    { query: sql },
    { headers: Object.fromEntries(headers), signal }
  )
  if (response.error) {
    throw response.error
  }

  return { result: response }
}

export type ExecuteSqlData = Awaited<ReturnType<typeof executeSql>>
export type ExecuteSqlError = unknown

export const useExecuteSqlQuery = <TData = ExecuteSqlData>(
  { projectRef, connectionString, sql, queryKey }: ExecuteSqlVariables,
  { enabled = true, ...options }: UseQueryOptions<ExecuteSqlData, ExecuteSqlError, TData> = {}
) =>
  useQuery<ExecuteSqlData, ExecuteSqlError, TData>(
    sqlKeys.query(projectRef, queryKey ?? [md5(sql)]),
    ({ signal }) => executeSql({ projectRef, connectionString, sql }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export const useExecuteSqlPrefetch = ({
  projectRef,
  connectionString,
  sql,
  queryKey,
}: ExecuteSqlVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(sqlKeys.query(projectRef, queryKey ?? [md5(sql)]), ({ signal }) =>
        executeSql({ projectRef, connectionString, sql }, signal)
      )
    }
  }, [projectRef])
}

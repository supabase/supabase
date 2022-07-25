import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import md5 from 'blueimp-md5'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { sqlKeys } from './keys'

export type ExecuteQueryVariables = {
  projectRef?: string
  connectionString?: string
  sql: string
}

export async function executeQuery(
  { projectRef, connectionString, sql }: ExecuteQueryVariables,
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

export type ExecuteQueryData = Awaited<ReturnType<typeof executeQuery>>
export type ExecuteQueryError = unknown

export const useExecuteQueryQuery = <TData = ExecuteQueryData>(
  { projectRef, connectionString, sql }: ExecuteQueryVariables,
  { enabled = true, ...options }: UseQueryOptions<ExecuteQueryData, ExecuteQueryError, TData> = {}
) =>
  useQuery<ExecuteQueryData, ExecuteQueryError, TData>(
    sqlKeys.query(projectRef, md5(sql)),
    ({ signal }) => executeQuery({ projectRef, connectionString, sql }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export const useExecuteQueryPrefetch = ({
  projectRef,
  connectionString,
  sql,
}: ExecuteQueryVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(sqlKeys.query(projectRef, md5(sql)), ({ signal }) =>
        executeQuery({ projectRef, connectionString, sql }, signal)
      )
    }
  }, [projectRef])
}

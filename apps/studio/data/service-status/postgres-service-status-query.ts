import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { post } from 'lib/common/fetch'
import { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'
import { API_URL } from 'lib/constants'

export type PostgresServiceStatusVariables = {
  projectRef?: string
  connectionString?: string
}

export async function getPostgresServiceStatus(
  { projectRef, connectionString }: PostgresServiceStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!connectionString) throw new Error('connectionString is required')

  let headers = new Headers()
  headers.set('x-connection-encrypted', connectionString)

  const response = await post(
    `${API_URL}/pg-meta/${projectRef}/query?key=service_status`,
    { query: 'select 1' },
    { headers: Object.fromEntries(headers), signal }
  )

  if (response.error) throw response.error
  return response.error === undefined
}

export type PostgresServiceStatusData = Awaited<ReturnType<typeof getPostgresServiceStatus>>
export type PostgresServiceStatusError = ResponseError

export const usePostgresServiceStatusQuery = <TData = PostgresServiceStatusData>(
  { projectRef, connectionString }: PostgresServiceStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PostgresServiceStatusData, PostgresServiceStatusError, TData> = {}
) =>
  useQuery<PostgresServiceStatusData, PostgresServiceStatusError, TData>(
    serviceStatusKeys.postgres(projectRef),
    ({ signal }) => getPostgresServiceStatus({ projectRef, connectionString }, signal),
    {
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof connectionString !== 'undefined',
      ...options,
    }
  )

import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'

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

  const { error } = await post('/platform/pg-meta/{ref}/query', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      // @ts-expect-error Intentional key for easier reference of query in the network tab
      query: { key: 'service_status' },
    },
    body: { query: 'select 1' },
    headers,
    signal,
  })

  if (error) handleError(error)
  return error === undefined
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
      staleTime: 0,
      ...options,
    }
  )

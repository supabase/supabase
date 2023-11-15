import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { post } from 'lib/common/fetch'
import { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'
import { API_URL } from 'lib/constants'

// [Joshen] Need API to return a separate connectionString for pooler before we can do this

export type PoolerServiceStatusVariables = {
  projectRef?: string
  connectionString?: string
}

export async function getPoolerServiceStatus(
  { projectRef, connectionString }: PoolerServiceStatusVariables,
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

  return response.error === undefined
}

export type PoolerServiceStatusData = Awaited<ReturnType<typeof getPoolerServiceStatus>>
export type PoolerServiceStatusError = ResponseError

export const usePoolerServiceStatusQuery = <TData = PoolerServiceStatusData>(
  { projectRef, connectionString }: PoolerServiceStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PoolerServiceStatusData, PoolerServiceStatusError, TData> = {}
) =>
  useQuery<PoolerServiceStatusData, PoolerServiceStatusError, TData>(
    serviceStatusKeys.postgres(projectRef),
    ({ signal }) => getPoolerServiceStatus({ projectRef, connectionString }, signal),
    {
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof connectionString !== 'undefined',
      ...options,
    }
  )

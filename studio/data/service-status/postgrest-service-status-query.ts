import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'lib/common/fetch'
import { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'

export type PostgrestServiceStatusVariables = {
  projectRef?: string
  endpoint?: string
  anonKey?: string
}

export async function getPostgrestServiceStatus(
  { projectRef, endpoint, anonKey }: PostgrestServiceStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!endpoint) throw new Error('endpoint is required')
  if (!anonKey) throw new Error('anonKey is required')

  const response = await get(`https://${endpoint}/rest-admin/v1/live`, {
    signal,
    headers: { apikey: anonKey },
  })

  return response.error === undefined
}

export type PostgrestServiceStatusData = Awaited<ReturnType<typeof getPostgrestServiceStatus>>
export type PostgrestServiceStatusError = ResponseError

export const usePostgrestServiceStatusQuery = <TData = PostgrestServiceStatusData>(
  { projectRef, endpoint, anonKey }: PostgrestServiceStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PostgrestServiceStatusData, PostgrestServiceStatusError, TData> = {}
) =>
  useQuery<PostgrestServiceStatusData, PostgrestServiceStatusError, TData>(
    serviceStatusKeys.postgrest(projectRef),
    ({ signal }) => getPostgrestServiceStatus({ projectRef, endpoint, anonKey }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof endpoint !== 'undefined' &&
        typeof anonKey !== 'undefined',
      ...options,
    }
  )

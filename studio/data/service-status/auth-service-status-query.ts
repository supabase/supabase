import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'lib/common/fetch'
import { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'

export type AuthServiceStatusVariables = {
  projectRef?: string
  endpoint?: string
  anonKey?: string
}

export async function getAuthServiceStatus(
  { projectRef, endpoint, anonKey }: AuthServiceStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!endpoint) throw new Error('endpoint is required')
  if (!anonKey) throw new Error('anonKey is required')

  const response = await get(`https://${endpoint}/auth/v1/health`, {
    signal,
    headers: { apikey: anonKey },
  })

  return response.error === undefined
}

export type AuthServiceStatusData = Awaited<ReturnType<typeof getAuthServiceStatus>>
export type AuthServiceStatusError = ResponseError

export const useAuthServiceStatusQuery = <TData = AuthServiceStatusData>(
  { projectRef, endpoint, anonKey }: AuthServiceStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<AuthServiceStatusData, AuthServiceStatusError, TData> = {}
) =>
  useQuery<AuthServiceStatusData, AuthServiceStatusError, TData>(
    serviceStatusKeys.auth(projectRef),
    ({ signal }) => getAuthServiceStatus({ projectRef, endpoint, anonKey }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof endpoint !== 'undefined' &&
        typeof anonKey !== 'undefined',
      ...options,
    }
  )

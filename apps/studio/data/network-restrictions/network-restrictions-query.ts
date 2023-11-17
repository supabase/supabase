import { useCallback } from 'react'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'

import { networkRestrictionKeys } from './keys'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'

export type NetworkRestrictionsVariables = { projectRef?: string }

export type NetworkRestrictionsResponse = {
  entitlement: 'disallowed' | 'allowed'
  status: '' | 'stored' | 'applied'
  config: { dbAllowedCidrs: string[] }
  old_config?: { dbAllowedCidrs: string[] }
  error?: any
}

export async function getNetworkRestrictions(
  { projectRef }: NetworkRestrictionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = (await get(`${API_ADMIN_URL}/projects/${projectRef}/network-restrictions`, {
    signal,
  })) as NetworkRestrictionsResponse

  // Not allowed error is a valid response to denote if a project
  // has access to the network restrictions UI, so we'll handle it here
  if (response.error) {
    const isNotAllowedError =
      (response.error as any)?.code === 400 &&
      (response.error as any)?.message?.includes('not allowed to set up network restrictions')

    if (isNotAllowedError) {
      return {
        entitlement: 'disallowed',
        config: { dbAllowedCidrs: [] },
        status: '',
      } as NetworkRestrictionsResponse
    } else {
      throw response.error
    }
  }

  return response
}

export type NetworkRestrictionsData = Awaited<ReturnType<typeof getNetworkRestrictions>>
export type NetworkRestrictionsError = unknown

export const useNetworkRestrictionsQuery = <TData = NetworkRestrictionsData>(
  { projectRef }: NetworkRestrictionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<NetworkRestrictionsData, NetworkRestrictionsError, TData> = {}
) =>
  useQuery<NetworkRestrictionsData, NetworkRestrictionsError, TData>(
    networkRestrictionKeys.list(projectRef),
    ({ signal }) => getNetworkRestrictions({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export const useNetworkRestrictionsPrefetch = ({ projectRef }: NetworkRestrictionsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(networkRestrictionKeys.list(projectRef), ({ signal }) =>
        getNetworkRestrictions({ projectRef }, signal)
      )
    }
  }, [projectRef])
}

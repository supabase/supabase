import { useQuery } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { replicaKeys } from './keys'

export type LoadBalancersVariables = {
  projectRef?: string
}

export type LoadBalancer = components['schemas']['LoadBalancerDetailResponse']

export async function getLoadBalancers(
  { projectRef }: LoadBalancersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/load-balancers`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type LoadBalancersData = Awaited<ReturnType<typeof getLoadBalancers>>
export type LoadBalancersError = ResponseError

export const useLoadBalancersQuery = <TData = LoadBalancersData>(
  { projectRef }: LoadBalancersVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<LoadBalancersData, LoadBalancersError, TData> = {}
) => {
  return useQuery<LoadBalancersData, LoadBalancersError, TData>({
    queryKey: replicaKeys.loadBalancers(projectRef),
    queryFn: ({ signal }) => getLoadBalancers({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && IS_PLATFORM,
    ...options,
  })
}

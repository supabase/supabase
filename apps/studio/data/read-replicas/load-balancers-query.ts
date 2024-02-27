import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { ResponseError } from 'types'
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
  { enabled = true, ...options }: UseQueryOptions<LoadBalancersData, LoadBalancersError, TData> = {}
) => {
  const { data } = useProjectDetailQuery({ ref: projectRef })

  return useQuery<LoadBalancersData, LoadBalancersError, TData>(
    replicaKeys.loadBalancers(projectRef),
    ({ signal }) => getLoadBalancers({ projectRef }, signal),
    {
      enabled: enabled && data?.is_read_replicas_enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
}

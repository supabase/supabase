import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicaKeys } from './keys'
import { components } from 'data/api'
import { useFlag } from 'hooks'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'

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

  if (error) throw new Error((error as ResponseError).message)
  return data
}

export type LoadBalancersData = Awaited<ReturnType<typeof getLoadBalancers>>
export type LoadBalancersError = ResponseError

export const useLoadBalancersQuery = <TData = LoadBalancersData>(
  { projectRef }: LoadBalancersVariables,
  { enabled = true, ...options }: UseQueryOptions<LoadBalancersData, LoadBalancersError, TData> = {}
) => {
  const readReplicasEnabled = useFlag('readReplicas')
  const { data } = useProjectDetailQuery({ ref: projectRef })

  return useQuery<LoadBalancersData, LoadBalancersError, TData>(
    replicaKeys.loadBalancers(projectRef),
    ({ signal }) => getLoadBalancers({ projectRef }, signal),
    {
      enabled:
        enabled &&
        data?.is_read_replicas_enabled &&
        readReplicasEnabled &&
        typeof projectRef !== 'undefined',
      ...options,
    }
  )
}

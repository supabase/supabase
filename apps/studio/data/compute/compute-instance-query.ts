import { queryOptions } from '@tanstack/react-query'

import { computeInstanceRefetchInterval, parseComputeInstance } from './compute.utils'
import { computeKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type ComputeInstanceVariables = { projectRef?: string; name?: string }
export type ComputeInstanceError = ResponseError

async function getComputeInstance(
  { projectRef, name }: ComputeInstanceVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!name) throw new Error('name is required')

  const { data, error } = await get('/v2/projects/{ref}/workers/{name}', {
    params: { path: { ref: projectRef, name } },
    signal,
  })

  if (error) return handleError(error)
  return parseComputeInstance(data.data)
}

export type ComputeInstanceData = Awaited<ReturnType<typeof getComputeInstance>>

export const computeInstanceQueryOptions = ({ projectRef, name }: ComputeInstanceVariables) =>
  queryOptions({
    queryKey: computeKeys.detail(projectRef, name),
    queryFn: ({ signal }) => getComputeInstance({ projectRef, name }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof name !== 'undefined',
    refetchInterval: (query) => computeInstanceRefetchInterval(query.state.data),
  })

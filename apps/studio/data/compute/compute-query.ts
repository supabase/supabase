import { queryOptions } from '@tanstack/react-query'

import { computeRefetchInterval, parseComputeInstance } from './compute.utils'
import { computeKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type ComputeVariables = { projectRef?: string }
export type ComputeError = ResponseError

async function getComputeInstances({ projectRef }: ComputeVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/v2/projects/{ref}/workers', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) return handleError(error)
  return data.data.map((instance) => parseComputeInstance(instance))
}

export type ComputeData = Awaited<ReturnType<typeof getComputeInstances>>

export const computeQueryOptions = ({ projectRef }: ComputeVariables) =>
  queryOptions({
    queryKey: computeKeys.list(projectRef),
    queryFn: ({ signal }) => getComputeInstances({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
    refetchOnWindowFocus: 'always',
    refetchInterval: (query) => computeRefetchInterval(query.state.data),
  })

import { queryOptions } from '@tanstack/react-query'

import { computeRefetchInterval, parseComputeInstance } from './compute.utils'
import { computeKeys } from './keys'
import { classifyResponseError } from '@/data/error-classification'
import { get, handleError, unguarded } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'

export type ComputeVariables = { projectRef?: string }
export type ComputeError = StudioError

async function getComputeInstances({ projectRef }: ComputeVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error, response } = await get('/v2/projects/{ref}/compute', {
    params: { path: { ref: projectRef } },
    signal,
    grant: unguarded.migrating,
  })

  if (response.status === 404) {
    throw classifyResponseError({ message: 'Compute is not available for this project', code: 404 })
  }
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

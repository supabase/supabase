import { queryOptions } from '@tanstack/react-query'

import { workersKeys } from './keys'
import { parseWorker } from './workers.utils'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type WorkersVariables = { projectRef?: string }
export type WorkersError = ResponseError

async function getWorkers({ projectRef }: WorkersVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/v2/projects/{ref}/workers', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) return handleError(error)
  return data.data.map(parseWorker)
}

export type WorkersData = Awaited<ReturnType<typeof getWorkers>>

export const workersQueryOptions = ({ projectRef }: WorkersVariables) =>
  queryOptions({
    queryKey: workersKeys.list(projectRef),
    queryFn: ({ signal }) => getWorkers({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
    // Builds finish asynchronously, so keep polling until nothing is mid-build.
    refetchInterval: (query) =>
      query.state.data?.some((worker) => worker.buildState === 'building') ? 5_000 : false,
  })

import { queryOptions } from '@tanstack/react-query'

import { workersKeys } from './keys'
import { parseWorker } from './workers.utils'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type WorkerVariables = { projectRef?: string; name?: string }
export type WorkerError = ResponseError

async function getWorker({ projectRef, name }: WorkerVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!name) throw new Error('name is required')

  const { data, error } = await get('/v2/projects/{ref}/workers/{name}', {
    params: { path: { ref: projectRef, name } },
    signal,
  })

  if (error) return handleError(error)
  return parseWorker(data.data)
}

export type WorkerData = Awaited<ReturnType<typeof getWorker>>

export const workerQueryOptions = ({ projectRef, name }: WorkerVariables) =>
  queryOptions({
    queryKey: workersKeys.detail(projectRef, name),
    queryFn: ({ signal }) => getWorker({ projectRef, name }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof name !== 'undefined',
    refetchInterval: (query) => {
      // Poll while the worker is mid-build or being torn down, stop once it settles
      const worker = query.state.data
      const isTransient = worker && (worker.buildState === 'building' || worker.isDeleting)
      return isTransient ? 3000 : false
    },
  })

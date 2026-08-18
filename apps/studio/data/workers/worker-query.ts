import { queryOptions } from '@tanstack/react-query'

import { workersKeys } from './keys'
import { mockWorkers } from './workers.mock'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type WorkerVariables = { projectRef?: string; name?: string }
export type WorkerError = ResponseError

// Mirrors GET /v2/projects/{ref}/workers/{name}, seeded for the same reason as the list query.
async function getWorker({ projectRef, name }: WorkerVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!name) throw new Error('name is required')
  return mockWorkers().find((worker) => worker.name === name) ?? null
}

export type WorkerData = Awaited<ReturnType<typeof getWorker>>

export const workerQueryOptions = ({ projectRef, name }: WorkerVariables) =>
  queryOptions({
    queryKey: workersKeys.detail(projectRef, name),
    queryFn: () => getWorker({ projectRef, name }),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof name !== 'undefined',
  })

import { queryOptions } from '@tanstack/react-query'

import { workersKeys } from './keys'
import { mockWorkers } from './workers.mock'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type WorkersVariables = { projectRef?: string }
export type WorkersError = ResponseError

// GET /v2/projects/{ref}/workers exists but is restricted to allowlisted projects, and its response
// carries neither lifecycle events nor metrics. Seeded data until both are available (FUNC-774).
async function getWorkers({ projectRef }: WorkersVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  return mockWorkers()
}

export type WorkersData = Awaited<ReturnType<typeof getWorkers>>

export const workersQueryOptions = ({ projectRef }: WorkersVariables) =>
  queryOptions({
    queryKey: workersKeys.list(projectRef),
    queryFn: () => getWorkers({ projectRef }),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })

import { queryOptions } from '@tanstack/react-query'

import { parseInstance } from './compute.utils'
import { computeKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type InstanceVariables = { projectRef?: string; name?: string }
export type InstanceError = ResponseError

async function getInstance({ projectRef, name }: InstanceVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!name) throw new Error('name is required')

  const { data, error } = await get('/v2/projects/{ref}/workers/{name}', {
    params: { path: { ref: projectRef, name } },
    signal,
  })

  if (error) return handleError(error)
  return parseInstance(data.data)
}

export type InstanceData = Awaited<ReturnType<typeof getInstance>>

export const instanceQueryOptions = ({ projectRef, name }: InstanceVariables) =>
  queryOptions({
    queryKey: computeKeys.detail(projectRef, name),
    queryFn: ({ signal }) => getInstance({ projectRef, name }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof name !== 'undefined',
  })

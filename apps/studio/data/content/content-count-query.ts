import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { contentKeys } from './keys'

interface getContentCountVariables {
  projectRef?: string
  type: 'sql' | 'report' | 'log_sql'
}

export async function getContentCount(
  { projectRef, type }: getContentCountVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/content/count', {
    params: { path: { ref: projectRef }, query: { type } },
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export type ContentIdData = Awaited<ReturnType<typeof getContentCount>>
export type ContentIdError = ResponseError

export const useContentCountQuery = <TData = ContentIdData>(
  { projectRef, type }: getContentCountVariables,
  { enabled = true, ...options }: UseQueryOptions<ContentIdData, ContentIdError, TData> = {}
) =>
  useQuery<ContentIdData, ContentIdError, TData>(
    contentKeys.count(projectRef, type),
    ({ signal }) => getContentCount({ projectRef, type }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

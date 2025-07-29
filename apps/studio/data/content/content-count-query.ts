import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { operations } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { contentKeys } from './keys'

type GetContentCountVariables =
  operations['ContentController_getContentCountV2']['parameters']['query'] & {
    projectRef?: string
    cumulative?: boolean
  }

export async function getContentCount(
  { projectRef, cumulative, type, name }: GetContentCountVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/content/count', {
    params: {
      path: { ref: projectRef },
      query: {
        ...(type && { type }),
        ...(name && { name }),
      },
    },
    ...(cumulative ? {} : { headers: { Version: '2' } }),
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export type ContentIdData = Awaited<ReturnType<typeof getContentCount>>
export type ContentIdError = ResponseError

export const useContentCountQuery = <TData = ContentIdData>(
  { projectRef, cumulative, type, name }: GetContentCountVariables,
  { enabled = true, ...options }: UseQueryOptions<ContentIdData, ContentIdError, TData> = {}
) =>
  useQuery<ContentIdData, ContentIdError, TData>(
    contentKeys.count(projectRef, type, {
      cumulative,
      name,
    }),
    ({ signal }) => getContentCount({ projectRef, cumulative, type, name }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

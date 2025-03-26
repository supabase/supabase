import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { Content } from './content-query'
import { contentKeys } from './keys'

export type GetUserContentByIdResponse = Omit<
  components['schemas']['GetUserContentByIdResponse'],
  'content'
> & {
  content: Content['content']
}

export async function getContentById(
  { projectRef, id }: { projectRef?: string; id?: string },
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')
  if (typeof id === 'undefined') throw new Error('Content ID is required')

  const { data, error } = await get('/platform/projects/{ref}/content/item/{id}', {
    params: { path: { ref: projectRef, id } },
    signal,
  })

  if (error) throw handleError(error)
  // override content type
  return data as unknown as GetUserContentByIdResponse
}

export type ContentIdData = Awaited<ReturnType<typeof getContentById>>
export type ContentIdError = ResponseError

export const useContentIdQuery = <TData = ContentIdData>(
  { projectRef, id }: { projectRef?: string; id?: string },
  { enabled = true, ...options }: UseQueryOptions<ContentIdData, ContentIdError, TData> = {}
) =>
  useQuery<ContentIdData, ContentIdError, TData>(
    contentKeys.resource(projectRef, id),
    ({ signal }) => getContentById({ projectRef, id }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
      ...options,
    }
  )

import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { Content, ContentType } from './content-query'
import { contentKeys } from './keys'

interface GetContentVariables {
  projectRef?: string
  cursor?: string
  type: ContentType
  name?: string
  limit?: number
  sort?: 'name' | 'inserted_at'
}

export async function getContent(
  { projectRef, type, name, limit = 10, sort, cursor }: GetContentVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getContent')
  }

  const { data, error } = await get('/platform/projects/{ref}/content', {
    params: {
      path: { ref: projectRef },
      query: {
        type,
        name,
        sort_by: sort,
        limit: limit.toString(),
        cursor,
      },
    },
    signal,
  })

  if (error) handleError(error)

  return {
    cursor: data.cursor,
    content: data.data as unknown as Content[],
  }
}

export type ContentData = Awaited<ReturnType<typeof getContent>>
export type ContentError = unknown

export const useContentInfiniteQuery = <TData = ContentData>(
  { projectRef, type, name, limit, sort }: GetContentVariables,
  { enabled = true, ...options }: UseInfiniteQueryOptions<ContentData, ContentError, TData> = {}
) => {
  return useInfiniteQuery<ContentData, ContentError, TData>(
    contentKeys.infiniteList(projectRef, { type, name, limit, sort }),
    ({ signal, pageParam }) =>
      getContent({ projectRef, type, name, limit, sort, cursor: pageParam }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      getNextPageParam: (lastPage) => lastPage.cursor,
      ...options,
    }
  )
}

import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { UseCustomInfiniteQueryOptions } from 'types'
import { Content } from './content-query'
import { contentKeys } from './keys'
import { SNIPPET_PAGE_LIMIT } from './sql-folders-query'

export type SqlSnippet = Extract<Content, { type: 'sql' }>

interface GetSqlSnippetsVariables {
  projectRef?: string
  cursor?: string
  visibility?: SqlSnippet['visibility']
  favorite?: boolean
  name?: string
  sort?: 'name' | 'inserted_at'
}

export async function getSqlSnippets(
  { projectRef, cursor, visibility, favorite, name, sort }: GetSqlSnippetsVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getSqlSnippets')
  }

  const sortOrder = sort === 'name' ? 'asc' : 'desc'

  const { data, error } = await get('/platform/projects/{ref}/content', {
    params: {
      path: { ref: projectRef },
      query: {
        type: 'sql',
        cursor,
        visibility,
        favorite,
        name,
        limit: SNIPPET_PAGE_LIMIT.toString(),
        sort_by: sort,
        sort_order: sortOrder,
      },
    },
    signal,
  })

  if (error) {
    throw error
  }

  return {
    cursor: data.cursor,
    contents: data.data as unknown as SqlSnippet[],
  }
}

export type SqlSnippetsData = Awaited<ReturnType<typeof getSqlSnippets>>
export type SqlSnippetsError = unknown

export const useSqlSnippetsQuery = <TData = SqlSnippetsData>(
  { projectRef, sort, name, visibility, favorite }: Omit<GetSqlSnippetsVariables, 'cursor'>,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    SqlSnippetsData,
    SqlSnippetsError,
    InfiniteData<TData>,
    readonly unknown[],
    string | undefined
  > = {}
) =>
  useInfiniteQuery({
    queryKey: contentKeys.sqlSnippets(projectRef, { sort, name, visibility, favorite }),
    queryFn: ({ signal, pageParam: cursor }) =>
      getSqlSnippets({ projectRef, cursor, sort, name, visibility, favorite }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      return lastPage.cursor
    },
    ...options,
  })

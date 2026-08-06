import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { Content } from './content-query'
import { remapSqlContentFields } from './content-remap'
import { contentKeys } from './keys'
import { SNIPPET_PAGE_LIMIT, withSavedStatus, type SnippetWithContent } from './sql-folders-query'
import { get } from '@/data/fetchers'
import type { UseCustomInfiniteQueryOptions } from '@/types'

export type SqlSnippet = Extract<Content, { type: 'sql' }>

/** The snippet content types this query can list. Defaults to `'sql'`; the nav's
 *  Logs section passes `'log_sql'` to list logs snippets through the same shape. */
type SqlSnippetType = 'sql' | 'log_sql'

interface GetSqlSnippetsVariables {
  projectRef?: string
  cursor?: string
  type?: SqlSnippetType
  visibility?: SqlSnippet['visibility']
  favorite?: boolean
  name?: string
  sort?: 'name' | 'inserted_at'
}

export async function getSqlSnippets(
  { projectRef, cursor, type = 'sql', visibility, favorite, name, sort }: GetSqlSnippetsVariables,
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
        type,
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

  const snippets = remapSqlContentFields(data.data as unknown as SnippetWithContent[])
  return {
    cursor: data.cursor,
    contents: snippets.map(withSavedStatus),
  }
}

export type SqlSnippetsData = Awaited<ReturnType<typeof getSqlSnippets>>
export type SqlSnippetsError = unknown

export const useSqlSnippetsQuery = <TData = SqlSnippetsData>(
  {
    projectRef,
    type = 'sql',
    sort,
    name,
    visibility,
    favorite,
  }: Omit<GetSqlSnippetsVariables, 'cursor'>,
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
    queryKey: contentKeys.sqlSnippets(projectRef, { type, sort, name, visibility, favorite }),
    queryFn: ({ signal, pageParam: cursor }) =>
      getSqlSnippets({ projectRef, cursor, type, sort, name, visibility, favorite }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      return lastPage.cursor
    },
    ...options,
  })

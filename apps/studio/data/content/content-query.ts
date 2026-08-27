import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { remapSqlContentFields } from './content-remap'
import { contentKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type {
  Dashboards,
  LogSqlSnippets,
  Notebooks,
  SqlSnippets,
  UseCustomQueryOptions,
} from '@/types'

export type ContentBase = components['schemas']['GetUserContentResponse']['data'][number]

export type Content = Omit<ContentBase, 'content' | 'type'> &
  (
    | {
        type: 'sql'
        content: SqlSnippets.Content
      }
    | {
        type: 'report'
        content: Dashboards.Content
      }
    | {
        type: 'log_sql'
        content: LogSqlSnippets.Content
      }
    | {
        type: 'notebook'
        content: Notebooks.Content
      }
  )

export type ContentType = Content['type']

// Narrows the full Content union down to a single content type — for call sites that already
// know (from the `type` they queried with) which member they're holding, since useContentQuery
// et al. don't parameterize their return type by the `type` argument.
export type ContentOfType<T extends ContentType> = Extract<Content, { type: T }>

interface GetContentVariables {
  projectRef?: string
  type: ContentType
  name?: string
  limit?: number
}

export async function getContent(
  { projectRef, type, name, limit = 10 }: GetContentVariables,
  signal?: AbortSignal,
  headers?: HeadersInit
) {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getContent')
  }

  const { data, error } = await get('/platform/projects/{ref}/content', {
    params: {
      path: { ref: projectRef },
      query: { type, name, limit: limit.toString() },
    },
    headers,
    signal,
  })

  if (error) handleError(error)

  return {
    cursor: data.cursor,
    content: remapSqlContentFields(data.data as unknown as Content[]),
  }
}

export type ContentData = Awaited<ReturnType<typeof getContent>>
export type ContentError = unknown

/** @deprecated Use useContentInfiniteQuery from content-infinite-query instead */
export const useContentQuery = <TData = ContentData>(
  { projectRef, type, name, limit }: GetContentVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<ContentData, ContentError, TData> = {}
) =>
  useQuery<ContentData, ContentError, TData>({
    queryKey: contentKeys.list(projectRef, { type, name, limit }),
    queryFn: ({ signal }) => getContent({ projectRef, type, name, limit }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

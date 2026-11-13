import { useQuery } from '@tanstack/react-query'
import { operations } from 'api-types'

import { contentKeys } from './keys'
import { isLogsViewContent } from './log-content-schema'
import { getAllLogContent } from './logs-view-content'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

type GetContentCountVariables =
  operations['ContentController_getContentCountV2']['parameters']['query'] & {
    projectRef?: string
  }

export async function getContentCount(
  { projectRef, type, name }: GetContentCountVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')

  if (type === 'log_sql') {
    const rows = (await getAllLogContent({ projectRef, name }, signal)).filter(
      (row) => row.type === 'log_sql' && !isLogsViewContent(row)
    )
    return {
      favorites: rows.filter((row) => row.favorite).length,
      private: rows.filter((row) => row.visibility === 'user').length,
      shared: rows.filter((row) => row.visibility !== 'user').length,
    }
  }

  const { data, error } = await get('/platform/projects/{ref}/content/count', {
    params: {
      path: { ref: projectRef },
      query: {
        ...(type && { type }),
        ...(name && { name }),
      },
    },
    headers: { Version: '2' },
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export type ContentIdData = Awaited<ReturnType<typeof getContentCount>>
export type ContentIdError = StudioError

export const useContentCountQuery = <TData = ContentIdData>(
  { projectRef, type, name }: GetContentCountVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<ContentIdData, ContentIdError, TData> = {}
) =>
  useQuery<ContentIdData, ContentIdError, TData>({
    queryKey: contentKeys.count(projectRef, type, {
      name,
    }),
    queryFn: ({ signal }) => getContentCount({ projectRef, type, name }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

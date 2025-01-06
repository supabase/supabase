import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { contentKeys } from './keys'
import { SqlSnippet } from './sql-snippets-query'

type GetContentFilters = {
  type: 'sql' | 'report' | 'log_sql'
  visibility?: SqlSnippet['visibility']
  favorite?: boolean
  name?: string
}

interface getContentCountVariables extends GetContentFilters {
  projectRef?: string
}

export async function getContentCount(
  { projectRef, type, visibility, favorite, name }: getContentCountVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')

  const query: GetContentFilters = { type }
  if (visibility) query.visibility = visibility
  if (favorite) query.favorite = favorite
  if (name) query.name = name

  const { data, error } = await get('/platform/projects/{ref}/content/count', {
    params: { path: { ref: projectRef }, query: { type, visibility, favorite, name } },
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export type ContentIdData = Awaited<ReturnType<typeof getContentCount>>
export type ContentIdError = ResponseError

export const useContentCountQuery = <TData = ContentIdData>(
  { projectRef, type, visibility, favorite, name }: getContentCountVariables,
  { enabled = true, ...options }: UseQueryOptions<ContentIdData, ContentIdError, TData> = {}
) =>
  useQuery<ContentIdData, ContentIdError, TData>(
    contentKeys.count(projectRef, type, {
      visibility,
      favorite,
      name,
    }),
    ({ signal }) => getContentCount({ projectRef, type, visibility, favorite, name }, signal),
    {
      // count query is causing an api issue  — disabling temporarily
      //enabled: enabled && typeof projectRef !== 'undefined',
      enabled: false,
      ...options,
    }
  )

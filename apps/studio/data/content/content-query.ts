import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import type { Dashboards, LogSqlSnippets, Owner, SqlSnippets } from 'types'
import { contentKeys } from './keys'

type ContentBase = {
  id?: string
  name: string
  description?: string
  visibility: 'user' | 'project' | 'org' | 'public'
  owner_id?: number // user id
  last_updated_by?: number // user id
  inserted_at?: string // '2021-08-26T08:24:52.040695+00:00'
  owner?: Owner
  project_id?: number
  updated_at?: string // '2021-08-26T08:24:52.040695+00:00'
  updated_by?: Owner
}

export type Content = ContentBase &
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
  )

export async function getContent(
  projectRef: string | undefined,
  signal?: AbortSignal
): Promise<{
  content: Content[]
}> {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getContent')
  }

  let response = await get(`${API_URL}/projects/${projectRef}/content`, { signal })

  if (response.error) {
    throw response.error
  }

  if (!response) {
    throw new Error('Content not found')
  }

  return {
    content: response.data,
  }
}

export type ContentData = Awaited<ReturnType<typeof getContent>>
export type ContentError = unknown

export const useContentQuery = <TData = ContentData>(
  projectRef: string | undefined,
  { enabled = true, ...options }: UseQueryOptions<ContentData, ContentError, TData> = {}
) =>
  useQuery<ContentData, ContentError, TData>(
    contentKeys.list(projectRef),
    ({ signal }) => getContent(projectRef, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

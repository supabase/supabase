import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError, isValidConnString } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectDetailVariables = { slug?: string; ref?: string }

export type ProjectMinimal = components['schemas']['ProjectInfo']
export type ProjectDetail = components['schemas']['ProjectDetailResponse']

export interface Project extends Omit<ProjectDetail, 'status'> {
  /**
   * postgrestStatus is available on client side only.
   * We use this status to check if a project instance is HEALTHY or not
   * If not we will show ConnectingState and run a polling until it's back online
   */
  postgrestStatus?: 'ONLINE' | 'OFFLINE'
  status: components['schemas']['ProjectDetailResponse']['status']
}

export async function getProjectDetail(
  { slug, ref }: ProjectDetailVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('Organization slug is required')
  if (!ref) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/projects/{ref}', {
    params: { path: { ref } },
    headers: {
      'X-Vela-Organization-Ref': slug,
    },
    signal,
  })

  if (error) handleError(error)
  return data as unknown as Project
}

export type ProjectDetailData = Awaited<ReturnType<typeof getProjectDetail>>
export type ProjectDetailError = ResponseError

export const useProjectDetailQuery = <TData = ProjectDetailData>(
  { slug, ref }: ProjectDetailVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectDetailData, ProjectDetailError, TData> = {}
) => {
  return useQuery<ProjectDetailData, ProjectDetailError, TData>(
    projectKeys.detail(slug, ref),
    ({ signal }) => getProjectDetail({ ref, slug }, signal),
    {
      enabled: enabled && typeof ref !== 'undefined',
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval(data) {
        const result = data && (data as unknown as ProjectDetailData)
        const status = result && result.status
        const connectionString = result && result.connectionString

        if (
          status === 'COMING_UP' ||
          status === 'UNKNOWN' ||
          !isValidConnString(connectionString)
        ) {
          return 5 * 1000 // 5 seconds
        }

        return false
      },
      ...options,
    }
  )
}

export function invalidateProjectDetailsQuery(client: QueryClient, slug: string, ref: string) {
  return client.invalidateQueries(projectKeys.detail(slug, ref))
}

export function prefetchProjectDetail(client: QueryClient, { slug, ref }: ProjectDetailVariables) {
  return client.fetchQuery(projectKeys.detail(slug, ref), ({ signal }) =>
    getProjectDetail({ slug, ref }, signal)
  )
}

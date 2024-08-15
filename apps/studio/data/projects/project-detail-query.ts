import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectDetailVariables = { ref?: string }

export type ProjectMinimal = components['schemas']['ProjectInfo']
export type ProjectDetail = components['schemas']['ProjectDetailResponse']

export interface Project extends Omit<ProjectDetail, 'status'> {
  /**
   * postgrestStatus is available on client side only.
   * We use this status to check if a project instance is HEALTHY or not
   * If not we will show ConnectingState and run a polling until it's back online
   */
  postgrestStatus?: 'ONLINE' | 'OFFLINE'
  status: components['schemas']['ResourceWithServicesStatusResponse']['status']
}

export async function getProjectDetail({ ref }: ProjectDetailVariables, signal?: AbortSignal) {
  if (!ref) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/projects/{ref}', {
    params: { path: { ref } },
    signal,
  })

  if (error) handleError(error)
  return data as unknown as Project
}

export type ProjectDetailData = Awaited<ReturnType<typeof getProjectDetail>>
export type ProjectDetailError = ResponseError

export const useProjectDetailQuery = <TData = ProjectDetailData>(
  { ref }: ProjectDetailVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectDetailData, ProjectDetailError, TData> = {}
) =>
  useQuery<ProjectDetailData, ProjectDetailError, TData>(
    projectKeys.detail(ref),
    ({ signal }) => getProjectDetail({ ref }, signal),
    {
      enabled: enabled && typeof ref !== 'undefined',
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval(data) {
        const status = data && (data as unknown as ProjectDetailData).status

        if (status === 'COMING_UP' || status === 'UNKNOWN') {
          return 5 * 1000 // 5 seconds
        }

        return false
      },
      ...options,
    }
  )

export function invalidateProjectDetailsQuery(client: QueryClient, ref: string) {
  return client.invalidateQueries(projectKeys.detail(ref))
}

// get the cached value or fallback to fetching it
export async function getCachedProjectDetail(
  client: QueryClient,
  ref: string | undefined
): Promise<ProjectDetailData | undefined> {
  if (!ref) return undefined

  const cached = client.getQueryData<ProjectDetailData>(projectKeys.detail(ref))
  if (cached) return cached

  return await client.fetchQuery<ProjectDetailData, ProjectDetailError>(projectKeys.detail(ref))
}

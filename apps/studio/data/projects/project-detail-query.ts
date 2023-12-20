import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { projectKeys } from './keys'
import { components } from 'data/api'

export type ProjectDetailVariables = { ref?: string }

export type ProjectMinimal = components['schemas']['ProjectInfo']
export type ProjectDetail = components['schemas']['ProjectDetailResponse']

export interface Project extends ProjectDetail {
  /**
   * postgrestStatus is available on client side only.
   * We use this status to check if a project instance is HEALTHY or not
   * If not we will show ConnectingState and run a polling until it's back online
   */
  postgrestStatus?: 'ONLINE' | 'OFFLINE'
}

export async function getProjectDetail({ ref }: ProjectDetailVariables, signal?: AbortSignal) {
  if (!ref) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/projects/{ref}', {
    params: { path: { ref } },
    signal,
  })

  if (error) throw error
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

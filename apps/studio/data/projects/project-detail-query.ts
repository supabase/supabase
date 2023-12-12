import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { projectKeys } from './keys'
import { components } from 'data/api'

export type ProjectDetailVariables = { ref?: string }

export type Project = components['schemas']['ProjectDetailResponse']

export async function getProjectDetail({ ref }: ProjectDetailVariables, signal?: AbortSignal) {
  if (!ref) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/projects/{ref}', {
    params: { path: { ref } },
    signal,
  })

  if (error) throw error
  return data
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

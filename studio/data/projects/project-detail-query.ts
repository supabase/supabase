import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Project, ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectDetailVariables = { ref?: string }

export async function getProjectDetail({ ref }: ProjectDetailVariables, signal?: AbortSignal) {
  if (!ref) throw new Error('Project ref is required')

  const data = await get<Project>(`${API_URL}/projects/${ref}`, { signal })
  if (!isResponseOk(data)) throw data.error
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

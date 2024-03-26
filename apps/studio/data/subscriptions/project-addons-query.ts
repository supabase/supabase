import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { subscriptionKeys } from './keys'
import type { ResponseError } from 'types'

export type ProjectAddonsVariables = {
  projectRef?: string
}

export async function getProjectAddons(
  { projectRef }: ProjectAddonsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { error, data } = await get(`/platform/projects/{ref}/billing/addons`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) throw error
  return data
}

export type ProjectAddonsData = Awaited<ReturnType<typeof getProjectAddons>>
export type ProjectAddonsError = ResponseError

export const useProjectAddonsQuery = <TData = ProjectAddonsData>(
  { projectRef }: ProjectAddonsVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectAddonsData, ProjectAddonsError, TData> = {}
) =>
  useQuery<ProjectAddonsData, ProjectAddonsError, TData>(
    subscriptionKeys.addons(projectRef),
    ({ signal }) => getProjectAddons({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

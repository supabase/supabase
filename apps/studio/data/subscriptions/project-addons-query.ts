import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { subscriptionKeys } from './keys'

export type ProjectAddonsVariables = {
  projectRef?: string
}

// [Joshen] For any customer facing text - let's use "Add-on" hyphenated
// Will need to address consistency across the dashboard

export async function getProjectAddons(
  { projectRef }: ProjectAddonsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { error, data } = await get(`/platform/projects/{ref}/billing/addons`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
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
      enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined',
      staleTime: 60 * 60 * 1000, // 60 minutes
      ...options,
    }
  )

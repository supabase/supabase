import { useQuery } from '@tanstack/react-query'

import { subscriptionKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import { EMPTY_ARR } from '@/lib/void'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

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
  return {
    ...data,
    selected_addons: Array.isArray(data?.selected_addons) ? data.selected_addons : EMPTY_ARR,
    available_addons: Array.isArray(data?.available_addons) ? data.available_addons : EMPTY_ARR,
  }
}

export type ProjectAddonsData = Awaited<ReturnType<typeof getProjectAddons>>
export type ProjectAddonsError = ResponseError

export const useProjectAddonsQuery = <TData = ProjectAddonsData>(
  { projectRef }: ProjectAddonsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectAddonsData, ProjectAddonsError, TData> = {}
) =>
  useQuery<ProjectAddonsData, ProjectAddonsError, TData>({
    queryKey: subscriptionKeys.addons(projectRef),
    queryFn: ({ signal }) => getProjectAddons({ projectRef }, signal),
    enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined',
    staleTime: 60 * 60 * 1000,
    ...options,
  })

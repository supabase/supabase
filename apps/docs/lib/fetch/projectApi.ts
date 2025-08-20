import type { ResponseError } from '~/types/fetch'
import { get } from './fetchWrappers'
import { UseQueryOptions, useQuery } from '@tanstack/react-query'

const projectApiKeys = {
  api: (projectRef: string | undefined) => ['projects', projectRef, 'api'] as const,
}

export interface ProjectApiVariables {
  orgSlug?: string
  projectRef?: string
}

async function getProjectApi({ orgSlug, projectRef }: ProjectApiVariables, signal?: AbortSignal) {
  if (!orgSlug) {
    throw Error('orgSlug is required')
  }
  if (!projectRef) {
    throw Error('projectRef is required')
  }

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/settings', {
    params: {
      path: {
        slug: orgSlug,
        ref: projectRef
      },
    },
    signal,
  })
  if (error) throw error

  return data
}

export type ProjectApiData = Awaited<ReturnType<typeof getProjectApi>>
type ProjectApiError = ResponseError

export function useProjectApiQuery<TData = ProjectApiData>(
  { projectRef }: ProjectApiVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseQueryOptions<ProjectApiData, ProjectApiError, TData>, 'queryKey'> = {}
) {
  return useQuery<ProjectApiData, ProjectApiError, TData>({
    queryKey: projectApiKeys.api(projectRef),
    queryFn: ({ signal }) => getProjectApi({ projectRef }, signal),
    enabled,
    ...options,
  })
}

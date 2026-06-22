import type { ResponseError } from '~/types/fetch'
import { get } from './fetchWrappers'
import { UseQueryOptions, useQuery } from '@tanstack/react-query'

const projectApiKeys = {
  api: (projectRef: string | undefined) => ['projects', projectRef, 'api'] as const,
  settings: (projectRef: string | undefined) => ['projects', projectRef, 'settings'] as const,
}

export interface ProjectApiVariables {
  projectRef?: string
}
type ProjectApiError = ResponseError

export type ProjectKeys = Awaited<ReturnType<typeof getProjectKeys>>

export type ProjectSettings = Awaited<ReturnType<typeof getProjectSettings>>

async function getProjectKeys({ projectRef }: ProjectApiVariables, signal?: AbortSignal) {
  if (!projectRef) {
    throw Error('projectRef is required')
  }

  const { data, error } = await get('/v1/projects/{ref}/api-keys', {
    params: {
      path: { ref: projectRef },
    },
    signal,
  })
  if (error) throw error
  return data
}

async function getProjectSettings({ projectRef }: ProjectApiVariables, signal?: AbortSignal) {
  if (!projectRef) {
    throw Error('projectRef is required')
  }

  const { data, error } = await get('/platform/projects/{ref}/settings', {
    params: {
      path: { ref: projectRef },
    },
    signal,
  })
  if (error) throw error
  return data
}

export function useProjectKeysQuery<TData = ProjectKeys>(
  { projectRef }: ProjectApiVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseQueryOptions<ProjectKeys, ProjectApiError, TData>, 'queryKey'> = {}
) {
  return useQuery<ProjectKeys, ProjectApiError, TData>({
    queryKey: projectApiKeys.api(projectRef),
    queryFn: ({ signal }) => getProjectKeys({ projectRef }, signal),
    enabled,
    ...options,
  })
}

export function useProjectSettingsQuery<TData = ProjectSettings>(
  { projectRef }: ProjectApiVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseQueryOptions<ProjectSettings, ProjectApiError, TData>, 'queryKey'> = {}
) {
  return useQuery<ProjectSettings, ProjectApiError, TData>({
    queryKey: projectApiKeys.settings(projectRef),
    queryFn: ({ signal }) => getProjectSettings({ projectRef }, signal),
    enabled,
    ...options,
  })
}

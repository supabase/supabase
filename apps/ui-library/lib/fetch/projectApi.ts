import { queryOptions } from '@tanstack/react-query'

import { get } from './fetchWrappers'

export interface ProjectApiVariables {
  projectRef?: string
}

export type ProjectKeys = Awaited<ReturnType<typeof getProjectKeys>>

export type ProjectSettings = Awaited<ReturnType<typeof getProjectSettings>>

const projectApiKeys = {
  api: (projectRef: string | undefined) => ['projects', projectRef, 'api'] as const,
  settings: (projectRef: string | undefined) => ['projects', projectRef, 'settings'] as const,
}

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

export const projectKeysQueryOptions = (
  { projectRef }: ProjectApiVariables,
  { enabled = true }: { enabled?: boolean } = { enabled: true }
) => {
  return queryOptions({
    queryKey: projectApiKeys.api(projectRef),
    queryFn: ({ signal }) => getProjectKeys({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
  })
}

export const projectSettingsQueryOptions = (
  { projectRef }: ProjectApiVariables,
  { enabled = true }: { enabled?: boolean } = { enabled: true }
) => {
  return queryOptions({
    queryKey: projectApiKeys.settings(projectRef),
    queryFn: ({ signal }) => getProjectSettings({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
  })
}

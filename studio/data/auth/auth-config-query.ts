import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { components } from 'data/api'
import { get } from 'data/fetchers'
import { useCallback } from 'react'
import { ResponseError } from 'types'
import { authKeys } from './keys'

export type AuthConfigVariables = {
  projectRef?: string
}

export type AuthConfigResponse = components['schemas']['GetGoTrueConfigResponse']

export async function getProjectAuthConfig(
  { projectRef }: AuthConfigVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const { data, error } = await get('/platform/auth/{ref}/config', {
    params: {
      path: { ref: projectRef },
    },
    signal,
  })

  if (error) throw error

  return data
}

export type ProjectAuthConfigData = Awaited<ReturnType<typeof getProjectAuthConfig>>
export type ProjectAuthConfigError = ResponseError

export const useAuthConfigQuery = <TData = ProjectAuthConfigData>(
  { projectRef }: AuthConfigVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectAuthConfigData, ProjectAuthConfigError, TData> = {}
) =>
  useQuery<ProjectAuthConfigData, ProjectAuthConfigError, TData>(
    authKeys.authConfig(projectRef),
    ({ signal }) => getProjectAuthConfig({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useAuthConfigPrefetch = ({ projectRef }: AuthConfigVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(authKeys.authConfig(projectRef), ({ signal }) =>
        getProjectAuthConfig({ projectRef }, signal)
      )
    }
  }, [client, projectRef])
}

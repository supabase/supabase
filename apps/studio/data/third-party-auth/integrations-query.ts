import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { keys } from './keys'

export type GetThirdPartyAuthIntegrationsVariables = {
  projectRef?: string
}

export type ThirdPartyAuthIntegration = components['schemas']['ThirdPartyAuth']

export async function getThirdPartyAuthIntegrations(
  { projectRef }: GetThirdPartyAuthIntegrationsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/v1/projects/{ref}/config/auth/third-party-auth', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ThirdPartyAuthIntegrationsData = Awaited<
  ReturnType<typeof getThirdPartyAuthIntegrations>
>

export const useThirdPartyAuthIntegrationsQuery = <TData = ThirdPartyAuthIntegrationsData>(
  { projectRef }: GetThirdPartyAuthIntegrationsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ThirdPartyAuthIntegrationsData, ResponseError, TData> = {}
) =>
  useQuery<ThirdPartyAuthIntegrationsData, ResponseError, TData>(
    keys.integrations(projectRef),
    ({ signal }) => getThirdPartyAuthIntegrations({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

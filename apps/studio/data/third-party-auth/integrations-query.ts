import { queryOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { keys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type ThirdPartyAuthIntegrationsVariables = {
  projectRef?: string
}

export type ThirdPartyAuthIntegrationsError = ResponseError

export type ThirdPartyAuthIntegration = components['schemas']['ThirdPartyAuth']

async function getThirdPartyAuthIntegrations(
  { projectRef }: ThirdPartyAuthIntegrationsVariables,
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

export const thirdPartyAuthIntegrationsQueryOptions = (
  { projectRef }: ThirdPartyAuthIntegrationsVariables,
  { enabled = true }: { enabled?: boolean } = { enabled: true }
) => {
  return queryOptions({
    queryKey: keys.integrations(projectRef),
    queryFn: ({ signal }) => getThirdPartyAuthIntegrations({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
  })
}

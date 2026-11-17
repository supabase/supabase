import { components } from 'api-types'

import { keys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { grantedQueryOptions, type GrantedQueryCallerOptions } from '@/data/granted-query-options'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'

export type ThirdPartyAuthIntegrationsGrant = GrantFor<
  'get',
  '/v1/projects/{ref}/config/auth/third-party-auth'
>

export type ThirdPartyAuthIntegrationsVariables = {
  projectRef?: string
  grant?: ThirdPartyAuthIntegrationsGrant
}

export type ThirdPartyAuthIntegrationsError = StudioError

export type ThirdPartyAuthIntegration = components['schemas']['ThirdPartyAuth_Output']

async function getThirdPartyAuthIntegrations(
  { projectRef, grant }: { projectRef: string; grant: ThirdPartyAuthIntegrationsGrant },
  signal?: AbortSignal
) {
  const { data, error } = await get('/v1/projects/{ref}/config/auth/third-party-auth', {
    params: { path: { ref: projectRef } },
    signal,
    grant,
  })

  if (error) handleError(error)
  return data
}

export type ThirdPartyAuthIntegrationsData = Awaited<
  ReturnType<typeof getThirdPartyAuthIntegrations>
>

export const thirdPartyAuthIntegrationsQueryOptions = <TData = ThirdPartyAuthIntegrationsData>(
  { projectRef, grant }: ThirdPartyAuthIntegrationsVariables,
  options?: GrantedQueryCallerOptions<
    ThirdPartyAuthIntegrationsData,
    ThirdPartyAuthIntegrationsError,
    TData,
    ReturnType<typeof keys.integrations>
  >
) =>
  grantedQueryOptions(
    {
      queryKey: keys.integrations(projectRef),
      queryFn:
        projectRef && grant
          ? ({ signal }) => getThirdPartyAuthIntegrations({ projectRef, grant }, signal)
          : undefined,
    },
    options
  )

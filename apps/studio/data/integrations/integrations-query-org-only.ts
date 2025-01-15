import { createQuery } from 'react-query-kit'

import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import type { Integration, IntegrationsVariables } from './integrations.types'

export type IntegrationsResponse = Integration[]

export async function getIntegrations(
  { orgSlug }: IntegrationsVariables,
  { signal }: { signal: AbortSignal }
) {
  const response = await get(`${API_URL}/integrations/${orgSlug}?expand=true`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as IntegrationsResponse
}

export type IntegrationsData = Awaited<ReturnType<typeof getIntegrations>>
export type ProjectIntegrationConnectionsData = Awaited<ReturnType<typeof getIntegrations>>
export type IntegrationsError = ResponseError

export const useOrgIntegrationsQuery = createQuery<
  IntegrationsData,
  IntegrationsVariables,
  IntegrationsError
>({
  queryKey: ['organizations', 'integrations'],
  fetcher: getIntegrations,
})

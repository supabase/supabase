import { useQuery } from '@tanstack/react-query'

import { platformWebhooksKeys } from './keys'
import { listWebhookEndpoints, type WebhookScopeParams } from './platform-webhooks-fetchers'
import { toWebhookEndpoint } from './platform-webhooks-mappers'
import type { WebhookEndpoint } from '@/components/interfaces/Platform/Webhooks/PlatformWebhooks.types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

interface WebhookEndpointsVariables {
  scope: WebhookScopeParams
  limit?: number
  offset?: number
}

async function getWebhookEndpoints(
  { scope, limit, offset }: WebhookEndpointsVariables,
  signal?: AbortSignal
): Promise<WebhookEndpoint[]> {
  const result = await listWebhookEndpoints(scope, { limit, offset }, signal)
  return (result?.data ?? []).map(toWebhookEndpoint)
}

export type WebhookEndpointsData = Awaited<ReturnType<typeof getWebhookEndpoints>>

export const useWebhookEndpointsQuery = <TData = WebhookEndpointsData>(
  variables: WebhookEndpointsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<WebhookEndpointsData, ResponseError, TData> = {}
) => {
  const { scope, limit, offset } = variables

  return useQuery<WebhookEndpointsData, ResponseError, TData>({
    queryKey: platformWebhooksKeys.endpoints(scope, limit, offset),
    queryFn: ({ signal }) => getWebhookEndpoints({ scope, limit, offset }, signal),
    enabled,
    ...options,
  })
}

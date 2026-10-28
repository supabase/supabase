import { useQuery } from '@tanstack/react-query'

import { platformWebhooksKeys } from './keys'
import { listWebhookDeliveries, type WebhookScopeParams } from './platform-webhooks-fetchers'
import { toWebhookDelivery } from './platform-webhooks-mappers'
import type { WebhookDelivery } from '@/components/interfaces/Platform/Webhooks/PlatformWebhooks.types'
import { getDeliveriesRefetchInterval } from '@/components/interfaces/Platform/Webhooks/PlatformWebhooksPage.utils'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

interface WebhookDeliveriesVariables {
  scope: WebhookScopeParams
  endpointId: string
  size?: number
  after?: string
  before?: string
}

async function getWebhookDeliveries(
  { scope, endpointId, size, after, before }: WebhookDeliveriesVariables,
  signal?: AbortSignal
): Promise<WebhookDelivery[]> {
  const result = await listWebhookDeliveries(scope, endpointId, { size, after, before }, signal)
  return (result?.data ?? []).map((delivery) => toWebhookDelivery(delivery, endpointId))
}

export type WebhookDeliveriesData = Awaited<ReturnType<typeof getWebhookDeliveries>>

export const useWebhookDeliveriesQuery = <TData = WebhookDeliveriesData>(
  variables: WebhookDeliveriesVariables,
  {
    enabled = true,
    isLive = false,
    isAwaitingDelivery = false,
    ...options
  }: UseCustomQueryOptions<WebhookDeliveriesData, ResponseError, TData> & {
    isLive?: boolean
    isAwaitingDelivery?: boolean
  } = {}
) => {
  const { scope, endpointId, size, after, before } = variables

  return useQuery<WebhookDeliveriesData, ResponseError, TData>({
    queryKey: platformWebhooksKeys.deliveries(scope, endpointId, size, after, before),
    queryFn: ({ signal }) =>
      getWebhookDeliveries({ scope, endpointId, size, after, before }, signal),
    enabled: enabled && Boolean(endpointId),
    refetchInterval: (query) =>
      getDeliveriesRefetchInterval({
        isLive,
        isAwaitingDelivery,
        deliveries: query.state.data ?? [],
        hasLoadFailed: query.state.status === 'error' && !query.state.data?.length,
      }),
    ...options,
  })
}

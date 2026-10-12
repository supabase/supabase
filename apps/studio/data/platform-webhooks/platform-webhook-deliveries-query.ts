import { useQuery } from '@tanstack/react-query'

import { platformWebhooksKeys } from './keys'
import { listWebhookDeliveries, type WebhookScopeParams } from './platform-webhooks-fetchers'
import { toWebhookDeliverySummary } from './platform-webhooks-mappers'
import type { WebhookDelivery } from '@/components/interfaces/Platform/Webhooks/PlatformWebhooks.types'
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
  return (result?.data ?? []).map((delivery) => toWebhookDeliverySummary(delivery, endpointId))
}

export type WebhookDeliveriesData = Awaited<ReturnType<typeof getWebhookDeliveries>>

export const useWebhookDeliveriesQuery = <TData = WebhookDeliveriesData>(
  variables: WebhookDeliveriesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<WebhookDeliveriesData, ResponseError, TData> = {}
) => {
  const { scope, endpointId, size, after, before } = variables

  return useQuery<WebhookDeliveriesData, ResponseError, TData>({
    queryKey: platformWebhooksKeys.deliveries(scope, endpointId, size, after, before),
    queryFn: ({ signal }) =>
      getWebhookDeliveries({ scope, endpointId, size, after, before }, signal),
    enabled: enabled && Boolean(endpointId),
    ...options,
  })
}

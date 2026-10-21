import type { QueryClient } from '@tanstack/react-query'

import { platformWebhooksKeys } from './keys'
import type { WebhookDeliveriesData } from './platform-webhook-deliveries-query'
import type { WebhookScopeParams } from './platform-webhooks-fetchers'
import type { WebhookDelivery } from '@/components/interfaces/Platform/Webhooks/PlatformWebhooks.types'

// A new delivery always lands on the first page (no cursor), so only that
// cached page should get the placeholder row — other cached pages are untouched.
const isFirstDeliveriesPage = (queryKey: readonly unknown[]) => {
  const filter = queryKey[queryKey.length - 1] as { after?: string; before?: string } | undefined
  return !filter?.after && !filter?.before
}

export const insertPendingDelivery = async (
  queryClient: QueryClient,
  {
    scope,
    endpointId,
    eventType,
    eventId,
  }: Pick<WebhookDelivery, 'eventType' | 'eventId'> & {
    scope: WebhookScopeParams
    endpointId: string
  }
) => {
  // Without this, an in-flight (or poll-triggered) refetch can resolve right after we
  // write the placeholder below and silently overwrite it with the stale pre-event data.
  await queryClient.cancelQueries({
    queryKey: platformWebhooksKeys.deliveriesList(scope, endpointId),
  })

  const pendingDeliveryId = `pending-${endpointId}-${eventId}-${eventType}-${crypto.randomUUID()}`

  const pendingDelivery: WebhookDelivery = {
    id: pendingDeliveryId,
    endpointId,
    eventId,
    eventType,
    eventPayload: {},
    status: 'pending',
    responseCode: 0,
    responseBody: null,
    responseHeaders: null,
    attemptAt: new Date().toISOString(),
  }

  const cachedPages = queryClient.getQueriesData<WebhookDeliveriesData>({
    queryKey: platformWebhooksKeys.deliveriesList(scope, endpointId),
  })

  for (const [queryKey, data] of cachedPages) {
    if (!data || !isFirstDeliveriesPage(queryKey)) continue
    queryClient.setQueryData<WebhookDeliveriesData>(queryKey, {
      ...data,
      deliveries: [pendingDelivery, ...data.deliveries],
    })
  }

  return { pendingDeliveryId }
}

export const removePendingDelivery = (
  queryClient: QueryClient,
  scope: WebhookScopeParams,
  endpointId: string,
  pendingDeliveryId: string | undefined
) => {
  if (!pendingDeliveryId) return

  const cachedPages = queryClient.getQueriesData<WebhookDeliveriesData>({
    queryKey: platformWebhooksKeys.deliveriesList(scope, endpointId),
  })

  for (const [queryKey, data] of cachedPages) {
    if (!data) continue
    queryClient.setQueryData<WebhookDeliveriesData>(queryKey, {
      ...data,
      deliveries: data.deliveries.filter((d) => d.id !== pendingDeliveryId),
    })
  }
}

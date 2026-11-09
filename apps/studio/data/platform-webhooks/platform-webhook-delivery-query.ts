import { useQuery } from '@tanstack/react-query'

import { platformWebhooksKeys } from './keys'
import { getWebhookDelivery, type WebhookScopeParams } from './platform-webhooks-fetchers'
import { toWebhookDelivery } from './platform-webhooks-mappers'
import type { WebhookDelivery } from '@/components/interfaces/Platform/Webhooks/PlatformWebhooks.types'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

interface WebhookDeliveryVariables {
  scope: WebhookScopeParams
  endpointId: string
  id: string
}

async function fetchWebhookDelivery(
  { scope, endpointId, id }: WebhookDeliveryVariables,
  signal?: AbortSignal
): Promise<WebhookDelivery | null> {
  const result = await getWebhookDelivery(scope, id, signal)
  return result?.data ? toWebhookDelivery(result.data, endpointId) : null
}

export type WebhookDeliveryData = Awaited<ReturnType<typeof fetchWebhookDelivery>>

export const useWebhookDeliveryQuery = <TData = WebhookDeliveryData>(
  variables: WebhookDeliveryVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<WebhookDeliveryData, StudioError, TData> = {}
) => {
  const { scope, endpointId, id } = variables

  return useQuery<WebhookDeliveryData, StudioError, TData>({
    queryKey: platformWebhooksKeys.delivery(scope, endpointId, id),
    queryFn: ({ signal }) => fetchWebhookDelivery({ scope, endpointId, id }, signal),
    enabled: enabled && Boolean(id),
    ...options,
  })
}

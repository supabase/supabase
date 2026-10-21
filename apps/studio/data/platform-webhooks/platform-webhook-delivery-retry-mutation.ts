import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformWebhooksKeys } from './keys'
import type { WebhookDeliveriesData } from './platform-webhook-deliveries-query'
import { insertPendingDelivery, removePendingDelivery } from './platform-webhook-pending-delivery'
import {
  isWebhookRateLimitError,
  retryWebhookDelivery,
  type WebhookScopeParams,
} from './platform-webhooks-fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type WebhookDeliveryRetryVariables = {
  scope: WebhookScopeParams
  endpointId: string
  id: string
}

async function retryDelivery({ scope, id }: WebhookDeliveryRetryVariables) {
  return retryWebhookDelivery(scope, id)
}

type WebhookDeliveryRetryData = Awaited<ReturnType<typeof retryDelivery>>
type WebhookDeliveryRetryContext = { pendingDeliveryId: string }

export const useWebhookDeliveryRetryMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    WebhookDeliveryRetryData,
    ResponseError,
    WebhookDeliveryRetryVariables,
    WebhookDeliveryRetryContext
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    WebhookDeliveryRetryData,
    ResponseError,
    WebhookDeliveryRetryVariables,
    WebhookDeliveryRetryContext
  >({
    mutationFn: retryDelivery,
    async onMutate(variables) {
      // Copy the event being retried from whatever page currently has it cached,
      // so the placeholder shows a real event type instead of "unknown".
      const cachedPages = queryClient.getQueriesData<WebhookDeliveriesData>({
        queryKey: platformWebhooksKeys.deliveriesList(variables.scope, variables.endpointId),
      })
      const retriedDelivery = cachedPages
        .flatMap(([, data]) => data?.deliveries ?? [])
        .find((delivery) => delivery.id === variables.id)

      return await insertPendingDelivery(queryClient, {
        scope: variables.scope,
        endpointId: variables.endpointId,
        eventType: retriedDelivery?.eventType ?? 'unknown',
        eventId: retriedDelivery?.eventId ?? 'pending',
      })
    },
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: platformWebhooksKeys.deliveriesList(variables.scope, variables.endpointId),
      })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      removePendingDelivery(
        queryClient,
        variables.scope,
        variables.endpointId,
        context?.pendingDeliveryId
      )

      if (onError === undefined) {
        if (isWebhookRateLimitError(data)) {
          toast.error('Too many requests. Wait a minute and try again (limit: 10 per minute).')
        } else {
          toast.error(`Failed to retry delivery: ${data.message}`)
        }
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

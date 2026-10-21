import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformWebhooksKeys } from './keys'
import { insertPendingDelivery, removePendingDelivery } from './platform-webhook-pending-delivery'
import {
  isWebhookRateLimitError,
  sendTestWebhookEvent,
  type WebhookScopeParams,
} from './platform-webhooks-fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type WebhookEndpointTestVariables = {
  scope: WebhookScopeParams
  id: string
  eventType?: string
}

async function testEndpoint({ scope, id, eventType }: WebhookEndpointTestVariables) {
  return sendTestWebhookEvent(scope, id, eventType)
}

type WebhookEndpointTestData = Awaited<ReturnType<typeof testEndpoint>>
type WebhookEndpointTestContext = { pendingDeliveryId: string }

export const useWebhookEndpointTestMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    WebhookEndpointTestData,
    ResponseError,
    WebhookEndpointTestVariables,
    WebhookEndpointTestContext
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    WebhookEndpointTestData,
    ResponseError,
    WebhookEndpointTestVariables,
    WebhookEndpointTestContext
  >({
    mutationFn: testEndpoint,
    async onMutate(variables) {
      return await insertPendingDelivery(queryClient, {
        scope: variables.scope,
        endpointId: variables.id,
        eventType: variables.eventType ?? 'unknown',
        eventId: 'pending',
      })
    },
    async onSuccess(data, variables, context) {
      // The test delivery lands asynchronously — invalidate so it shows up once it does.
      await queryClient.invalidateQueries({
        queryKey: platformWebhooksKeys.deliveriesList(variables.scope, variables.id),
      })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      removePendingDelivery(queryClient, variables.scope, variables.id, context?.pendingDeliveryId)

      if (onError === undefined) {
        if (isWebhookRateLimitError(data)) {
          toast.error('Too many requests. Wait a minute and try again (limit: 10 per minute).')
        } else {
          toast.error(`Failed to send test event: ${data.message}`)
        }
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

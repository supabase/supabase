import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformWebhooksKeys } from './keys'
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

export const useWebhookDeliveryRetryMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<WebhookDeliveryRetryData, ResponseError, WebhookDeliveryRetryVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<WebhookDeliveryRetryData, ResponseError, WebhookDeliveryRetryVariables>({
    mutationFn: retryDelivery,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: platformWebhooksKeys.deliveries(variables.scope, variables.endpointId),
      })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        if (isWebhookRateLimitError(data)) {
          toast.error('Too many retries — wait a minute and try again (limit: 10 per minute).')
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

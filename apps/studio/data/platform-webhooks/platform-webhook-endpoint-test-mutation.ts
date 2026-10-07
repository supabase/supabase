import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformWebhooksKeys } from './keys'
import { sendTestWebhookEvent, type WebhookScopeParams } from './platform-webhooks-fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type WebhookEndpointTestVariables = {
  scope: WebhookScopeParams
  id: string
}

async function testEndpoint({ scope, id }: WebhookEndpointTestVariables) {
  return sendTestWebhookEvent(scope, id)
}

type WebhookEndpointTestData = Awaited<ReturnType<typeof testEndpoint>>

export const useWebhookEndpointTestMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<WebhookEndpointTestData, ResponseError, WebhookEndpointTestVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<WebhookEndpointTestData, ResponseError, WebhookEndpointTestVariables>({
    mutationFn: testEndpoint,
    async onSuccess(data, variables, context) {
      // The test delivery lands asynchronously — invalidate so it shows up once it does.
      await queryClient.invalidateQueries({
        queryKey: platformWebhooksKeys.deliveries(variables.scope, variables.id),
      })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to send test event: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

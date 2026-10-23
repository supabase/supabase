import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformWebhooksKeys } from './keys'
import { deleteWebhookEndpoint, type WebhookScopeParams } from './platform-webhooks-fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type WebhookEndpointDeleteVariables = {
  scope: WebhookScopeParams
  id: string
}

async function deleteEndpoint({ scope, id }: WebhookEndpointDeleteVariables) {
  return deleteWebhookEndpoint(scope, id)
}

type WebhookEndpointDeleteData = Awaited<ReturnType<typeof deleteEndpoint>>

export const useWebhookEndpointDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    WebhookEndpointDeleteData,
    ResponseError,
    WebhookEndpointDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<WebhookEndpointDeleteData, ResponseError, WebhookEndpointDeleteVariables>({
    mutationFn: deleteEndpoint,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: platformWebhooksKeys.endpoints(variables.scope),
      })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete webhook endpoint: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

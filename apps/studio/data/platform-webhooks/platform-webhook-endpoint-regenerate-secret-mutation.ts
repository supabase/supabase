import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformWebhooksKeys } from './keys'
import {
  regenerateWebhookEndpointSecret,
  type WebhookScopeParams,
} from './platform-webhooks-fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type WebhookEndpointRegenerateSecretVariables = {
  scope: WebhookScopeParams
  id: string
  signingSecret: string
}

async function regenerateSecret({
  scope,
  id,
  signingSecret,
}: WebhookEndpointRegenerateSecretVariables) {
  await regenerateWebhookEndpointSecret(scope, id, signingSecret)
  // The server never returns the secret — hand back what we sent so callers can reveal it.
  return { signingSecret }
}

type WebhookEndpointRegenerateSecretData = Awaited<ReturnType<typeof regenerateSecret>>

export const useWebhookEndpointRegenerateSecretMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    WebhookEndpointRegenerateSecretData,
    ResponseError,
    WebhookEndpointRegenerateSecretVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    WebhookEndpointRegenerateSecretData,
    ResponseError,
    WebhookEndpointRegenerateSecretVariables
  >({
    mutationFn: regenerateSecret,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: platformWebhooksKeys.endpoint(variables.scope, variables.id),
      })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to regenerate signing secret: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

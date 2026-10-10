import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformWebhooksKeys } from './keys'
import { updateWebhookEndpoint, type WebhookScopeParams } from './platform-webhooks-fetchers'
import { toWebhookEndpoint, toWebhookEndpointAttributes } from './platform-webhooks-mappers'
import type {
  UpsertWebhookEndpointInput,
  WebhookEndpoint,
} from '@/components/interfaces/Platform/Webhooks/PlatformWebhooks.types'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type WebhookEndpointUpdateVariables = {
  scope: WebhookScopeParams
  id: string
  input: UpsertWebhookEndpointInput
}

async function updateEndpoint({
  scope,
  id,
  input,
}: WebhookEndpointUpdateVariables): Promise<WebhookEndpoint> {
  const attributes = toWebhookEndpointAttributes(input)
  // Edits never rotate the secret here — that's a separate, explicit "Regenerate secret" action.
  const result = await updateWebhookEndpoint(scope, id, {
    ...attributes,
    signing_secret: undefined,
  })
  if (!result?.data) throw new Error('Endpoint was updated but no data was returned')

  // See the comment in platform-webhook-endpoint-create-mutation.ts — `name` isn't
  // persisted by the server, so it's carried through from what the user submitted.
  return { ...toWebhookEndpoint(result.data), name: input.name }
}

type WebhookEndpointUpdateData = Awaited<ReturnType<typeof updateEndpoint>>

export const useWebhookEndpointUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    WebhookEndpointUpdateData,
    ResponseError,
    WebhookEndpointUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<WebhookEndpointUpdateData, ResponseError, WebhookEndpointUpdateVariables>({
    mutationFn: updateEndpoint,
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: platformWebhooksKeys.endpoints(variables.scope),
        }),
        queryClient.invalidateQueries({
          queryKey: platformWebhooksKeys.endpoint(variables.scope, variables.id),
        }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update webhook endpoint: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

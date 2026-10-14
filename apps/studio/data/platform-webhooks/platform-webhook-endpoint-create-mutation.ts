import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformWebhooksKeys } from './keys'
import { createWebhookEndpoint, type WebhookScopeParams } from './platform-webhooks-fetchers'
import { toWebhookEndpoint, toWebhookEndpointAttributes } from './platform-webhooks-mappers'
import type {
  UpsertWebhookEndpointInput,
  WebhookEndpoint,
} from '@/components/interfaces/Platform/Webhooks/PlatformWebhooks.types'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type WebhookEndpointCreateVariables = {
  scope: WebhookScopeParams
  input: UpsertWebhookEndpointInput
}

async function createEndpoint({
  scope,
  input,
}: WebhookEndpointCreateVariables): Promise<WebhookEndpoint> {
  const attributes = toWebhookEndpointAttributes(input)
  if (!attributes.signing_secret) throw new Error('A signing secret is required')

  const result = await createWebhookEndpoint(scope, {
    ...attributes,
    signing_secret: attributes.signing_secret,
  })
  if (!result?.data) throw new Error('Endpoint was created but no data was returned')

  // The server never stores `name` (see PlatformWebhooks.types.ts) — carry through
  // what the user typed so it's visible for this session, even though it won't
  // survive a refetch or page reload.
  return { ...toWebhookEndpoint(result.data), name: input.name }
}

type WebhookEndpointCreateData = Awaited<ReturnType<typeof createEndpoint>>

export const useWebhookEndpointCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    WebhookEndpointCreateData,
    ResponseError,
    WebhookEndpointCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<WebhookEndpointCreateData, ResponseError, WebhookEndpointCreateVariables>({
    mutationFn: createEndpoint,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: platformWebhooksKeys.endpoints(variables.scope),
      })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create webhook endpoint: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

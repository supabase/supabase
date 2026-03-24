import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import { organizationKeys } from 'data/organizations/keys'
import { castOrganizationResponseToOrganization } from 'data/organizations/organizations-query'
import { permissionKeys } from 'data/permissions/keys'
import type { ResponseError, UseCustomMutationOptions } from 'types'

export type PendingSubscriptionCreateVariables = {
  payment_intent_id: string
  name: string
  kind?: string
  size?: string
}

export async function confirmPendingSubscriptionCreate({
  payment_intent_id,
  name,
  kind,
  size,
}: PendingSubscriptionCreateVariables) {
  const { data, error } = await post('/platform/organizations/confirm-subscription', {
    body: {
      payment_intent_id,
      name,
      kind,
      size,
    },
  })

  if (error) handleError(error)
  return data
}

type PendingSubscriptionCreateData = Awaited<ReturnType<typeof confirmPendingSubscriptionCreate>>

export const useConfirmPendingSubscriptionCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    PendingSubscriptionCreateData,
    ResponseError,
    PendingSubscriptionCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    PendingSubscriptionCreateData,
    ResponseError,
    PendingSubscriptionCreateVariables
  >({
    mutationFn: (vars) => confirmPendingSubscriptionCreate(vars),
    async onSuccess(data, variables, context) {
      // Handle 202 Accepted - show toast and skip query updates
      if (data && 'message' in data && !('slug' in data)) {
        const pendingResponse = data as components['schemas']['PendingConfirmationResponse']
        toast.success(pendingResponse.message, {
          dismissible: true,
          duration: 10_000,
        })
        return
      }

      // [Joshen] We're manually updating the query client here as the org's subscription is
      // created async, and the invalidation will happen too quick where the GET organizations
      // endpoint will error out with a 500 since the subscription isn't created yet.
      queryClient.setQueriesData(
        {
          queryKey: organizationKeys.list(),
          exact: true,
        },
        (prev: any) => {
          if (!prev) return prev
          return [
            ...prev,
            castOrganizationResponseToOrganization(
              data as components['schemas']['OrganizationResponse']
            ),
          ]
        }
      )

      await queryClient.invalidateQueries({ queryKey: permissionKeys.list() })

      // todo replace plan in org
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(data.message, {
          dismissible: true,
          duration: 10_000,
        })
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

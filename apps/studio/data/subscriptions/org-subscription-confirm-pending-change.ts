import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from 'data/organizations/keys'
import { permissionKeys } from 'data/permissions/keys'
import { castOrganizationResponseToOrganization } from 'data/organizations/organizations-query'
import type { components } from 'api-types'

export type PendingSubscriptionChangeVariables = {
  payment_intent_id: string
  name: string
  kind?: string
  size?: string
}

export async function confirmPendingSubscriptionChange({
  payment_intent_id,
  name,
  kind,
  size,
}: PendingSubscriptionChangeVariables) {
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

type PendingSubscriptionChangeData = Awaited<ReturnType<typeof confirmPendingSubscriptionChange>>

export const useConfirmPendingSubscriptionChangeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    PendingSubscriptionChangeData,
    ResponseError,
    PendingSubscriptionChangeVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    PendingSubscriptionChangeData,
    ResponseError,
    PendingSubscriptionChangeVariables
  >((vars) => confirmPendingSubscriptionChange(vars), {
    async onSuccess(data, variables, context) {
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

      await queryClient.invalidateQueries(permissionKeys.list())

      // todo replace plan in org
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to confirm payment: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from 'data/organizations/keys'
import { subscriptionKeys } from './keys'
import { usageKeys } from 'data/usage/keys'
import { invoicesKeys } from 'data/invoices/keys'

export type PendingSubscriptionChangeVariables = {
  payment_intent_id: string
  slug?: string
}

export async function confirmPendingSubscriptionChange({
  payment_intent_id,
  slug,
}: PendingSubscriptionChangeVariables) {
  if (!slug) {
    throw new Error('Organization slug is required to confirm pending subscription change')
  }

  const { data, error } = await post(
    '/platform/organizations/{slug}/billing/subscription/confirm',
    {
      params: {
        path: {
          slug,
        },
      },
      body: {
        payment_intent_id,
      },
    }
  )

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
      const { slug } = variables

      // [Kevin] Backend can return stale data as it's waiting for the Stripe-sync to complete. Until that's solved in the backend
      // we are going back to monkey here and delay the invalidation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      await Promise.all([
        queryClient.invalidateQueries(subscriptionKeys.orgSubscription(slug)),
        queryClient.invalidateQueries(subscriptionKeys.orgPlans(slug)),
        queryClient.invalidateQueries(usageKeys.orgUsage(slug)),
        queryClient.invalidateQueries(invoicesKeys.orgUpcomingPreview(slug)),
        queryClient.invalidateQueries(organizationKeys.detail(slug)),
        queryClient.invalidateQueries(organizationKeys.list()),
        queryClient.invalidateQueries(organizationKeys.paymentMethods(slug)),
      ])

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

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import { invoicesKeys } from 'data/invoices/keys'
import { organizationKeys } from 'data/organizations/keys'
import { usageKeys } from 'data/usage/keys'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { subscriptionKeys } from './keys'

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
  UseCustomMutationOptions<
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
  >({
    mutationFn: (vars) => confirmPendingSubscriptionChange(vars),
    async onSuccess(data, variables, context) {
      const { slug } = variables

      // Handle 202 Accepted - show toast and skip query invalidation
      // The 200 success response returns void, so if data exists it must be 202
      if (data && 'message' in data) {
        const pendingResponse = data as components['schemas']['PendingConfirmationResponse']
        toast.success(pendingResponse.message, {
          dismissible: true,
          duration: 10_000,
        })
        return
      }

      // [Kevin] Backend can return stale data as it's waiting for the Stripe-sync to complete. Until that's solved in the backend
      // we are going back to monkey here and delay the invalidation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.orgSubscription(slug) }),
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.orgPlans(slug) }),
        queryClient.invalidateQueries({ queryKey: usageKeys.orgUsage(slug) }),
        queryClient.invalidateQueries({ queryKey: invoicesKeys.orgUpcomingPreview(slug) }),
        queryClient.invalidateQueries({ queryKey: organizationKeys.detail(slug) }),
        queryClient.invalidateQueries({ queryKey: organizationKeys.list() }),
        queryClient.invalidateQueries({ queryKey: organizationKeys.paymentMethods(slug) }),
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

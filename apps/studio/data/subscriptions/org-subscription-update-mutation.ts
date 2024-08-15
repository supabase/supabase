import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { handleError, put } from 'data/fetchers'
import { toast } from 'react-hot-toast'
import type { ResponseError } from 'types/base'
import { subscriptionKeys } from './keys'
import { usageKeys } from 'data/usage/keys'
import type { SubscriptionTier } from './types'
import { invoicesKeys } from 'data/invoices/keys'

export type OrgSubscriptionUpdateVariables = {
  slug: string
  paymentMethod?: string
  tier: SubscriptionTier
}

export async function updateOrgSubscription({
  slug,
  tier,
  paymentMethod,
}: OrgSubscriptionUpdateVariables) {
  if (!slug) throw new Error('slug is required')
  if (!tier) throw new Error('tier is required')

  const payload: { tier: SubscriptionTier; payment_method?: string } = { tier }
  if (paymentMethod !== undefined) payload.payment_method = paymentMethod

  const { error, data } = await put(`/platform/organizations/{slug}/billing/subscription`, {
    body: {
      payment_method: payload.payment_method,
      tier: payload.tier,
    },
    params: { path: { slug } },
  })

  if (error) handleError(error)
  return data
}

type OrgSubscriptionUpdateData = Awaited<ReturnType<typeof updateOrgSubscription>>

export const useOrgSubscriptionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrgSubscriptionUpdateData, ResponseError, OrgSubscriptionUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrgSubscriptionUpdateData, ResponseError, OrgSubscriptionUpdateVariables>(
    (vars) => updateOrgSubscription(vars),
    {
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
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update subscription: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

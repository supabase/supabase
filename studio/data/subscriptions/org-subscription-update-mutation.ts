import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { put } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError, SupaResponseV2 } from 'types/base'
import { subscriptionKeys } from './keys'

export type SubscriptionTier =
  | 'tier_free'
  | 'tier_pro'
  | 'tier_payg'
  | 'tier_team'
  | 'tier_enterprise'

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

  const payload: { tier: string; payment_method?: string } = { tier }
  if (paymentMethod !== undefined) payload.payment_method = paymentMethod

  const response = (await put(
    `${API_URL}/organizations/${slug}/billing/subscription`,
    payload
  )) as SupaResponseV2<void>
  if (typeof response === 'object' && response !== null && 'error' in response) throw response.error
  return response
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
        await queryClient.invalidateQueries(subscriptionKeys.orgSubscription(slug))
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

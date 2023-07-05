import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { put } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { subscriptionKeys } from './keys'
import { SupaResponse } from 'types/base'

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

export async function updateOrgSubscription<T = any>({
  slug,
  tier,
  paymentMethod,
}: OrgSubscriptionUpdateVariables): Promise<SupaResponse<T>> {
  if (!slug) throw new Error('slug is required')
  if (!tier) throw new Error('tier is required')

  const payload: { tier: string; payment_method?: string } = { tier }
  if (paymentMethod !== undefined) payload.payment_method = paymentMethod

  const response = await put(`${API_URL}/organizations/${slug}/billing/subscription`, payload)
  if (response.error) throw response.error

  return response as SupaResponse<T>
}

type OrgSubscriptionUpdateData = Awaited<ReturnType<typeof updateOrgSubscription>>

export const useOrgSubscriptionUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<OrgSubscriptionUpdateData, unknown, OrgSubscriptionUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrgSubscriptionUpdateData, unknown, OrgSubscriptionUpdateVariables>(
    (vars) => updateOrgSubscription(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug } = variables
        await queryClient.invalidateQueries(subscriptionKeys.orgSubscription(slug))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}

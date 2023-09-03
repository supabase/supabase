import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { put } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { subscriptionKeys } from './keys'

export type SubscriptionTier =
  | 'tier_free'
  | 'tier_pro'
  | 'tier_payg'
  | 'tier_team'
  | 'tier_enterprise'

export type ProjectSubscriptionUpdateVariables = {
  projectRef: string
  paymentMethod?: string
  tier: SubscriptionTier
}

export type ProjectSubscriptionUpdateResponse = {
  error?: any
}

export async function updateSubscriptionTier({
  projectRef,
  tier,
  paymentMethod,
}: ProjectSubscriptionUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!tier) throw new Error('tier is required')

  const payload: { tier: string; payment_method?: string } = { tier }
  if (paymentMethod !== undefined) payload.payment_method = paymentMethod

  const response = (await put(
    `${API_URL}/projects/${projectRef}/billing/subscription`,
    payload
  )) as ProjectSubscriptionUpdateResponse
  if (response.error) throw response.error

  return response
}

type ProjectSubscriptionUpdateData = Awaited<ReturnType<typeof updateSubscriptionTier>>

export const useProjectSubscriptionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    ProjectSubscriptionUpdateData,
    ResponseError,
    ProjectSubscriptionUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    ProjectSubscriptionUpdateData,
    ResponseError,
    ProjectSubscriptionUpdateVariables
  >((vars) => updateSubscriptionTier(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries(subscriptionKeys.subscriptionV2(projectRef)),
        queryClient.invalidateQueries(subscriptionKeys.addons(projectRef)),
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
  })
}

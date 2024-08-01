import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { subscriptionKeys } from './keys'

export type OrganizationBillingSubscriptionCancelScheduleVariables = {
  slug: string
}

export async function cancelSubscriptionSchedule({
  slug,
}: OrganizationBillingSubscriptionCancelScheduleVariables) {
  const { data, error } = await del(
    '/platform/organizations/{slug}/billing/subscription/schedule',
    {
      params: { path: { slug } },
    }
  )
  if (error) handleError(error)
  return data
}

export const useOrganizationBillingSubscriptionCancelSchedule = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<never, ResponseError, OrganizationBillingSubscriptionCancelScheduleVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<never, ResponseError, OrganizationBillingSubscriptionCancelScheduleVariables>(
    (vars) => cancelSubscriptionSchedule(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(subscriptionKeys.orgSubscription(variables.slug))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to cancel subscription schedule: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

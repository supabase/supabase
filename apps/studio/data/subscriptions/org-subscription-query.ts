import { createQuery } from 'react-query-kit'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type OrgSubscriptionVariables = {
  orgSlug: string
}

export type PlanType = components['schemas']['BillingPlanId']

export async function getOrgSubscription(
  { orgSlug }: OrgSubscriptionVariables,
  { signal }: { signal: AbortSignal }
) {
  const { error, data } = await get('/platform/organizations/{slug}/billing/subscription', {
    params: { path: { slug: orgSlug } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrgSubscriptionData = Awaited<ReturnType<typeof getOrgSubscription>>
export type OrgSubscriptionError = ResponseError

export const useOrgSubscriptionQuery = createQuery<
  OrgSubscriptionData,
  OrgSubscriptionVariables,
  OrgSubscriptionError
>({
  queryKey: ['organizations', 'subscription'],
  fetcher: getOrgSubscription,
})

// const canReadSubscriptions = useCheckPermissions(
//   PermissionAction.BILLING_READ,
//   'stripe.subscriptions'
// )

export const useHasAccessToProjectLevelPermissions = (slug: string) => {
  const { data: subscription } = useOrgSubscriptionQuery({ variables: { orgSlug: slug } })
  return subscription?.plan.id === 'enterprise'
}

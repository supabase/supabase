import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { ResponseError } from 'types'
import { subscriptionKeys } from './keys'
import { components } from 'api-types'

export type OrgSubscriptionVariables = {
  orgSlug?: string
}

export type PlanType = components['schemas']['BillingPlanId']

export async function getOrgSubscription(
  { orgSlug }: OrgSubscriptionVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const { error, data } = await get('/platform/organizations/{slug}/billing/subscription', {
    params: { path: { slug: orgSlug } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrgSubscriptionData = Awaited<ReturnType<typeof getOrgSubscription>>
export type OrgSubscriptionError = ResponseError

export const useOrgSubscriptionQuery = <TData = OrgSubscriptionData>(
  { orgSlug }: OrgSubscriptionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrgSubscriptionData, OrgSubscriptionError, TData> = {}
) => {
  // [Joshen] Thinking it makes sense to add this check at the RQ level - prevent
  // unnecessary requests, although this behaviour still needs handling on the UI
  const canReadSubscriptions = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  return useQuery<OrgSubscriptionData, OrgSubscriptionError, TData>(
    subscriptionKeys.orgSubscription(orgSlug),
    ({ signal }) => getOrgSubscription({ orgSlug }, signal),
    {
      enabled: enabled && canReadSubscriptions && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
}

export const useHasAccessToProjectLevelPermissions = (slug: string) => {
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: slug })
  return subscription?.plan.id === 'enterprise'
}
